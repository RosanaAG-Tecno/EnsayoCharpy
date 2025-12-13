import React, { useEffect, useRef, useState } from 'react';
import { PendulumConfig, SimulationState, Material } from '../types';
import { GRAVITY } from '../constants';

interface SimulationCanvasProps {
  config: PendulumConfig;
  material: Material | null;
  state: SimulationState;
  finalAngleResult: number;
  showMagnifier: boolean;
  onAnimationComplete: () => void;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ 
  config, 
  material, 
  state, 
  finalAngleResult,
  showMagnifier,
  onAnimationComplete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Visual state
  const [specimenBroken, setSpecimenBroken] = useState(false);

  // Physics simulation references
  const physicsState = useRef({
    angle: -config.startAngle * (Math.PI / 180), // Start on left (negative)
    velocity: 0,
    time: 0
  });

  // Reset when idle or config changes
  useEffect(() => {
    if (state === SimulationState.IDLE) {
      physicsState.current = {
        angle: -config.startAngle * (Math.PI / 180),
        velocity: 0,
        time: 0
      };
      setSpecimenBroken(false);
    }
  }, [state, config.startAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const pivotY = 80;
    const scale = 220; // pixels per meter

    // Dimensions
    const armLengthPx = config.length * scale;
    const groundY = pivotY + armLengthPx + 60; // Floor level relative to lowest point

    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- 1. Static Machine Structure ---
      
      // Floor / Base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(centerX - 150, groundY, 300, 20);
      
      // Vertical Columns (The Frame)
      ctx.fillStyle = '#94a3b8';
      // Left Column
      ctx.fillRect(centerX - 100, pivotY - 20, 20, groundY - (pivotY - 20));
      // Right Column
      ctx.fillRect(centerX + 80, pivotY - 20, 20, groundY - (pivotY - 20));

      // Crossbar at pivot
      ctx.fillStyle = '#64748b';
      ctx.fillRect(centerX - 110, pivotY - 25, 220, 50);

      // Analog Dial Gauge (at pivot)
      ctx.beginPath();
      ctx.arc(centerX, pivotY, 35, 0, Math.PI * 2);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Dial Ticks
      for (let i = -160; i <= 160; i+=20) {
        const rad = (i * Math.PI) / 180;
        const tx = centerX + Math.sin(rad) * 30;
        const ty = pivotY + Math.cos(rad) * 30;
        const tx2 = centerX + Math.sin(rad) * 25;
        const ty2 = pivotY + Math.cos(rad) * 25;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx2, ty2);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Dial Needle (Red - follows pendulum)
      const needleAngle = physicsState.current.angle;
      ctx.beginPath();
      ctx.moveTo(centerX, pivotY);
      ctx.lineTo(centerX + Math.sin(needleAngle) * 28, pivotY + Math.cos(needleAngle) * 28);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Max Hold Needle
      const maxNeedleAngle = state === SimulationState.IDLE 
        ? -config.startAngle * (Math.PI / 180) 
        : (finalAngleResult * (Math.PI / 180));
      
      if (state === SimulationState.SWINGING_UP || state === SimulationState.OSCILLATING || state === SimulationState.FINISHED) {
        ctx.beginPath();
        ctx.moveTo(centerX, pivotY);
        ctx.lineTo(centerX + Math.sin(maxNeedleAngle) * 28, pivotY + Math.cos(maxNeedleAngle) * 28);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // --- 2. Height Reference Lines ---
      const startRad = config.startAngle * (Math.PI / 180);
      const startY = pivotY + armLengthPx * Math.cos(Math.PI - startRad);

      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(centerX - 160, startY);
      ctx.lineTo(centerX - 40, startY);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`h0 (Inicio)`, centerX - 160, startY - 5);

      if (state !== SimulationState.IDLE && finalAngleResult > 0) {
        const finalRad = finalAngleResult * (Math.PI / 180);
        const finalY = pivotY + armLengthPx * Math.cos(finalRad); 
        ctx.beginPath();
        ctx.moveTo(centerX + 40, finalY);
        ctx.lineTo(centerX + 160, finalY);
        ctx.stroke();
        ctx.fillText(`hf (Final)`, centerX + 120, finalY - 5);
      }
      ctx.setLineDash([]);

      // --- 3. Specimen (Probeta) ---
      const anvilY = pivotY + armLengthPx; 
      
      // Anvil Supports (Adjusted for square specimen)
      ctx.fillStyle = '#334155';
      ctx.fillRect(centerX - 25, anvilY + 12, 15, 20); 
      ctx.fillRect(centerX + 10, anvilY + 12, 15, 20); 

      if (material) {
        // Draw as CROSS SECTION (Square) in the main view for physical accuracy
        // Impact from Left -> Hits Left Face -> Notch is on Right Face
        const specSize = 24; 
        const specX = centerX - specSize / 2;
        const specY = anvilY - specSize / 2;

        
        if (!specimenBroken) {
          ctx.fillStyle = material.color;
          ctx.fillRect(specX, specY, specSize, specSize);
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(specX, specY, specSize, specSize);
          
          // Notch on RIGHT Edge
          ctx.fillStyle = '#cbd5e1'; 
          ctx.beginPath();
          ctx.moveTo(specX + specSize, specY + specSize/2 - 4);
          ctx.lineTo(specX + specSize - 5, specY + specSize/2);
          ctx.lineTo(specX + specSize, specY + specSize/2 + 4);
          ctx.fill();
        } else {
          // Broken State: Knocked over / Split
          // Since we view cross section, we just show it displaced
          ctx.save();
          ctx.translate(specX + specSize, specY + specSize);
          ctx.rotate(0.5); 
          ctx.fillStyle = material.color;
          ctx.fillRect(-specSize, -specSize, specSize, specSize);
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(-specSize, -specSize, specSize, specSize);
          ctx.restore();
        }
      }

      // --- 4. Pendulum Arm & Hammer ---
      const angle = physicsState.current.angle;
      const bobX = centerX + Math.sin(angle) * armLengthPx;
      const bobY = pivotY + Math.cos(angle) * armLengthPx;

      ctx.beginPath();
      ctx.moveTo(centerX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Hammer (C-Shape)
      ctx.save();
      ctx.translate(bobX, bobY);
      ctx.rotate(-angle); 
      
      // Cutout circle
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2); 
      ctx.globalCompositeOperation = "destination-out";
      ctx.arc(0, -15, 20, 0, Math.PI*2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      
      // Body
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0.5, Math.PI - 0.5, true); 
      ctx.lineTo(0, -10); 
      ctx.fill();
      
      // Tip
      ctx.fillStyle = '#dc2626'; 
      ctx.beginPath();
      ctx.moveTo(-5, 35);
      ctx.lineTo(5, 35);
      ctx.lineTo(0, 45); 
      ctx.fill();
      
      ctx.restore();

      // Pivot Cap
      ctx.beginPath();
      ctx.arc(centerX, pivotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // --- 5. Always Visible Specimen Preview (Top Left Corner) ---
      // VISTA FRONTAL (Longitudinal)
      if (material) {
        const previewX = 50;
        const previewY = 50;
        const pWidth = 100;
        const pHeight = 25;

        // Container/Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(previewX - 10, previewY - 20, pWidth + 20, pHeight + 40);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(previewX - 10, previewY - 20, pWidth + 20, pHeight + 40);

        // Label
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText("Vista Frontal (Longitudinal)", previewX, previewY - 5);

        // Specimen Body
        ctx.fillStyle = material.color;
        ctx.fillRect(previewX, previewY, pWidth, pHeight);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(previewX, previewY, pWidth, pHeight);

        // Notch (CENTER of TOP Edge) - Standard Front View
        ctx.fillStyle = '#fff'; 
        ctx.beginPath();
        ctx.moveTo(previewX + pWidth/2 - 6, previewY);
        ctx.lineTo(previewX + pWidth/2, previewY + 8);
        ctx.lineTo(previewX + pWidth/2 + 6, previewY);
        ctx.fill();
        ctx.stroke();

        // Dimension Text
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("55mm", previewX + pWidth / 2, previewY + pHeight + 12);
        
        // Impact Arrow
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(previewX + pWidth/2, previewY + pHeight + 15);
        ctx.lineTo(previewX + pWidth/2, previewY + pHeight + 5);
        ctx.lineTo(previewX + pWidth/2 - 3, previewY + pHeight + 8);
        ctx.lineTo(previewX + pWidth/2 + 3, previewY + pHeight + 8);
        ctx.lineTo(previewX + pWidth/2, previewY + pHeight + 5);
        ctx.fill();
        ctx.fillText("Impacto", previewX + pWidth/2, previewY + pHeight + 24);
      }


      // --- 6. Magnifying Glass Overlay (Lupa) ---
      if (showMagnifier && material) {
        // Draw Overlay Box
        const magSize = 200;
        const magX = canvas.width - magSize - 20;
        const magY = 20;

        // Shadow/Frame
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'white';
        ctx.fillRect(magX, magY, magSize, magSize);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(magX, magY, magSize, magSize);

        // Title
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Sección Transversal", magX + magSize/2, magY + 25);
        
        // Draw Zoomed Specimen (Square Cross Section)
        const zoomCX = magX + magSize/2;
        const zoomCY = magY + magSize/2;
        const zSize = 80;
        
        // Specimen Body
        ctx.fillStyle = material.color;
        ctx.fillRect(zoomCX - zSize/2, zoomCY - zSize/2, zSize, zSize);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(zoomCX - zSize/2, zoomCY - zSize/2, zSize, zSize);
        
        // V-Notch on RIGHT Edge
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(zoomCX + zSize/2, zoomCY - 15);
        ctx.lineTo(zoomCX + zSize/2 - 20, zoomCY);
        ctx.lineTo(zoomCX + zSize/2, zoomCY + 15);
        ctx.fill();
        ctx.stroke();

        // Impact Arrow (Left)
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText("→", zoomCX - zSize/2 - 30, zoomCY + 8);
        ctx.font = '10px monospace';
        ctx.fillText("Impacto", zoomCX - zSize/2 - 30, zoomCY + 20);

        // Standard Label
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText("10mm x 10mm", zoomCX, magY + magSize - 10);
      }

    };

    // Animation Loop
    const animate = () => {
      if (state === SimulationState.IDLE) {
        draw();
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = 0.016; 
      
      // Physics
      if (state === SimulationState.SWINGING_DOWN) {
        const acc = -(GRAVITY / config.length) * Math.sin(physicsState.current.angle);
        physicsState.current.velocity += acc * dt;
        physicsState.current.angle += physicsState.current.velocity * dt;

        if (physicsState.current.angle >= 0) {
           physicsState.current.angle = 0;
           setSpecimenBroken(true);
        }
      } 
      else if (state === SimulationState.SWINGING_UP) {
         const targetRad = finalAngleResult * (Math.PI / 180);
         const dist = targetRad - physicsState.current.angle;
         
         if (Math.abs(dist) < 0.01) {
            physicsState.current.velocity = 0;
         } else {
             physicsState.current.angle += (dist * 0.05);
         }
      }
      else if (state === SimulationState.OSCILLATING) {
          const targetRad = finalAngleResult * (Math.PI / 180);
          physicsState.current.time += dt;
          const amplitude = 0.1 * Math.exp(-physicsState.current.time);
          physicsState.current.angle = targetRad + Math.sin(physicsState.current.time * 8) * amplitude;
          
          if (physicsState.current.time > 3) {
             onAnimationComplete();
          }
      }

      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [config, material, state, finalAngleResult, specimenBroken, showMagnifier, onAnimationComplete]);

  return (
    <div className="relative w-full h-[450px] bg-slate-50 rounded-lg border border-slate-200 shadow-inner overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={450} 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default SimulationCanvas;