import React, { useRef, useEffect, useCallback } from 'react';
import { DrawingData, DrawingStroke } from '../types/ElementLibrary';

interface DrawingPlayerProps {
  drawingData: DrawingData;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  onComplete?: () => void;
  autoPlay?: boolean;
  speed?: number;
}

const DrawingPlayer: React.FC<DrawingPlayerProps> = ({
  drawingData,
  x,
  y,
  scale = 1,
  rotation = 0,
  onComplete,
  autoPlay = true,
  speed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const drawStroke = useCallback((
    ctx: CanvasRenderingContext2D,
    stroke: DrawingStroke,
    progress: number,
    offsetX: number,
    offsetY: number,
    drawScale: number
  ) => {
    if (stroke.points.length < 2) return;

    const pointsToDraw = Math.floor(stroke.points.length * progress);
    if (pointsToDraw < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * drawScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const firstPoint = stroke.points[0];
    ctx.moveTo(
      offsetX + firstPoint.x * drawScale,
      offsetY + firstPoint.y * drawScale
    );

    for (let i = 1; i < pointsToDraw; i++) {
      const point = stroke.points[i];
      ctx.lineTo(
        offsetX + point.x * drawScale,
        offsetY + point.y * drawScale
      );
    }

    ctx.stroke();
    ctx.restore();
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !drawingData) return;

    const elapsed = (Date.now() - startTimeRef.current) * speed;
    const progress = elapsed / drawingData.totalDuration;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bbox = drawingData.boundingBox;
    const drawingWidth = bbox.maxX - bbox.minX;
    const drawingHeight = bbox.maxY - bbox.minY;

    const targetWidth = drawingWidth * scale;
    const targetHeight = drawingHeight * scale;
    const drawScale = scale;

    const offsetX = x - (bbox.minX * drawScale);
    const offsetY = y - (bbox.minY * drawScale);

    ctx.save();
    if (rotation !== 0) {
      const centerX = x + (targetWidth / 2);
      const centerY = y + (targetHeight / 2);
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    drawingData.strokes.forEach(stroke => {
      if (elapsed >= stroke.startTime) {
        const strokeDuration = stroke.endTime - stroke.startTime;
        const strokeElapsed = elapsed - stroke.startTime;
        const strokeProgress = Math.min(1, strokeElapsed / strokeDuration);
        drawStroke(ctx, stroke, strokeProgress, offsetX, offsetY, drawScale);
      }
    });

    ctx.restore();

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      drawingData.strokes.forEach(stroke => {
        drawStroke(ctx, stroke, 1, offsetX, offsetY, drawScale);
      });
      onComplete?.();
    }
  }, [drawingData, x, y, scale, rotation, speed, drawStroke, onComplete]);

  useEffect(() => {
    if (autoPlay && drawingData) {
      startTimeRef.current = Date.now();
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoPlay, drawingData, animate]);

  const bbox = drawingData?.boundingBox;
  const canvasWidth = bbox ? (bbox.maxX - bbox.minX) * scale + x * 2 : 400;
  const canvasHeight = bbox ? (bbox.maxY - bbox.minY) * scale + y * 2 : 400;

  return (
    <canvas
      ref={canvasRef}
      width={Math.max(canvasWidth, 100)}
      height={Math.max(canvasHeight, 100)}
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: canvasWidth,
        height: canvasHeight,
      }}
    />
  );
};

export default DrawingPlayer;
