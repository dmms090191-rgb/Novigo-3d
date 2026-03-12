import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Square, Trash2, Save, RotateCcw, Palette, Minus, Plus, X, Eye } from 'lucide-react';
import { DrawingData, DrawingStroke, DrawingPoint } from '../types/ElementLibrary';
import Drawing3DPreview from './Drawing3DPreview';

interface DrawingRecorderProps {
  onSave: (drawingData: DrawingData, previewImage: string) => void;
  onCancel: () => void;
  elementName: string;
  initialDrawing?: DrawingData | null;
}

const COLORS = [
  '#00B4D8', '#06D6A0', '#FFD166', '#EF476F', '#118AB2',
  '#073B4C', '#FFFFFF', '#F8F9FA', '#ADB5BD', '#495057',
];

const DrawingRecorder: React.FC<DrawingRecorderProps> = ({
  onSave,
  onCancel,
  elementName,
  initialDrawing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#00B4D8');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [show3DPreview, setShow3DPreview] = useState(false);
  const playbackRef = useRef<number | null>(null);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): DrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      timestamp: Date.now() - recordingStartTime,
    };
  }, [recordingStartTime]);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke, progress = 1) => {
    if (stroke.points.length < 2) return;

    const pointsToDraw = Math.floor(stroke.points.length * progress);
    if (pointsToDraw < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < pointsToDraw; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#0a1929';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 180, 216, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    strokes.forEach(stroke => drawStroke(ctx, stroke));

    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      currentStroke.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }, [strokes, currentStroke, strokeColor, strokeWidth, drawStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    if (initialDrawing && initialDrawing.strokes.length > 0) {
      setStrokes(initialDrawing.strokes);
    }
  }, [initialDrawing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRecording || isPlaying) return;
    const point = getCanvasPoint(e);
    if (point) {
      setIsDrawing(true);
      setCurrentStroke([point]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !isRecording || isPlaying) return;
    const point = getCanvasPoint(e);
    if (point) {
      setCurrentStroke(prev => [...prev, point]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }

    const newStroke: DrawingStroke = {
      points: currentStroke,
      color: strokeColor,
      width: strokeWidth,
      startTime: currentStroke[0].timestamp,
      endTime: currentStroke[currentStroke.length - 1].timestamp,
    };

    setStrokes(prev => [...prev, newStroke]);
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isRecording || isPlaying) return;
    const point = getCanvasPoint(e);
    if (point) {
      setIsDrawing(true);
      setCurrentStroke([point]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !isRecording || isPlaying) return;
    const point = getCanvasPoint(e);
    if (point) {
      setCurrentStroke(prev => [...prev, point]);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(Date.now());
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const clearDrawing = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  const playDrawing = () => {
    if (strokes.length === 0) return;

    setIsPlaying(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const totalDuration = Math.max(...strokes.map(s => s.endTime));
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / totalDuration;

      ctx.fillStyle = '#0a1929';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(0, 180, 216, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      strokes.forEach(stroke => {
        if (elapsed >= stroke.startTime) {
          const strokeDuration = stroke.endTime - stroke.startTime;
          const strokeElapsed = elapsed - stroke.startTime;
          const strokeProgress = Math.min(1, strokeElapsed / strokeDuration);
          drawStroke(ctx, stroke, strokeProgress);
        }
      });

      if (progress < 1) {
        playbackRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        redrawCanvas();
      }
    };

    playbackRef.current = requestAnimationFrame(animate);
  };

  const stopPlayback = () => {
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
      playbackRef.current = null;
    }
    setIsPlaying(false);
    redrawCanvas();
  };

  const generatePreview = (): string => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return '';

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#0a1929';
    ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (strokes.length === 0) return previewCanvas.toDataURL('image/png');

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach(stroke => {
      stroke.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    const padding = 10;
    const drawingWidth = maxX - minX + padding * 2;
    const drawingHeight = maxY - minY + padding * 2;
    const scale = Math.min(
      previewCanvas.width / drawingWidth,
      previewCanvas.height / drawingHeight
    ) * 0.9;

    const offsetX = (previewCanvas.width - drawingWidth * scale) / 2 - (minX - padding) * scale;
    const offsetY = (previewCanvas.height - drawingHeight * scale) / 2 - (minY - padding) * scale;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    ctx.restore();

    return previewCanvas.toDataURL('image/png');
  };

  const getDrawingData = useCallback((): DrawingData | null => {
    if (strokes.length === 0) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach(stroke => {
      stroke.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    return {
      strokes,
      totalDuration: Math.max(...strokes.map(s => s.endTime)),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      boundingBox: { minX, minY, maxX, maxY },
    };
  }, [strokes]);

  const handleSave = () => {
    const drawingData = getDrawingData();
    if (!drawingData) return;

    const previewImage = generatePreview();
    onSave(drawingData, previewImage);
  };

  const handleOpen3DPreview = () => {
    if (strokes.length === 0) return;
    setShow3DPreview(true);
  };

  const handleSaveFrom3DPreview = () => {
    handleSave();
    setShow3DPreview(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0a1929] border border-cyan-700/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-cyan-700/30">
          <div>
            <h2 className="text-lg font-bold text-cyan-200 uppercase tracking-wider">
              Enregistrement du dessin
            </h2>
            <p className="text-sm text-cyan-500/50">{elementName}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          <div className="flex gap-4 mb-4">
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all text-sm font-semibold uppercase"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  Enregistrer
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/30 border border-red-400 text-red-300 hover:bg-red-500/40 transition-all text-sm font-semibold uppercase"
                >
                  <Square className="w-4 h-4" />
                  Arreter
                </button>
              )}

              <button
                onClick={isPlaying ? stopPlayback : playDrawing}
                disabled={strokes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 transition-all text-sm font-semibold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Stop' : 'Jouer'}
              </button>

              <button
                onClick={clearDrawing}
                disabled={strokes.length === 0 || isPlaying}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 hover:bg-gray-500/30 transition-all text-sm font-semibold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Effacer
              </button>

              <button
                onClick={handleOpen3DPreview}
                disabled={strokes.length === 0 || isPlaying}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-semibold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                Preview 3D
              </button>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-gray-500" />
                <div className="flex gap-1">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setStrokeColor(color)}
                      className={`w-6 h-6 rounded border-2 transition-all ${
                        strokeColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
                  className="p-1 text-gray-500 hover:text-cyan-400"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm text-cyan-400 w-6 text-center">{strokeWidth}</span>
                <button
                  onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))}
                  className="p-1 text-gray-500 hover:text-cyan-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="relative bg-[#071018] border border-cyan-700/30 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />

            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400 font-mono uppercase">Enregistrement</span>
              </div>
            )}

            {!isRecording && strokes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-cyan-500/30 text-lg">
                  Cliquez sur "Enregistrer" puis dessinez
                </p>
              </div>
            )}
          </div>

          <canvas ref={previewCanvasRef} width={200} height={200} className="hidden" />

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-cyan-500/50">
              {strokes.length} trait{strokes.length !== 1 ? 's' : ''} enregistre{strokes.length !== 1 ? 's' : ''}
              {strokes.length > 0 && (
                <span className="ml-2">
                  | Duree: {(Math.max(...strokes.map(s => s.endTime)) / 1000).toFixed(1)}s
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 hover:bg-gray-500/30 transition-all font-semibold text-sm uppercase"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={strokes.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all font-semibold text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>

      {show3DPreview && getDrawingData() && (
        <Drawing3DPreview
          drawingData={getDrawingData()!}
          onClose={() => setShow3DPreview(false)}
          onSave={handleSaveFrom3DPreview}
          elementName={elementName}
        />
      )}
    </div>
  );
};

export default DrawingRecorder;
