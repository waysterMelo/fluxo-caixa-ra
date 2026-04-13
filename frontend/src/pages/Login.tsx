import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DollarSign, Shield, Lock, Activity } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className={styles.container}>
      {/* Background animado */}
      <div className={styles.background}>
        <div className={styles.waveContainer}>
          <svg className={styles.wave} viewBox="0 0 1440 400" preserveAspectRatio="none">
            <path d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,122.7C672,128,768,192,864,213.3C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,400L1392,400C1344,400,1248,400,1152,400C1056,400,960,400,864,400C768,400,672,400,576,400C480,400,384,400,288,400C192,400,96,400,48,400L0,400Z" />
          </svg>
          <svg className={`${styles.wave} ${styles.wave2}`} viewBox="0 0 1440 400" preserveAspectRatio="none">
            <path d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,245.3C672,267,768,277,864,261.3C960,245,1056,203,1152,181.3C1248,160,1344,160,1392,160L1440,160L1440,400L1392,400C1344,400,1248,400,1152,400C1056,400,960,400,864,400C768,400,672,400,576,400C480,400,384,400,288,400C192,400,96,400,48,400L0,400Z" />
          </svg>
          <svg className={`${styles.wave} ${styles.wave3}`} viewBox="0 0 1440 400" preserveAspectRatio="none">
            <path d="M0,288L48,272C96,256,192,224,288,218.7C384,213,480,235,576,250.7C672,267,768,277,864,261.3C960,245,1056,203,1152,186.7C1248,171,1344,181,1392,186.7L1440,192L1440,400L1392,400C1344,400,1248,400,1152,400C1056,400,960,400,864,400C768,400,672,400,576,400C480,400,384,400,288,400C192,400,96,400,48,400L0,400Z" />
          </svg>
        </div>
        
        {/* Elementos flutuantes */}
        <div className={`${styles.floatElement} ${styles.float1}`}>
          <DollarSign size={24} />
        </div>
        <div className={`${styles.floatElement} ${styles.float2}`}>
          <Shield size={20} />
        </div>
        <div className={`${styles.floatElement} ${styles.float3}`}>
          <Activity size={18} />
        </div>

        {/* Glow effect no logo */}
        <div className={styles.glow} />
      </div>

      {/* Conteúdo — 2 colunas */}
      <div className={styles.content}>
        {/* Coluna esquerda — Branding */}
        <div className={styles.branding}>
          <div className={styles.brandLogo}>
            <div className={styles.brandLogoIcon}>RA</div>
            <div>
              <h1 className={styles.brandTitle}>Fluxo de Caixa RA</h1>
              <p className={styles.brandSubtitle}>Controle financeiro inteligente</p>
            </div>
          </div>
          
          <div className={styles.brandFeatures}>
            <div className={styles.brandFeature}>
              <Shield size={18} />
              <span>Ambiente seguro e criptografado</span>
            </div>
            <div className={styles.brandFeature}>
              <Lock size={18} />
              <span>Autenticação corporativa</span>
            </div>
            <div className={styles.brandFeature}>
              <Activity size={18} />
              <span>Monitoramento em tempo real</span>
            </div>
          </div>
        </div>

        {/* Coluna direita — Login */}
        <div className={styles.loginPanel}>
          <div className={styles.loginCard}>
            <div className={styles.loginHeader}>
              <h2 className={styles.loginTitle}>Bem-vindo</h2>
              <p className={styles.loginSubtitle}>Acesse sua conta corporativa</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.error}>
                  <Shield size={16} />
                  <span>{error}</span>
                </div>
              )}

              <Input
                id="email"
                type="email"
                label="E-mail corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@bela-tec.com"
                autoComplete="email"
                required
              />

              <Input
                id="senha"
                type="password"
                label="Senha de acesso"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />

              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className={styles.submitButton}
              >
                {isLoading ? 'Autenticando...' : 'Entrar no sistema'}
              </Button>
            </form>

            <div className={styles.footer}>
              <p>© {new Date().getFullYear()} Bela-Tec. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
