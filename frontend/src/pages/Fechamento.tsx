import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { CompanySelector } from '../components/CompanySelector';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getDailyFlow, closeDay, reopenDay, DailyFlowSummary } from '../services/flowService';
import { getTodayLocal } from '../utils/date';
import styles from './Fechamento.module.css';

export default function Fechamento() {
  const { user } = useAuth();
  const { error, success } = useToast();
  
  const [dataFiltro, setDataFiltro] = useState(getTodayLocal());
  const [companyId, setCompanyId] = useState<number | null>(null);

  const [resumo, setResumo] = useState<DailyFlowSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [notes, setNotes] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);

  const loadFlow = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await getDailyFlow(companyId, dataFiltro);
      setResumo(data);
    } catch (err: any) {
      error('Erro ao buscar dados do dia');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) loadFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, dataFiltro]);

  const handleCloseDay = async () => {
    setIsActionLoading(true);
    try {
      const result = await closeDay(companyId!, dataFiltro, notes);
      success(result.detail);
      setNotes('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Erro ao tentar fechar o dia.';
      error(errorMsg);
    } finally {
      setIsActionLoading(false);
      setIsCloseDialogOpen(false);
    }
  };

  const handleReopenDay = async () => {
    if (!reopenReason) {
      error('É obrigatório informar o motivo da reabertura.');
      setIsReopenDialogOpen(false);
      return;
    }

    setIsActionLoading(true);
    try {
      const result = await reopenDay(companyId!, dataFiltro, reopenReason);
      success(result.detail);
      setReopenReason('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Erro ao tentar reabrir o dia.';
      error(errorMsg);
    } finally {
      setIsActionLoading(false);
      setIsReopenDialogOpen(false);
    }
  };

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  return (
    <Layout>
      <div className={styles.container}>
        <PageHeader
          title="Fechamento de Dia"
          subtitle="Congele os saldos do dia e garanta a integridade do fluxo de caixa."
          filters={
            <>
              <CompanySelector value={companyId} onChange={setCompanyId} />
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
            </>
          }
        />

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.cardsGrid}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} variant="metric" />)}
            </div>
          ) : (
            <>
              <Card title={`Resumo Financeiro — ${new Date(dataFiltro).toLocaleDateString('pt-BR')}`}>
                <div className={styles.cardsGrid} style={{ marginBottom: 'var(--spacing-xl)' }}>
                  <MetricCard label="SALDO INICIAL" value={formatarMoeda(resumo?.opening_balance || 0)} subtitle="Fechamento anterior" size="large" />
                  <MetricCard label="ENTRADAS" value={formatarMoeda(resumo?.realized_in || 0)} subtitle="Valores recebidos" variant="success" size="large" />
                  <MetricCard label="SAÍDAS" value={formatarMoeda(resumo?.realized_out || 0)} subtitle="Valores pagos" variant="error" size="large" />
                  <MetricCard label="SALDO FINAL DE CAIXA" value={formatarMoeda(resumo?.flow_balance || 0)} subtitle="Projetado para hoje" variant="info" size="large" />
                </div>
                
                <div className={styles.secondaryGrid}>
                  <MetricCard label="SALDO EM BANCO" value={formatarMoeda(resumo?.bank_balance || 0)} subtitle="Conforme extrato" density="compact" />
                  <MetricCard label="DIFERENÇA (CAIXA × BANCO)" value={formatarMoeda(resumo?.difference || 0)} subtitle="Valores não conciliados" variant={(resumo?.difference || 0) !== 0 ? 'warning' : 'success'} density="compact" />
                </div>
              </Card>

              <Card title="Ações de Fechamento">
                <div className={styles.formForm}>
                  <Textarea
                    label="OBSERVAÇÕES DO FECHAMENTO (OPCIONAL)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Diferença de R$ 5,00 devido a tarifa bancária não lançada..."
                    rows={3}
                  />
                  <div>
                    <Button
                      variant="primary"
                      onClick={() => setIsCloseDialogOpen(true)}
                      disabled={isActionLoading || isLoading || !companyId}
                    >
                      {isActionLoading ? 'PROCESSANDO...' : 'REALIZAR FECHAMENTO'}
                    </Button>
                  </div>
                </div>
              </Card>

              {user?.is_admin && (
                <div className={styles.reopenSection}>
                  <h4 className={styles.reopenTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Reabertura de Dia — Administradores
                  </h4>
                  <p className={styles.reopenText}>
                    Se o dia já estiver fechado e for necessária alguma correção, informe o motivo e reabra o dia.
                  </p>
                  
                  <div className={styles.formGrid}>
                    <div className={styles.flex1}>
                      <Input
                        label="MOTIVO DA REABERTURA"
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        placeholder="Ex: Correção de lançamento bancário duplicado"
                      />
                    </div>
                    <Button
                      variant="warning"
                      onClick={() => setIsReopenDialogOpen(true)}
                      disabled={isActionLoading || !reopenReason}
                    >
                      REABRIR DIA
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isCloseDialogOpen}
        title="Confirmar Fechamento"
        message={`Tem certeza que deseja fechar o dia ${new Date(dataFiltro).toLocaleDateString('pt-BR')}? Os lançamentos não poderão ser alterados após o fechamento.`}
        confirmLabel="Sim, fechar dia"
        cancelLabel="Cancelar"
        onConfirm={handleCloseDay}
        onClose={() => setIsCloseDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={isReopenDialogOpen}
        title="Confirmar Reabertura"
        message={`ATENÇÃO: Você está prestes a reabrir o dia ${new Date(dataFiltro).toLocaleDateString('pt-BR')}. Isso permitirá a edição de lançamentos e pode afetar os saldos de dias subsequentes. Deseja continuar?`}
        confirmLabel="Sim, reabrir dia"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleReopenDay}
        onClose={() => setIsReopenDialogOpen(false)}
      />
    </Layout>
  );
}
