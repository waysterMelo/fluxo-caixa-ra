import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            {/* Bela-Tec custom stylized icon representing cash flow/growth */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 className={styles.logoTitle}>Fluxo de Caixa RA</h1>
          <p className={styles.logoSubtitle}>Corporate Financial System · Bela-Tec</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <Input
            id="email"
            type="email"
            label="E-MAIL CORPORATIVO"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.nome@bela-tec.com"
            autoComplete="email"
            required
          />

          <Input
            id="senha"
            type="password"
            label="SENHA DE ACESSO"
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
            style={{ width: '100%', marginTop: 'var(--spacing-xs)' }}
          >
            {isLoading ? 'Autenticando...' : 'Acessar Sistema'}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>© {new Date().getFullYear()} Bela-Tec. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
