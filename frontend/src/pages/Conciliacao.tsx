import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { CompanySelector } from '../components/CompanySelector';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../components/ui/Toast';
import { runAutoReconciliation, createManualLink, getReconciliations } from '../services/reconciliationService';
import { formatDateBR } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { ArrowDownUp, Link, CheckCircle2 } from 'lucide-react';
import styles from './Conciliacao.module.css';

interface MockMovement {
  id: number;
  date: string;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
}

interface MockERP {
  id: number;
  date: string;
  description: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  amount: number;
}

export default function Conciliacao() {
  const { success, error } = useToast();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedMovement, setSelectedMovement] = useState<MockMovement | null>(null);
  const [selectedErp, setSelectedErp] = useState<MockERP | null>(null);

  const [unmatchedMovements, setUnmatchedMovements] = useState<MockMovement[]>([
    { id: 101, date: '2023-10-25', description: 'PIX Recebido Cliente A', type: 'CREDIT', amount: 1500.00 },
    { id: 102, date: '2023-10-25', description: 'PGTO Boleto Fornecedor B', type: 'DEBIT', amount: 500.00 },
    { id: 103, date: '2023-10-25', description: 'Tarifa Manutenção Conta', type: 'DEBIT', amount: 89.90 },
  ]);

  const [unmatchedErp, setUnmatchedErp] = useState<MockERP[]>([
    { id: 201, date: '2023-10-25', description: 'Nota Fiscal 1234 - Cliente A', type: 'RECEIVABLE', amount: 1500.00 },
    { id: 202, date: '2023-10-25', description: 'Fatura Fornecedor B', type: 'PAYABLE', amount: 500.00 },
  ]);

  useEffect(() => {
    if (!companyId) return;
    const fetchData = async () => {
      try { await getReconciliations(companyId); }
      catch (err) { console.error('Erro ao buscar conciliações', err); }
    };
    fetchData();
  }, [companyId]);

  const handleAutoRun = async () => {
    setIsLoading(true);
    try {
      const result = await runAutoReconciliation(companyId!);
      success(`Conciliação automática concluída. ${result.results.linked_count} vínculo(s) gerado(s).`);
      if (result.results.linked_count > 0) {
        setUnmatchedMovements(prev => prev.filter(m => m.id !== 101 && m.id !== 102));
        setUnmatchedErp(prev => prev.filter(e => e.id !== 201 && e.id !== 202));
        setSelectedMovement(null);
        setSelectedErp(null);
      }
    } catch (err: any) {
      error(err.response?.data?.detail || 'Erro ao executar conciliação automática.');
    } finally { setIsLoading(false); }
  };

  const handleManualLink = async () => {
    if (!selectedMovement || !selectedErp) return;
    setIsLoading(true);
    try {
      await createManualLink({ movement_id: selectedMovement.id, target_type: selectedErp.type, target_id: selectedErp.id });
      success('Vínculo manual realizado com sucesso!');
      setUnmatchedMovements(prev => prev.filter(m => m.id !== selectedMovement.id));
      setUnmatchedErp(prev => prev.filter(e => e.id !== selectedErp.id));
      setSelectedMovement(null);
      setSelectedErp(null);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Erro ao realizar vínculo manual.');
    } finally { setIsLoading(false); }
  };

  const diff = (selectedMovement?.amount || 0) - (selectedErp?.amount || 0);

  return (
    <Layout>
      <div className={styles.container}>
        <PageHeader
          title="Conciliação Bancária"
          subtitle="Vincule movimentos do banco com títulos do sistema."
          filters={
            <>
              <CompanySelector value={companyId} onChange={setCompanyId} />
              <Button variant="primary" onClick={handleAutoRun} disabled={isLoading || !companyId} icon={<ArrowDownUp size={16} />}>
                {isLoading ? 'Processando...' : 'Executar Automática'}
              </Button>
            </>
          }
        />

        {/* Painéis Lado a Lado */}
        <div className={styles.panelsGrid}>
          {/* Painel Esquerdo: Extrato Bancário */}
          <Card title="Extrato Bancário" subtitle="Movimentos pendentes no banco">
            <div className={styles.itemsList}>
              {unmatchedMovements.map(mov => (
                <div key={mov.id} className={`${styles.itemCard} ${selectedMovement?.id === mov.id ? styles.selected : ''}`} onClick={() => setSelectedMovement(mov)}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemDate}>{formatDateBR(mov.date)}</span>
                    <Badge variant={mov.type === 'CREDIT' ? 'success' : 'error'} size="small" withDot>
                      {mov.type === 'CREDIT' ? 'Crédito' : 'Débito'}
                    </Badge>
                  </div>
                  <p className={styles.itemDesc}>{mov.description}</p>
                  <span className={`${styles.itemValue} ${mov.type === 'CREDIT' ? styles.itemPositive : styles.itemNegative}`}>
                    {mov.type === 'CREDIT' ? '+' : '-'} {formatCurrency(mov.amount)}
                  </span>
                </div>
              ))}
              {unmatchedMovements.length === 0 && (
                <div className={styles.emptyState}>
                  <CheckCircle2 size={32} className={styles.emptyIcon} />
                  <p>Nenhum movimento pendente.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Painel Direito: ERP (Títulos) */}
          <Card title="Sistema (ERP)" subtitle="Títulos em aberto no sistema">
            <div className={styles.itemsList}>
              {unmatchedErp.map(erp => (
                <div key={erp.id} className={`${styles.itemCard} ${selectedErp?.id === erp.id ? styles.selected : ''}`} onClick={() => setSelectedErp(erp)}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemDate}>{formatDateBR(erp.date)}</span>
                    <Badge variant={erp.type === 'RECEIVABLE' ? 'success' : 'error'} size="small" withDot>
                      {erp.type === 'RECEIVABLE' ? 'Receber' : 'Pagar'}
                    </Badge>
                  </div>
                  <p className={styles.itemDesc}>{erp.description}</p>
                  <span className={styles.itemValue}>{formatCurrency(erp.amount)}</span>
                </div>
              ))}
              {unmatchedErp.length === 0 && (
                <div className={styles.emptyState}>
                  <CheckCircle2 size={32} className={styles.emptyIcon} />
                  <p>Nenhum título pendente.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Barra de Ação de Conciliação Manual */}
        {selectedMovement && selectedErp && (
          <div className={styles.actionsBar}>
            <div className={styles.matchInfo}>
              <div className={styles.matchItem}>
                <Link size={16} className={styles.matchIcon} />
                <span className={styles.matchDesc}>{selectedMovement.description}</span>
                <span className={styles.matchArrow}>↔</span>
                <span className={styles.matchDesc}>{selectedErp.description}</span>
              </div>
              <div className={styles.matchValues}>
                <div className={styles.matchValueItem}>
                  <span className={styles.matchLabel}>Diferença</span>
                  <span className={`${styles.matchDiff} ${diff === 0 ? styles.diffSuccess : styles.diffWarning}`}>
                    {formatCurrency(Math.abs(diff))}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant={diff === 0 ? 'primary' : 'warning'}
              onClick={handleManualLink}
              disabled={isLoading}
              size="lg"
              icon={<Link size={16} />}
            >
              {diff === 0 ? 'Vincular (Valores Iguais)' : 'Vincular com Diferença'}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
