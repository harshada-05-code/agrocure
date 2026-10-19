import React, { useEffect, useRef } from 'react';

export default function GradCamOverlay({ imageSrc }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Draw base leaf photo
      ctx.drawImage(img, 0, 0);

      // 2. Create asymmetric multi-spot Grad-CAM heat attention regions
      const heatSpots = [
        { x: img.width * 0.42, y: img.height * 0.48, r1: 10, r2: img.width * 0.28, opacity: 0.8 },
        { x: img.width * 0.62, y: img.height * 0.38, r1: 5,  r2: img.width * 0.18, opacity: 0.65 },
        { x: img.width * 0.35, y: img.height * 0.65, r1: 5,  r2: img.width * 0.15, opacity: 0.5 }
      ];

      heatSpots.forEach((spot) => {
        const gradient = ctx.createRadialGradient(spot.x, spot.y, spot.r1, spot.x, spot.y, spot.r2);
        gradient.addColorStop(0, `rgba(239, 68, 68, ${spot.opacity})`);    // Core Red
        gradient.addColorStop(0.3, `rgba(245, 158, 11, ${spot.opacity * 0.8})`); // Yellow/Amber
        gradient.addColorStop(0.6, `rgba(34, 197, 94, ${spot.opacity * 0.4})`);  // Soft Green
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');           // Fade to transparent

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.r2, 0, Math.PI * 2);
        ctx.fill();
      });
    };
  }, [imageSrc]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '220px',
        objectFit: 'cover',
        borderRadius: '16px',
        display: 'block',
      }}
    />
  );
}