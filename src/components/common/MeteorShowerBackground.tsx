import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number; // in radians
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
  thickness: number;
  headRadius: number;
  colorType?: 'amber' | 'cyan' | 'silver';
}

export const MeteorShowerBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark } = useTheme();
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Respect reduced-motion accessibility preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return;
    }

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const meteors: Meteor[] = [];
    const isMobile = width < 768;
    const maxMeteors = isMobile ? 8 : 15;
    let lastSpawnTime = performance.now();
    const spawnInterval = isMobile ? 420 : 280;

    const createMeteor = (): Meteor => {
      const angle = (Math.PI / 180) * (32 + Math.random() * 12);
      const spawnFromTop = Math.random() > 0.35;
      const startX = spawnFromTop ? Math.random() * (width * 1.15) - width * 0.1 : -40;
      const startY = spawnFromTop ? -40 : Math.random() * (height * 0.65);

      const maxLife = 70 + Math.random() * 65;
      const maxOpacity = 0.55 + Math.random() * 0.35;
      const length = 65 + Math.random() * 80;
      const thickness = 1.5 + Math.random() * 0.9;
      const headRadius = thickness * 0.95;
      
      const randColor = Math.random();
      const colorType: 'amber' | 'cyan' | 'silver' = randColor > 0.6 ? 'amber' : randColor > 0.25 ? 'cyan' : 'silver';

      return {
        x: startX,
        y: startY,
        length,
        speed: 2.8 + Math.random() * 2.2,
        angle,
        opacity: 0,
        maxOpacity,
        life: 0,
        maxLife,
        thickness,
        headRadius,
        colorType,
      };
    };

    // Pre-populate a few active meteors
    const initialCount = isMobile ? 4 : 7;
    for (let i = 0; i < initialCount; i++) {
      const m = createMeteor();
      m.life = Math.floor(Math.random() * (m.maxLife * 0.7));
      m.x += Math.cos(m.angle) * m.speed * m.life;
      m.y += Math.sin(m.angle) * m.speed * m.life;
      meteors.push(m);
    }

    let isDocumentVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (!isDocumentVisible) return;

      const delta = currentTime - lastTime;
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      if (currentTime - lastSpawnTime > spawnInterval && meteors.length < maxMeteors) {
        meteors.push(createMeteor());
        lastSpawnTime = currentTime;
      }

      const isCurrentDark = isDarkRef.current;

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life++;

        const progress = m.life / m.maxLife;
        if (progress < 0.15) {
          m.opacity = (progress / 0.15) * m.maxOpacity;
        } else if (progress > 0.75) {
          m.opacity = ((1 - progress) / 0.25) * m.maxOpacity;
        } else {
          m.opacity = m.maxOpacity;
        }

        const frameSpeed = m.speed * (delta / 16.66 || 1);
        m.x += Math.cos(m.angle) * frameSpeed;
        m.y += Math.sin(m.angle) * frameSpeed;

        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        ctx.save();

        if (isCurrentDark) {
          // Luminous Dark Mode (Archival Night Vision) Meteor Trails
          const gradient = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          if (m.colorType === 'amber') {
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0)');
            gradient.addColorStop(0.6, `rgba(245, 158, 11, ${m.opacity * 0.45})`);
            gradient.addColorStop(1, `rgba(251, 191, 36, ${m.opacity * 0.95})`);
          } else if (m.colorType === 'cyan') {
            gradient.addColorStop(0, 'rgba(56, 189, 248, 0)');
            gradient.addColorStop(0.6, `rgba(56, 189, 248, ${m.opacity * 0.45})`);
            gradient.addColorStop(1, `rgba(186, 230, 253, ${m.opacity * 0.95})`);
          } else {
            gradient.addColorStop(0, 'rgba(241, 245, 249, 0)');
            gradient.addColorStop(0.6, `rgba(241, 245, 249, ${m.opacity * 0.4})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${m.opacity * 0.9})`);
          }

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = m.thickness;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 8;
          ctx.shadowColor = m.colorType === 'amber' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.6)';
          ctx.stroke();

          // Radiant head
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.headRadius * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = m.colorType === 'amber' ? `rgba(254, 243, 199, ${m.opacity})` : `rgba(240, 249, 255, ${m.opacity})`;
          ctx.fill();
        } else {
          // Crisp Light Codex Meteor Trails
          const gradient = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
          gradient.addColorStop(0.5, `rgba(15, 23, 42, ${m.opacity * 0.4})`);
          gradient.addColorStop(0.85, `rgba(10, 15, 29, ${m.opacity * 0.8})`);
          gradient.addColorStop(1, `rgba(0, 0, 0, ${m.opacity})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = m.thickness;
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(m.x, m.y, m.headRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 0, 0, ${m.opacity})`;
          ctx.fill();
        }

        ctx.restore();

        if (m.life >= m.maxLife || m.x > width + 100 || m.y > height + 100) {
          meteors.splice(i, 1);
        }
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-300 select-none ${
        isDark ? 'bg-[#070a12]' : 'bg-white'
      }`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
      />
    </div>
  );
};
