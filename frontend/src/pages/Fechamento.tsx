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
import { formatCurrency } from '../utils/currency';
import { Wallet, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, Lock, RefreshCw } from 'lucide-react';
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

  return (
    <Layout>
      <div className={styles.container}>
        <PageHeader
          title="Fechamento de Dia"
          subtitle="Congele os saldos do dia e garanta a integridade do fluxo de caixa."
          filters={
            <>
              <CompanySelector value={companyId} onChange={setCompanyId} />
              <Input type="date" label="DATA" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} variant="date" />
              <Button variant="secondary" onClick={loadFlow} disabled={isLoading} icon={<RefreshCw size={16} />}>
                {isLoading ? 'Carregando...' : 'Recarregar'}
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
                <div className={styles.cardsGrid}>
                  <MetricCard
                    label="Saldo Inicial"
                    value={formatCurrency(resumo?.opening_balance || 0)}
                    subtitle="Fechamento anterior"
                    size="large"
                    icon={<Wallet size={18} />}
                  />
                  <MetricCard
                    label="Entradas"
                    value={formatCurrency(resumo?.realized_in || 0)}
                    subtitle="Valores recebidos"
                    variant="success"
                    size="large"
                    icon={<ArrowUpRight size={18} />}
                  />
                  <MetricCard
                    label="Saídas"
                    value={formatCurrency(resumo?.realized_out || 0)}
                    subtitle="Valores pagos"
                    variant="error"
                    size="large"
                    icon={<ArrowDownRight size={18} />}
                  />
                  <MetricCard
                    label="Saldo Final de Caixa"
                    value={formatCurrency(resumo?.flow_balance || 0)}
                    subtitle="Projetado para hoje"
                    variant="info"
                    size="large"
                    icon={<CheckCircle2 size={18} />}
                  />
                </div>
                <div className={styles.secondaryGrid}>
                  <MetricCard
                    label="Saldo em Banco"
                    value={formatCurrency(resumo?.bank_balance || 0)}
                    subtitle="Conforme extrato"
                    density="compact"
                  />
                  <MetricCard
                    label="Diferença (Caixa × Banco)"
                    value={formatCurrency(resumo?.difference || 0)}
                    subtitle="Valores não conciliados"
                    variant={(resumo?.difference || 0) !== 0 ? 'warning' : 'success'}
                    density="compact"
                    icon={<AlertTriangle size={16} />}
                  />
                </div>
              </Card>

              <Card title="Ações de Fechamento">
                <div className={styles.formSection}>
                  <Textarea
                    label="Observações do Fechamento (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Diferença de R$ 5,00 devido a tarifa bancária não lançada..."
                    rows={3}
                  />
                  <div className={styles.actionButtons}>
                    <Button
                      variant="primary"
                      onClick={() => setIsCloseDialogOpen(true)}
                      disabled={isActionLoading || isLoading || !companyId}
                      icon={<Lock size={16} />}
                    >
                      {isActionLoading ? 'Processando...' : 'Realizar Fechamento'}
                    </Button>
                  </div>
                </div>
              </Card>

              {user?.is_admin && (
                <div className={styles.reopenSection}>
                  <div className={styles.reopenHeader}>
                    <AlertTriangle size={18} className={styles.reopenIcon} />
                    <div>
                      <h4 className={styles.reopenTitle}>Reabertura de Dia</h4>
                      <p className={styles.reopenSubtitle}>Apenas administradores podem reabrir dias fechados.</p>
                    </div>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.flex1}>
                      <Input
                        label="Motivo da Reabertura"
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        placeholder="Ex: Correção de lançamento bancário duplicado"
                      />
                    </div>
                    <Button
                      variant="warning"
                      onClick={() => setIsReopenDialogOpen(true)}
                      disabled={isActionLoading || !reopenReason}
                      icon={<RefreshCw size={16} />}
                    >
                      Reabrir Dia
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
        message={`Tem certeza que deseja fechar o dia ${new Date(dataFiltro).toLocaleDateString('pt-BR')}?`}
        confirmLabel="Sim, fechar dia"
        cancelLabel="Cancelar"
        onConfirm={handleCloseDay}
        onClose={() => setIsCloseDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={isReopenDialogOpen}
        title="Confirmar Reabertura"
        message={`Atenção: você está prestes a reabrir o dia ${new Date(dataFiltro).toLocaleDateString('pt-BR')}.`}
        confirmLabel="Sim, reabrir dia"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleReopenDay}
        onClose={() => setIsReopenDialogOpen(false)}
      />
    </Layout>
  );
}
