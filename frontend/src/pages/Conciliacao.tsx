import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Company, listCompanies } from '../services/companyService';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { runAutoReconciliation, createManualLink, getReconciliations } from '../services/reconciliationService';
import { formatDateBR } from '../utils/date';
import styles from './Conciliacao.module.css';

// Interfaces simplificadas para a demonstração da UI
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

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estados de seleção manual
  const [selectedMovement, setSelectedMovement] = useState<MockMovement | null>(null);
  const [selectedErp, setSelectedErp] = useState<MockERP | null>(null);

  // Dados Simulados para interface
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
    const fetchData = async () => {
      try {
        await getReconciliations(companyId);
      } catch (err) {
        console.error('Erro ao buscar conciliações', err);
      }
    };
    fetchData();
  }, [companyId]);

  const handleAutoRun = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await runAutoReconciliation(companyId);
      setMessage({ type: 'success', text: `Conciliação automática concluída. ${result.results.linked_count} vínculo(s) gerado(s).` });
      if (result.results.linked_count > 0) {
        setUnmatchedMovements(prev => prev.filter(m => m.id !== 101 && m.id !== 102));
        setUnmatchedErp(prev => prev.filter(e => e.id !== 201 && e.id !== 202));
        setSelectedMovement(null);
        setSelectedErp(null);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erro ao executar conciliação automática.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLink = async () => {
    if (!selectedMovement || !selectedErp) return;

    setIsLoading(true);
    setMessage(null);
    try {
      await createManualLink({
        movement_id: selectedMovement.id,
        target_type: selectedErp.type,
        target_id: selectedErp.id
      });
      setMessage({ type: 'success', text: 'Vínculo manual realizado com sucesso!' });

      setUnmatchedMovements(prev => prev.filter(m => m.id !== selectedMovement.id));
      setUnmatchedErp(prev => prev.filter(e => e.id !== selectedErp.id));
      setSelectedMovement(null);
      setSelectedErp(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erro ao realizar vínculo manual.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const diff = (selectedMovement?.amount || 0) - (selectedErp?.amount || 0);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2>Conciliação Bancária</h2>
            <p>Vincule movimentos do banco com títulos do sistema.</p>
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
            <Button variant="primary" onClick={handleAutoRun} disabled={isLoading}>
              {isLoading ? 'PROCESSANDO...' : 'EXECUTAR AUTOMÁTICA'}
            </Button>
          </div>
        </div>

        {message && (
          <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
            {message.text}
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.grid}>
            {/* Painel Esquerdo: Extrato Bancário */}
            <div className={styles.panel}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>EXTRATO BANCÁRIO</span>
                <Badge variant="info" size="small">{unmatchedMovements.length} PENDENTES</Badge>
              </div>

              {unmatchedMovements.map(mov => (
                <div
                  key={mov.id}
                  className={`${styles.itemCard} ${selectedMovement?.id === mov.id ? styles.selected : ''}`}
                  onClick={() => setSelectedMovement(mov)}
                >
                  <div className={styles.itemInfo}>
                    <span className={styles.itemDate}>{formatDateBR(mov.date)}</span>
                    <span className={styles.itemDesc}>{mov.description}</span>
                    <Badge variant={mov.type === 'CREDIT' ? 'success' : 'error'} size="small">
                      {mov.type === 'CREDIT' ? 'CRÉDITO' : 'DÉBITO'}
                    </Badge>
                  </div>
                  <span className={`${styles.itemValue} ${mov.type === 'CREDIT' ? styles.itemPositive : styles.itemNegative}`}>
                    {mov.type === 'CREDIT' ? '+' : '-'}{formatarMoeda(mov.amount)}
                  </span>
                </div>
              ))}
              {unmatchedMovements.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Nenhum movimento pendente.
                </div>
              )}
            </div>

            {/* Painel Direito: ERP (Títulos) */}
            <div className={styles.panel}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>SISTEMA (ERP)</span>
                <Badge variant="warning" size="small">{unmatchedErp.length} EM ABERTO</Badge>
              </div>

              {unmatchedErp.map(erp => (
                <div
                  key={erp.id}
                  className={`${styles.itemCard} ${selectedErp?.id === erp.id ? styles.selected : ''}`}
                  onClick={() => setSelectedErp(erp)}
                >
                  <div className={styles.itemInfo}>
                    <span className={styles.itemDate}>{formatDateBR(erp.date)}</span>
                    <span className={styles.itemDesc}>{erp.description}</span>
                    <Badge variant={erp.type === 'RECEIVABLE' ? 'success' : 'error'} size="small">
                      {erp.type === 'RECEIVABLE' ? 'RECEBER' : 'PAGAR'}
                    </Badge>
                  </div>
                  <span className={styles.itemValue}>
                    {formatarMoeda(erp.amount)}
                  </span>
                </div>
              ))}
              {unmatchedErp.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Nenhum título pendente.
                </div>
              )}
            </div>
          </div>

          {/* Barra de Ação de Conciliação Manual */}
          {selectedMovement && selectedErp && (
            <div className={styles.actionsBar}>
              <div className={styles.matchInfo}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DIFERENÇA</span>
                  <span className={`${styles.matchDiff} ${diff === 0 ? 'text-success' : 'text-error'}`}>
                    {formatarMoeda(Math.abs(diff))}
                  </span>
                </div>
              </div>

              <Button
                variant={diff === 0 ? 'primary' : 'warning'}
                onClick={handleManualLink}
                disabled={isLoading}
              >
                {diff === 0 ? 'VINCULAR (VALORES IGUAIS)' : 'VINCULAR COM DIFERENÇA'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
