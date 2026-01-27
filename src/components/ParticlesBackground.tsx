import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacitySpeed: number;
}

interface ParticlesBackgroundProps {
  particleCount?: number;
  color?: string;
  className?: string;
}

const ParticlesBackground = ({ 
  particleCount = 50, 
  color = 'rgba(255, 255, 255, 0.6)',
  className = '' 
}: ParticlesBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limit particle count for performance
    const effectiveParticleCount = Math.min(particleCount, 40);
    const connectionDistance = 80; // Reduced from 100
    const maxConnections = 3; // Limit connections per particle

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };

    resizeCanvas();
    
    // Throttled resize handler
    let resizeTimeout: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };
    window.addEventListener('resize', throttledResize, { passive: true });

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < effectiveParticleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2.5 + 1, // Slightly smaller
          speedX: (Math.random() - 0.5) * 0.12, // Slightly slower
          speedY: (Math.random() - 0.5) * 0.12,
          opacity: Math.random() * 0.4 + 0.2,
          opacitySpeed: (Math.random() - 0.5) * 0.004,
        });
      }
    };

    initParticles();

    // Throttled mouse tracking
    let lastMouseUpdate = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouseUpdate < 50) return; // 20fps for mouse
      lastMouseUpdate = now;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Animation loop with frame skipping for performance
    let frameCount = 0;
    const animate = () => {
      frameCount++;
      
      // Skip connection drawing every other frame for performance
      const drawConnections = frameCount % 2 === 0;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Mouse interaction - subtle attraction (simplified)
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < 22500) { // 150^2
          const distance = Math.sqrt(distSq);
          const force = (150 - distance) / 150;
          particle.speedX += (dx / distance) * force * 0.002;
          particle.speedY += (dy / distance) * force * 0.002;
        }

        // Limit speed
        const speedSq = particle.speedX ** 2 + particle.speedY ** 2;
        if (speedSq > 0.16) { // 0.4^2
          const speed = Math.sqrt(speedSq);
          particle.speedX = (particle.speedX / speed) * 0.4;
          particle.speedY = (particle.speedY / speed) * 0.4;
        }

        // Update opacity (pulsing effect)
        particle.opacity += particle.opacitySpeed;
        if (particle.opacity <= 0.1 || particle.opacity >= 0.6) {
          particle.opacitySpeed *= -1;
        }

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(')', `, ${particle.opacity})`).replace('rgb', 'rgba');
        ctx.fill();

        // Draw connections (limited for performance)
        if (drawConnections) {
          let connectionCount = 0;
          for (let j = index + 1; j < particlesRef.current.length && connectionCount < maxConnections; j++) {
            const otherParticle = particlesRef.current[j];
            const cdx = particle.x - otherParticle.x;
            const cdy = particle.y - otherParticle.y;
            const cdistSq = cdx * cdx + cdy * cdy;

            if (cdistSq < connectionDistance * connectionDistance) {
              connectionCount++;
              const cdist = Math.sqrt(cdistSq);
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = color.replace(')', `, ${0.1 * (1 - cdist / connectionDistance)})`).replace('rgb', 'rgba');
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', throttledResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(resizeTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export default ParticlesBackground;
