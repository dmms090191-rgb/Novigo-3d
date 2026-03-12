import React, { useRef, useEffect, useState } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface TravelingParticle {
  edgeIndex: number;
  progress: number;
  speed: number;
  size: number;
  hue: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

interface FloatingParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  size: number;
  hue: number;
}

interface DrawnEdge {
  edgeIndex: number;
  progress: number;
  glowIntensity: number;
}

const HouseWireframe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const travelingParticlesRef = useRef<TravelingParticle[]>([]);
  const floatingParticlesRef = useRef<FloatingParticle[]>([]);
  const drawnEdgesRef = useRef<DrawnEdge[]>([]);
  const drawingCursorRef = useRef({ edgeIndex: 0, progress: 0, active: true });
  const initializedRef = useRef(false);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Math.min(window.innerWidth * 0.9, 1000),
        height: Math.min(window.innerHeight * 0.5, 500)
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const scale = Math.min(dimensions.width, dimensions.height) * 0.28;

    const housePoints: Point3D[] = [
      { x: -1, y: 0.5, z: -0.8 },
      { x: 1, y: 0.5, z: -0.8 },
      { x: 1, y: 0.5, z: 0.8 },
      { x: -1, y: 0.5, z: 0.8 },
      { x: -1, y: -0.5, z: -0.8 },
      { x: 1, y: -0.5, z: -0.8 },
      { x: 1, y: -0.5, z: 0.8 },
      { x: -1, y: -0.5, z: 0.8 },
      { x: 0, y: -1.1, z: 0 },
      { x: -1.05, y: -0.5, z: -0.85 },
      { x: 1.05, y: -0.5, z: -0.85 },
      { x: 1.05, y: -0.5, z: 0.85 },
      { x: -1.05, y: -0.5, z: 0.85 },
      { x: -0.25, y: 0.5, z: 0.81 },
      { x: 0.25, y: 0.5, z: 0.81 },
      { x: 0.25, y: -0.05, z: 0.81 },
      { x: -0.25, y: -0.05, z: 0.81 },
      { x: -0.65, y: 0.05, z: 0.81 },
      { x: -0.4, y: 0.05, z: 0.81 },
      { x: -0.4, y: -0.2, z: 0.81 },
      { x: -0.65, y: -0.2, z: 0.81 },
      { x: 0.4, y: 0.05, z: 0.81 },
      { x: 0.65, y: 0.05, z: 0.81 },
      { x: 0.65, y: -0.2, z: 0.81 },
      { x: 0.4, y: -0.2, z: 0.81 },
    ];

    const edges: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
      [4, 8], [5, 8], [6, 8], [7, 8],
      [9, 10], [10, 11], [11, 12], [12, 9],
      [4, 9], [5, 10], [6, 11], [7, 12],
      [13, 14], [14, 15], [15, 16], [16, 13],
      [17, 18], [18, 19], [19, 20], [20, 17],
      [21, 22], [22, 23], [23, 24], [24, 21],
    ];

    const drawingOrder = [
      0, 1, 2, 3,
      8, 9, 10, 11,
      4, 5, 6, 7,
      12, 13, 14, 15,
      16, 17, 18, 19,
      20, 21, 22, 23,
      24, 25, 26, 27,
      28, 29, 30, 31,
      32, 33, 34, 35
    ];

    if (!initializedRef.current) {
      initializedRef.current = true;
      drawnEdgesRef.current = [];
      drawingCursorRef.current = { edgeIndex: 0, progress: 0, active: true };
      travelingParticlesRef.current = [];
      floatingParticlesRef.current = [];
    }

    const rotateY = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x * cos - point.z * sin,
        y: point.y,
        z: point.x * sin + point.z * cos
      };
    };

    const rotateX = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x,
        y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos
      };
    };

    const project = (point: Point3D): { x: number; y: number; depth: number } => {
      const perspective = 3;
      const factor = perspective / (perspective + point.z);
      return {
        x: centerX + point.x * scale * factor,
        y: centerY + point.y * scale * factor,
        depth: point.z
      };
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const baseRotationY = time * 0.2;
      const baseRotationX = Math.sin(time * 0.12) * 0.1 - 0.2;

      const mouseInfluenceX = (mouseRef.current.x - centerX) / dimensions.width * 0.3;
      const mouseInfluenceY = (mouseRef.current.y - centerY) / dimensions.height * 0.3;

      const rotationY_val = baseRotationY + mouseInfluenceX;
      const rotationX_val = baseRotationX + mouseInfluenceY;

      const transformedPoints = housePoints.map(point => {
        const rotatedY = rotateY(point, rotationY_val);
        const rotatedXY = rotateX(rotatedY, rotationX_val);
        return rotatedXY;
      });

      const projectedPoints = transformedPoints.map(point => project(point));

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const cursor = drawingCursorRef.current;
      if (cursor.active && cursor.edgeIndex < drawingOrder.length) {
        cursor.progress += 0.025;

        if (cursor.progress >= 1) {
          const actualEdgeIndex = drawingOrder[cursor.edgeIndex];
          drawnEdgesRef.current.push({
            edgeIndex: actualEdgeIndex,
            progress: 1,
            glowIntensity: 2
          });

          if (drawnEdgesRef.current.length % 4 === 0 && travelingParticlesRef.current.length < 20) {
            const randomDrawnEdge = drawnEdgesRef.current[Math.floor(Math.random() * drawnEdgesRef.current.length)];
            travelingParticlesRef.current.push({
              edgeIndex: randomDrawnEdge.edgeIndex,
              progress: Math.random(),
              speed: 0.004 + Math.random() * 0.006,
              size: 3 + Math.random() * 3,
              hue: 180 + Math.random() * 40,
              trail: []
            });
          }

          cursor.edgeIndex++;
          cursor.progress = 0;
        }
      }

      drawnEdgesRef.current.forEach(drawnEdge => {
        drawnEdge.glowIntensity = Math.max(1, drawnEdge.glowIntensity * 0.98);
      });

      drawnEdgesRef.current.forEach(({ edgeIndex, glowIntensity }) => {
        const edge = edges[edgeIndex];
        const p1 = projectedPoints[edge[0]];
        const p2 = projectedPoints[edge[1]];

        const avgDepth = (p1.depth + p2.depth) / 2;
        const depthFactor = Math.max(0.3, 1 - (avgDepth + 1) * 0.3);
        const pulse = 1 + Math.sin(time * 4 + edgeIndex) * 0.1;

        for (let layer = 3; layer >= 0; layer--) {
          const layerAlpha = (0.15 - layer * 0.03) * depthFactor * glowIntensity;
          const layerWidth = (12 - layer * 2) * depthFactor * pulse;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);

          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          const hue1 = 185 + Math.sin(time * 2 + edgeIndex * 0.2) * 15;
          const hue2 = 195 + Math.cos(time * 2 + edgeIndex * 0.2) * 15;
          gradient.addColorStop(0, `hsla(${hue1}, 100%, 60%, ${layerAlpha})`);
          gradient.addColorStop(0.5, `hsla(${(hue1 + hue2) / 2}, 100%, 70%, ${layerAlpha * 1.2})`);
          gradient.addColorStop(1, `hsla(${hue2}, 100%, 60%, ${layerAlpha})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = layerWidth;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        const coreGradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        coreGradient.addColorStop(0, `rgba(150, 255, 255, ${depthFactor * 0.9})`);
        coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${depthFactor})`);
        coreGradient.addColorStop(1, `rgba(150, 255, 255, ${depthFactor * 0.9})`);

        ctx.strokeStyle = coreGradient;
        ctx.lineWidth = 2 * depthFactor * pulse;
        ctx.stroke();
      });

      if (cursor.active && cursor.edgeIndex < drawingOrder.length) {
        const actualEdgeIndex = drawingOrder[cursor.edgeIndex];
        const edge = edges[actualEdgeIndex];
        const p1 = projectedPoints[edge[0]];
        const p2 = projectedPoints[edge[1]];

        const currentX = lerp(p1.x, p2.x, cursor.progress);
        const currentY = lerp(p1.y, p2.y, cursor.progress);
        const currentDepth = lerp(p1.depth, p2.depth, cursor.progress);
        const depthFactor = Math.max(0.4, 1 - (currentDepth + 1) * 0.3);

        for (let layer = 4; layer >= 0; layer--) {
          const layerAlpha = (0.2 - layer * 0.035) * depthFactor;
          const layerWidth = (16 - layer * 2.5) * depthFactor;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(currentX, currentY);

          const gradient = ctx.createLinearGradient(p1.x, p1.y, currentX, currentY);
          gradient.addColorStop(0, `hsla(190, 100%, 60%, ${layerAlpha * 0.5})`);
          gradient.addColorStop(1, `hsla(190, 100%, 80%, ${layerAlpha})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = layerWidth;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = `rgba(220, 255, 255, ${depthFactor})`;
        ctx.lineWidth = 2.5 * depthFactor;
        ctx.stroke();

        const cursorPulse = 1 + Math.sin(time * 15) * 0.4;

        for (let ring = 4; ring >= 0; ring--) {
          const ringSize = (25 - ring * 4) * depthFactor * cursorPulse;
          const ringAlpha = (0.3 - ring * 0.05) * depthFactor;

          const gradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, ringSize);
          gradient.addColorStop(0, `hsla(190, 100%, 90%, ${ringAlpha})`);
          gradient.addColorStop(0.3, `hsla(185, 100%, 70%, ${ringAlpha * 0.7})`);
          gradient.addColorStop(0.6, `hsla(180, 100%, 50%, ${ringAlpha * 0.3})`);
          gradient.addColorStop(1, 'hsla(180, 100%, 50%, 0)');

          ctx.beginPath();
          ctx.arc(currentX, currentY, ringSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(100, 255, 255, 0.8)';

        ctx.beginPath();
        ctx.arc(currentX, currentY, 6 * depthFactor * cursorPulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fill();

        ctx.shadowBlur = 0;

        if (Math.random() < 0.4) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkDist = Math.random() * 20;
          floatingParticlesRef.current.push({
            x: currentX + Math.cos(sparkAngle) * sparkDist,
            y: currentY + Math.sin(sparkAngle) * sparkDist,
            z: currentDepth,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 1,
            vz: (Math.random() - 0.5) * 0.3,
            life: 1,
            size: 1 + Math.random() * 2,
            hue: 180 + Math.random() * 30
          });
        }
      }

      if (drawnEdgesRef.current.length > 0) {
        travelingParticlesRef.current.forEach(particle => {
          particle.progress += particle.speed;

          if (particle.progress >= 1) {
            particle.progress = 0;
            const currentEdge = edges[particle.edgeIndex];
            const endPoint = currentEdge[1];

            const drawnEdgeIndices = drawnEdgesRef.current.map(de => de.edgeIndex);
            const connectedEdges = drawnEdgeIndices
              .map(idx => ({ edge: edges[idx], idx }))
              .filter(({ edge, idx }) =>
                idx !== particle.edgeIndex &&
                (edge[0] === endPoint || edge[1] === endPoint)
              );

            if (connectedEdges.length > 0) {
              const nextEdgeData = connectedEdges[Math.floor(Math.random() * connectedEdges.length)];
              particle.edgeIndex = nextEdgeData.idx;
              if (nextEdgeData.edge[1] === endPoint) {
                edges[nextEdgeData.idx] = [nextEdgeData.edge[1], nextEdgeData.edge[0]];
              }
            }
          }

          const edge = edges[particle.edgeIndex];
          const startPoint = projectedPoints[edge[0]];
          const endPoint = projectedPoints[edge[1]];

          const currentX = lerp(startPoint.x, endPoint.x, particle.progress);
          const currentY = lerp(startPoint.y, endPoint.y, particle.progress);
          const currentDepth = lerp(startPoint.depth, endPoint.depth, particle.progress);
          const depthFactor = Math.max(0.4, 1 - (currentDepth + 1) * 0.3);

          particle.trail.unshift({ x: currentX, y: currentY, alpha: 1 });
          if (particle.trail.length > 15) {
            particle.trail.pop();
          }

          particle.trail.forEach((trailPoint, i) => {
            trailPoint.alpha = 1 - (i / particle.trail.length);
            const trailSize = particle.size * trailPoint.alpha * depthFactor * 0.5;

            if (trailSize > 0.3) {
              const gradient = ctx.createRadialGradient(
                trailPoint.x, trailPoint.y, 0,
                trailPoint.x, trailPoint.y, trailSize * 2.5
              );
              gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 80%, ${trailPoint.alpha * 0.6 * depthFactor})`);
              gradient.addColorStop(0.4, `hsla(${particle.hue + 10}, 90%, 60%, ${trailPoint.alpha * 0.3 * depthFactor})`);
              gradient.addColorStop(1, `hsla(${particle.hue}, 80%, 50%, 0)`);

              ctx.beginPath();
              ctx.arc(trailPoint.x, trailPoint.y, trailSize * 2.5, 0, Math.PI * 2);
              ctx.fillStyle = gradient;
              ctx.fill();
            }
          });

          const pulseSize = particle.size * depthFactor * (1 + Math.sin(time * 10 + particle.edgeIndex) * 0.25);

          const outerGlow = ctx.createRadialGradient(
            currentX, currentY, 0,
            currentX, currentY, pulseSize * 4
          );
          outerGlow.addColorStop(0, `hsla(${particle.hue}, 100%, 85%, ${depthFactor * 0.9})`);
          outerGlow.addColorStop(0.2, `hsla(${particle.hue}, 100%, 70%, ${depthFactor * 0.6})`);
          outerGlow.addColorStop(0.5, `hsla(${particle.hue + 15}, 90%, 55%, ${depthFactor * 0.3})`);
          outerGlow.addColorStop(1, `hsla(${particle.hue}, 80%, 50%, 0)`);

          ctx.beginPath();
          ctx.arc(currentX, currentY, pulseSize * 4, 0, Math.PI * 2);
          ctx.fillStyle = outerGlow;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(currentX, currentY, pulseSize * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${depthFactor})`;
          ctx.fill();

          if (Math.random() < 0.08) {
            floatingParticlesRef.current.push({
              x: currentX,
              y: currentY,
              z: currentDepth,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5 - 0.5,
              vz: (Math.random() - 0.5) * 0.3,
              life: 1,
              size: 0.5 + Math.random() * 1.5,
              hue: particle.hue
            });
          }
        });
      }

      floatingParticlesRef.current = floatingParticlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy += 0.03;
        p.life -= 0.015;

        if (p.life <= 0) return false;

        const alpha = p.life * p.life;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 80%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${p.hue + 10}, 90%, 60%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        return true;
      });

      projectedPoints.forEach((point, index) => {
        const isConnected = drawnEdgesRef.current.some(de => {
          const edge = edges[de.edgeIndex];
          return edge[0] === index || edge[1] === index;
        });

        if (!isConnected) return;

        const depthFactor = Math.max(0.3, 1 - (point.depth + 1) * 0.35);
        const pulse = 1 + Math.sin(time * 4 + index * 0.7) * 0.15;
        const size = 2.5 * depthFactor * pulse;

        for (let ring = 2; ring >= 0; ring--) {
          const ringSize = size * (3 - ring);
          const ringAlpha = (0.2 - ring * 0.05) * depthFactor;

          const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, ringSize);
          gradient.addColorStop(0, `rgba(100, 220, 255, ${ringAlpha})`);
          gradient.addColorStop(0.5, `rgba(50, 180, 220, ${ringAlpha * 0.5})`);
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

          ctx.beginPath();
          ctx.arc(point.x, point.y, ringSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 250, 255, ${depthFactor * 0.95})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dimensions]);

  return (
    <div className="relative w-full flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-2xl cursor-crosshair"
        style={{
          background: 'transparent'
        }}
      />
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
        boxShadow: 'inset 0 0 100px rgba(6, 182, 212, 0.1)'
      }} />
    </div>
  );
};

export default HouseWireframe;
