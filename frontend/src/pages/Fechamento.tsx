import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Company, listCompanies } from '../services/companyService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { getDailyFlow, closeDay, reopenDay, DailyFlowSummary } from '../services/flowService';
import { getTodayLocal } from '../utils/date';
import styles from './Fechamento.module.css';

export default function Fechamento() {
  const { user } = useAuth();
  const [dataFiltro, setDataFiltro] = useState(getTodayLocal());
  const [companyId, setCompanyId] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  useEffect(() => {
    const loadComps = async () => {
      try {
        const data = await listCompanies(true);
        setCompanies(data);
        if (data.length > 0) setCompanyId(data[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadComps();
  }, []);

  const [resumo, setResumo] = useState<DailyFlowSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [notes, setNotes] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadFlow = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const data = await getDailyFlow(companyId, dataFiltro);
      setResumo(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro ao buscar dados do dia.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, dataFiltro]);

  const handleCloseDay = async () => {
    if (!window.confirm(`Tem certeza que deseja fechar o dia ${dataFiltro}?`)) return;

    setIsActionLoading(true);
    setMessage(null);
    try {
      const result = await closeDay(companyId, dataFiltro, notes);
      setMessage({ type: 'success', text: result.detail });
      setNotes('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Erro ao tentar fechar o dia.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReopenDay = async () => {
    if (!reopenReason) {
      setMessage({ type: 'error', text: 'É obrigatório informar o motivo da reabertura.' });
      return;
    }

    if (!window.confirm(`Tem certeza que deseja reabrir o dia ${dataFiltro}?`)) return;

    setIsActionLoading(true);
    setMessage(null);
    try {
      const result = await reopenDay(companyId, dataFiltro, reopenReason);
      setMessage({ type: 'success', text: result.detail });
      setReopenReason('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Erro ao tentar reabrir o dia.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2>Fechamento de Dia</h2>
            <p>Congele os saldos do dia e garanta a integridade do fluxo de caixa.</p>
          </div>

          <div className={styles.filters}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
                EMPRESA
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(Number(e.target.value))} 
                disabled={isLoadingCompanies || companies.length === 0}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  minWidth: '180px'
                }}
              >
                {companies.length === 0 ? (
                  <option value="">Carregando...</option>
                ) : (
                  companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                )}
              </select>
            </div>
            <Input
              type="date"
              label="DATA DO FECHAMENTO"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              variant="date"
            />
            <Button variant="secondary" onClick={loadFlow} disabled={isLoading}>
              {isLoading ? 'CARREGANDO...' : 'RECARREGAR'}
            </Button>
          </div>
        </div>

        {message && (
          <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
            {message.text}
          </div>
        )}

        <div className={styles.content}>
          <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-md)' }}>
            RESUMO FINANCEIRO — {dataFiltro}
          </h3>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>SALDO INICIAL</span>
              <span className={styles.summaryValue}>{isLoading ? '...' : formatarMoeda(resumo?.opening_balance || 0)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>ENTRADAS</span>
              <span className={styles.summaryValue} style={{ color: 'var(--status-success)' }}>
                {isLoading ? '...' : formatarMoeda(resumo?.realized_in || 0)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>SAÍDAS</span>
              <span className={styles.summaryValue} style={{ color: 'var(--status-error)' }}>
                {isLoading ? '...' : formatarMoeda(resumo?.realized_out || 0)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>SALDO FINAL DE CAIXA</span>
              <span className={styles.summaryValue} style={{ color: 'var(--accent-cyan)' }}>
                {isLoading ? '...' : formatarMoeda(resumo?.flow_balance || 0)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>SALDO EM BANCO</span>
              <span className={styles.summaryValue}>{isLoading ? '...' : formatarMoeda(resumo?.bank_balance || 0)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>DIFERENÇA</span>
              <span className={styles.summaryValue} style={{ color: (resumo?.difference || 0) !== 0 ? 'var(--status-warning)' : 'var(--status-success)' }}>
                {isLoading ? '...' : formatarMoeda(resumo?.difference || 0)}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
                OBSERVAÇÕES DO FECHAMENTO (OPCIONAL)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Diferença de R$ 5,00 devido a tarifa bancária não lançada..."
                style={{
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-input)',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>

            <Button
              variant="primary"
              onClick={handleCloseDay}
              disabled={isActionLoading || isLoading}
              style={{ alignSelf: 'flex-start' }}
            >
              {isActionLoading ? 'PROCESSANDO...' : 'REALIZAR FECHAMENTO'}
            </Button>
          </div>

          {/* Área exclusiva para administradores reabrirem o dia */}
          {user?.is_admin && (
            <div className={styles.reopenSection}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚠ REABERTURA DE DIA — ADMINISTRADORES
              </h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Se o dia já estiver fechado e for necessária alguma correção, informe o motivo e reabra o dia.
              </p>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <Input
                    label="MOTIVO DA REABERTURA"
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Ex: Correção de lançamento bancário duplicado"
                  />
                </div>
                <Button
                  variant="warning"
                  onClick={handleReopenDay}
                  disabled={isActionLoading || !reopenReason}
                >
                  REABRIR DIA
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
