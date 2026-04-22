import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passVisible, setPassVisible] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !senha) {
      setError('Preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, senha);
      navigate('/');
    } catch {
      setError('E-mail ou senha inválidos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Neural Canvas Animation Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number;
    let nodes: Node[] = [];
    let mouse = { x: -2000, y: -2000 };
    let rafId: number;
    let frameCount = 0;

    class Node {
      x: number; y: number; vx: number; vy: number;
      baseRadius: number; radius: number; pulsePhase: number;
      pulseSpeed: number; activation: number; flash: number;
      layer: number; driftPhase: number; driftSpeed: number;
      brightness: number;

      constructor(x?: number, y?: number) {
        this.x = x !== undefined ? x : Math.random() * W;
        this.y = y !== undefined ? y : Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.baseRadius = Math.random() * 2.5 + 0.5;
        this.radius = this.baseRadius;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.015 + 0.005;
        this.activation = Math.random() * 0.3;
        this.flash = 0;
        this.layer = Math.floor(Math.random() * 5);
        this.driftPhase = Math.random() * Math.PI * 2;
        this.driftSpeed = Math.random() * 0.0003 + 0.0001;
        this.brightness = 0;
      }

      update() {
        this.pulsePhase += this.pulseSpeed;
        this.driftPhase += this.driftSpeed;
        this.vx += Math.sin(this.driftPhase) * 0.00015;
        this.vy += Math.cos(this.driftPhase * 0.7) * 0.00015;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          const force = (250 - dist) / 250;
          this.vx += dx * force * 0.00004;
          this.vy += dy * force * 0.00004;
          this.activation = Math.min(1, this.activation + force * 0.02);
          this.flash = Math.min(1, this.flash + force * 0.04);
          this.brightness = Math.min(1, this.brightness + force * 0.03);
        }

        if (Math.random() < 0.001) {
          this.activation = Math.min(1, this.activation + 0.3);
          this.flash = Math.min(1, this.flash + 0.2);
        }

        this.activation *= 0.999;
        this.flash *= 0.96;
        this.brightness *= 0.98;
        this.vx *= 0.998;
        this.vy *= 0.998;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -30) this.x = W + 30;
        if (this.x > W + 30) this.x = -30;
        if (this.y < -30) this.y = H + 30;
        if (this.y > H + 30) this.y = -30;

        this.radius = this.baseRadius + Math.sin(this.pulsePhase) * 0.4;
      }

      draw() {
        const pulse = (Math.sin(this.pulsePhase) + 1) * 0.5;
        const intensity = 0.3 + this.activation * 0.5 + this.flash * 0.3 + this.brightness * 0.2;
        const r = this.radius + this.flash * 3;

        let baseR, baseG, baseB;
        switch (this.layer) {
          case 0: baseR = 96; baseG = 165; baseB = 250; break;
          case 1: baseR = 59; baseG = 130; baseB = 246; break;
          case 2: baseR = 129; baseG = 140; baseB = 248; break;
          case 3: baseR = 147; baseG = 197; baseB = 253; break;
          default: baseR = 200; baseG = 210; baseB = 255; break;
        }

        const glowSize = r * (3 + pulse * 3 + this.flash * 5);
        const glowAlpha = intensity * 0.12;
        const glowGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        glowGrad.addColorStop(0, `rgba(${baseR}, ${baseG}, ${baseB}, ${glowAlpha})`);
        glowGrad.addColorStop(1, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${intensity})`;
        ctx.fill();

        if (intensity > 0.5) {
          const coreGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 1.2);
          coreGrad.addColorStop(0, `rgba(255, 255, 255, ${(intensity - 0.5) * 0.7})`);
          coreGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.beginPath();
          ctx.arc(this.x, this.y, r * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = coreGrad;
          ctx.fill();
        }
      }
    }

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      nodes = [];
      const area = W * H;
      const totalNodes = Math.floor(Math.min(700, area / 3000));
      const waveConfigs = [
        { count: Math.floor(totalNodes * 0.25), yBase: H * 0.25, amp: H * 0.12, freq: 0.004, speed: 0.0006 },
        { count: Math.floor(totalNodes * 0.25), yBase: H * 0.45, amp: H * 0.1, freq: 0.003, speed: 0.0004 },
        { count: Math.floor(totalNodes * 0.2), yBase: H * 0.65, amp: H * 0.08, freq: 0.005, speed: 0.0007 },
        { count: Math.floor(totalNodes * 0.15), yBase: H * 0.35, amp: H * 0.15, freq: 0.002, speed: 0.0003 },
      ];
      const time = performance.now();
      let idx = 0;
      for (const cfg of waveConfigs) {
        for (let i = 0; i < cfg.count; i++) {
          const t = i / cfg.count;
          const x = t * (W + 100) - 50;
          const y = cfg.yBase + Math.sin(x * cfg.freq + time * cfg.speed) * cfg.amp
                  + Math.cos(x * cfg.freq * 2.3 + time * cfg.speed * 1.4) * cfg.amp * 0.4
                  + (Math.random() - 0.5) * 40;
          nodes.push(new Node(x, y));
          idx++;
        }
      }
      const remaining = totalNodes - idx;
      for (let i = 0; i < remaining; i++) {
        nodes.push(new Node());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createRadialGradient(W * 0.3, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
      bgGrad.addColorStop(0, '#0c1428');
      bgGrad.addColorStop(0.4, '#090f20');
      bgGrad.addColorStop(1, '#050810');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      for (const nd of nodes) {
        nd.update();
        nd.draw();
      }

      // Basic connection logic (optimized simplified version for React integration)
      const MAX_DIST = 150;
      const MAX_DIST2 = MAX_DIST * MAX_DIST;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < MAX_DIST2) {
            const dist = Math.sqrt(dist2);
            const alpha = (1 - dist / MAX_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      frameCount++;
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    document.addEventListener('mousemove', handleMouseMove);

    resize();
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Parallax Effect
  useEffect(() => {
    const handleMouseParallax = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 6;
      const y = (e.clientY / window.innerHeight - 0.5) * 6;
      wrapperRef.current.style.transform = `perspective(1000px) rotateY(${x * 0.15}deg) rotateX(${-y * 0.15}deg)`;
    };
    document.addEventListener('mousemove', handleMouseParallax);
    return () => document.removeEventListener('mousemove', handleMouseParallax);
  }, []);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.neuralCanvas} />
      <div className={styles.ambientOverlay} />

      <div ref={wrapperRef} className={styles.loginWrapper}>
        <div className={styles.leftPanel}>
          <div className={styles.leftPanelShapes}>
            <div className={`${styles.shape} ${styles.shape1}`} />
            <div className={`${styles.shape} ${styles.shape2}`} />
            <div className={`${styles.shape} ${styles.shape3}`} />
            <div className={`${styles.shape} ${styles.shape4}`} />
          </div>
          <div className={styles.dotsPattern} />

          <div className={styles.brandSection}>
            <div className={styles.brandBadge}>
              <div className={styles.brandIcon}>RA</div>
              <div className={styles.brandText}>
                <h1>Fluxo de Caixa RA</h1>
                <p>Controle financeiro inteligente</p>
              </div>
            </div>
          </div>

          <div className={styles.featuresList}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <span>Ambiente seguro e criptografado</span>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <span>Autenticação corporativa</span>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <span>Monitoramento em tempo real</span>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.welcomeSection}>
            <h2>Bem-vindo</h2>
            <p>Acesse sua conta corporativa</p>
          </div>

          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>E-mail Corporativo</label>
              <div className={styles.inputWrapper}>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.nome@bela-tec.com" 
                  autoComplete="email" 
                  className={error ? styles.error : ''}
                />
                <div className={styles.inputIcon}>
                  <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Senha de Acesso</label>
              <div className={styles.inputWrapper}>
                <input 
                  type={passVisible ? 'text' : 'password'} 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••" 
                  autoComplete="current-password" 
                  className={error ? styles.error : ''}
                />
                <div className={styles.inputIcon}>
                  <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <button 
                  type="button" 
                  className={styles.passwordToggle} 
                  onClick={() => setPassVisible(!passVisible)}
                >
                  {passVisible ? (
                    <svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {error && <div className={`${styles.errorMsg} ${styles.visible}`}>{error}</div>}
            </div>

            <button type="submit" className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`} disabled={isLoading}>
              <span className={styles.btnText}>
                {isLoading ? 'Autenticando...' : 'Entrar no sistema'}
                {!isLoading && (
                  <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                )}
              </span>
            </button>
          </form>

          <div className={styles.footerText}>© {new Date().getFullYear()} Bela-Tec. Todos os direitos reservados.</div>
        </div>
      </div>
    </div>
  );
}
