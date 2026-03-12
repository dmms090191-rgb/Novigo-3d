import React, { useRef, useEffect, useCallback } from 'react';
import { DrawingData, DrawingStroke, LibraryElement, ScenePlacedElement } from '../types/ElementLibrary';

interface SceneElementPlayerProps {
  placedElements: ScenePlacedElement[];
  elements: Map<string, LibraryElement>;
  canvasWidth: number;
  canvasHeight: number;
  onDrawingComplete?: (placedElementId: string) => void;
  viewOffset?: { x: number; y: number };
  zoom?: number;
}

const SceneElementPlayer: React.FC<SceneElementPlayerProps> = ({
  placedElements,
  elements,
  canvasWidth,
  canvasHeight,
  onDrawingComplete,
  viewOffset = { x: 0, y: 0 },
  zoom = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationStateRef = useRef<Map<string, { startTime: number; completed: boolean; trailPoints: Array<{ x: number; y: number; alpha: number }> }>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  const drawStrokeBlueprint = useCallback((
    ctx: CanvasRenderingContext2D,
    stroke: DrawingStroke,
    progress: number,
    offsetX: number,
    offsetY: number,
    scale: number,
    trailPoints: Array<{ x: number; y: number; alpha: number }>
  ): { currentX: number; currentY: number } | null => {
    if (stroke.points.length < 2) return null;

    const pointsToDraw = Math.floor(stroke.points.length * progress);
    if (pointsToDraw < 2) return null;

    for (let glow = 4; glow >= 0; glow--) {
      const glowAlpha = 0.08 - glow * 0.015;
      const glowWidth = (stroke.width * scale * 0.8) + (12 - glow * 2.5);

      ctx.beginPath();
      ctx.strokeStyle = `rgba(80, 180, 255, ${glowAlpha})`;
      ctx.lineWidth = glowWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(offsetX + stroke.points[0].x * scale, offsetY + stroke.points[0].y * scale);
      for (let i = 1; i < pointsToDraw; i++) {
        ctx.lineTo(offsetX + stroke.points[i].x * scale, offsetY + stroke.points[i].y * scale);
      }
      ctx.stroke();
    }

    ctx.beginPath();
    const gradient = ctx.createLinearGradient(
      offsetX + stroke.points[0].x * scale,
      offsetY + stroke.points[0].y * scale,
      offsetX + stroke.points[pointsToDraw - 1].x * scale,
      offsetY + stroke.points[pointsToDraw - 1].y * scale
    );
    gradient.addColorStop(0, 'rgba(120, 200, 255, 0.95)');
    gradient.addColorStop(0.5, 'rgba(200, 240, 255, 1)');
    gradient.addColorStop(1, 'rgba(120, 200, 255, 0.95)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = stroke.width * scale * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(offsetX + stroke.points[0].x * scale, offsetY + stroke.points[0].y * scale);
    for (let i = 1; i < pointsToDraw; i++) {
      ctx.lineTo(offsetX + stroke.points[i].x * scale, offsetY + stroke.points[i].y * scale);
    }
    ctx.stroke();

    const lastPoint = stroke.points[pointsToDraw - 1];
    return { x: offsetX + lastPoint.x * scale, y: offsetY + lastPoint.y * scale };
  }, []);

  const drawShootingStar = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    time: number
  ) => {
    const starPulse = 1 + Math.sin(time * 20) * 0.3;

    for (let ring = 5; ring >= 0; ring--) {
      const ringSize = (35 - ring * 5) * starPulse;
      const ringAlpha = 0.3 - ring * 0.04;

      const starGlow = ctx.createRadialGradient(x, y, 0, x, y, ringSize);
      starGlow.addColorStop(0, `rgba(255, 255, 255, ${ringAlpha})`);
      starGlow.addColorStop(0.15, `rgba(200, 240, 255, ${ringAlpha * 0.8})`);
      starGlow.addColorStop(0.4, `rgba(100, 180, 255, ${ringAlpha * 0.4})`);
      starGlow.addColorStop(0.7, `rgba(60, 120, 200, ${ringAlpha * 0.2})`);
      starGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(x, y, ringSize, 0, Math.PI * 2);
      ctx.fillStyle = starGlow;
      ctx.fill();
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 3);

    const rayLength = 20 * starPulse;
    const rayCount = 4;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);

      const rayGradient = ctx.createLinearGradient(0, 0, rayLength, 0);
      rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      rayGradient.addColorStop(0.3, 'rgba(150, 220, 255, 0.4)');
      rayGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rayLength, -1.5);
      ctx.lineTo(rayLength * 1.2, 0);
      ctx.lineTo(rayLength, 1.5);
      ctx.closePath();
      ctx.fillStyle = rayGradient;
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, 3 * starPulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fill();
  }, []);

  const drawTrailPoints = useCallback((
    ctx: CanvasRenderingContext2D,
    trailPoints: Array<{ x: number; y: number; alpha: number }>
  ) => {
    trailPoints.forEach(point => {
      const trailGlow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 6);
      trailGlow.addColorStop(0, `rgba(150, 220, 255, ${point.alpha * 0.5})`);
      trailGlow.addColorStop(0.5, `rgba(80, 160, 255, ${point.alpha * 0.2})`);
      trailGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = trailGlow;
      ctx.fill();
    });
  }, []);

  const drawNodeGlow = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    time: number
  ) => {
    const pulse = 1 + Math.sin(time * 4) * 0.15;
    const size = 2.5 * pulse;

    for (let ring = 2; ring >= 0; ring--) {
      const ringSize = size * (3 - ring * 0.7);
      const ringAlpha = 0.25 - ring * 0.06;

      const nodeGlow = ctx.createRadialGradient(x, y, 0, x, y, ringSize);
      nodeGlow.addColorStop(0, `rgba(200, 240, 255, ${ringAlpha})`);
      nodeGlow.addColorStop(0.4, `rgba(100, 180, 255, ${ringAlpha * 0.5})`);
      nodeGlow.addColorStop(1, 'rgba(60, 120, 200, 0)');

      ctx.beginPath();
      ctx.arc(x, y, ringSize, 0, Math.PI * 2);
      ctx.fillStyle = nodeGlow;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
  }, []);

  const drawElement = useCallback((
    ctx: CanvasRenderingContext2D,
    placedEl: ScenePlacedElement,
    element: LibraryElement,
    animProgress: number,
    time: number,
    trailPoints: Array<{ x: number; y: number; alpha: number }>
  ) => {
    const drawing = element.drawing_data;
    if (!drawing || !drawing.strokes || drawing.strokes.length === 0) return;

    const bbox = drawing.boundingBox;
    const drawingWidth = bbox.maxX - bbox.minX;
    const drawingHeight = bbox.maxY - bbox.minY;

    const targetScale = placedEl.scale * zoom * 0.5;

    const centerX = (placedEl.x + viewOffset.x) * zoom;
    const centerY = (placedEl.y + viewOffset.y) * zoom;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((placedEl.rotation * Math.PI) / 180);

    const offsetX = -(drawingWidth * targetScale) / 2 - bbox.minX * targetScale;
    const offsetY = -(drawingHeight * targetScale) / 2 - bbox.minY * targetScale;

    const elapsed = animProgress * drawing.totalDuration;
    let currentStarPos: { x: number; y: number } | null = null;
    const drawnNodes: Array<{ x: number; y: number }> = [];

    drawTrailPoints(ctx, trailPoints);

    drawing.strokes.forEach(stroke => {
      if (elapsed >= stroke.startTime) {
        const strokeDuration = stroke.endTime - stroke.startTime;
        const strokeElapsed = elapsed - stroke.startTime;
        const strokeProgress = Math.min(1, strokeElapsed / strokeDuration);

        const starPos = drawStrokeBlueprint(ctx, stroke, strokeProgress, offsetX, offsetY, targetScale, trailPoints);

        if (starPos && strokeProgress < 1) {
          currentStarPos = starPos;
        }

        if (strokeProgress > 0 && stroke.points.length > 0) {
          const firstPoint = stroke.points[0];
          drawnNodes.push({ x: offsetX + firstPoint.x * targetScale, y: offsetY + firstPoint.y * targetScale });
        }
        if (strokeProgress >= 1 && stroke.points.length > 1) {
          const lastPoint = stroke.points[stroke.points.length - 1];
          drawnNodes.push({ x: offsetX + lastPoint.x * targetScale, y: offsetY + lastPoint.y * targetScale });
        }
      }
    });

    drawnNodes.forEach(node => {
      drawNodeGlow(ctx, node.x, node.y, time);
    });

    if (currentStarPos && animProgress < 1) {
      drawShootingStar(ctx, currentStarPos.x, currentStarPos.y, time);

      if (Math.random() < 0.3) {
        trailPoints.push({ x: currentStarPos.x, y: currentStarPos.y, alpha: 1 });
      }
    }

    ctx.restore();
  }, [viewOffset, zoom, drawStrokeBlueprint, drawShootingStar, drawTrailPoints, drawNodeGlow]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let isRunning = true;
    const startTime = Date.now();

    const animate = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();
      const globalTime = (now - startTime) / 1000;

      placedElements.forEach(placedEl => {
        const element = elements.get(placedEl.elementId);
        if (!element || !element.drawing_data) return;

        let state = animationStateRef.current.get(placedEl.id);
        if (!state) {
          state = { startTime: now, completed: false, trailPoints: [] };
          animationStateRef.current.set(placedEl.id, state);
        }

        state.trailPoints = state.trailPoints.filter(point => {
          point.alpha -= 0.015;
          return point.alpha > 0;
        });

        const elapsed = now - state.startTime;
        const totalDuration = element.drawing_data.totalDuration;
        let progress = elapsed / totalDuration;

        if (progress >= 1) {
          progress = 1;
          if (!state.completed) {
            state.completed = true;
            onDrawingComplete?.(placedEl.id);
          }
        }

        drawElement(ctx, placedEl, element, progress, globalTime, state.trailPoints);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [placedElements, elements, canvasWidth, canvasHeight, viewOffset, zoom, drawElement, onDrawingComplete]);

  useEffect(() => {
    const currentIds = new Set(placedElements.map(e => e.id));
    animationStateRef.current.forEach((_, id) => {
      if (!currentIds.has(id)) {
        animationStateRef.current.delete(id);
      }
    });
  }, [placedElements]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="absolute top-0 left-0 pointer-events-none z-20"
      style={{ width: canvasWidth, height: canvasHeight }}
    />
  );
};

export default SceneElementPlayer;
