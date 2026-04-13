import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { getConsolidated, ConsolidatedResponse } from '../services/consolidatedService';
import { getTodayLocal } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Building2, RefreshCw } from 'lucide-react';
import styles from './Relatorios.module.css';

export default function Relatorios() {
  const { error } = useToast();
  const [dataFiltro, setDataFiltro] = useState(getTodayLocal());
  const [data, setData] = useState<ConsolidatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getConsolidated(dataFiltro);
      setData(result);
    } catch (err: any) {
      console.error(err);
      error('Não foi possível carregar o relatório consolidado.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataFiltro]);

  return (
    <Layout>
      <div className={styles.container}>
        <PageHeader
          title="Relatório Consolidado do Grupo"
          subtitle="Visão gerencial do fluxo de caixa e saldos líquidos (desconsiderando transferências internas)."
          filters={
            <>
              <Input type="date" label="DATA DE REFERÊNCIA" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} variant="date" />
              <Button variant="secondary" onClick={loadData} disabled={isLoading} icon={<RefreshCw size={16} />}>
                {isLoading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </>
          }
        />

        {isLoading && !data ? (
          <div className={styles.metricsGrid}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} variant="metric" />)}
          </div>
        ) : data ? (
          <>
            {/* Seção 1: Indicadores Líquidos do Grupo */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Indicadores Líquidos (Visão Grupo)</h3>
                <p className={styles.sectionSubtitle}>
                  Totais descontando R$ {formatCurrency(data.internal_transfers_eliminated)} em transferências internas.
                </p>
              </div>
              <div className={styles.metricsGrid}>
                <MetricCard
                  label="Saldo Inicial Consolidado"
                  value={formatCurrency(data.net.opening_balance)}
                  density="compact"
                  icon={<Wallet size={18} />}
                />
                <MetricCard
                  label="Entradas Líquidas"
                  value={formatCurrency(data.net.total_in)}
                  variant="success"
                  density="compact"
                  icon={<ArrowUpRight size={18} />}
                />
                <MetricCard
                  label="Saídas Líquidas"
                  value={formatCurrency(data.net.total_out)}
                  variant="error"
                  density="compact"
                  icon={<ArrowDownRight size={18} />}
                />
                <MetricCard
                  label="Saldo Final Consolidado"
                  value={formatCurrency(data.net.flow_balance)}
                  variant="info"
                  density="compact"
                  icon={<TrendingUp size={18} />}
                />
                <MetricCard
                  label="Saldo em Banco (Grupo)"
                  value={formatCurrency(data.net.bank_balance)}
                  density="compact"
                  icon={<Building2 size={18} />}
                />
              </div>
            </div>

            {/* Seção 2: Breakdown por Empresa */}
            <div className={styles.tableSection}>
              <h3 className={styles.tableTitle}>Detalhamento Bruto por Empresa</h3>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={`${styles.th} ${styles.textLeft}`}>Empresa</th>
                      <th className={styles.th}>Saldo Inicial</th>
                      <th className={styles.th}>Entradas (Bruto)</th>
                      <th className={styles.th}>Saídas (Bruto)</th>
                      <th className={styles.th}>Saldo Final (Caixa)</th>
                      <th className={styles.th}>Saldo Final (Banco)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.companies_breakdown.map((company) => (
                      <tr key={company.company_id} className={styles.tr}>
                        <td className={`${styles.td} ${styles.textLeft} ${styles.textBold}`}>
                          <div className={styles.companyCell}>
                            <Building2 size={14} className={styles.companyCellIcon} />
                            {company.company_name}
                          </div>
                        </td>
                        <td className={styles.td}>{formatCurrency(company.opening_balance)}</td>
                        <td className={`${styles.td} ${styles.tdPositive}`}>{formatCurrency(company.total_in)}</td>
                        <td className={`${styles.td} ${styles.tdNegative}`}>{formatCurrency(company.total_out)}</td>
                        <td className={`${styles.td} ${styles.tdNeutral} ${styles.textBold}`}>{formatCurrency(company.flow_balance)}</td>
                        <td className={`${styles.td} ${styles.tdSpecial}`}>{formatCurrency(company.bank_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className={styles.tfoot}>
                    <tr>
                      <td className={`${styles.td} ${styles.textLeft}`}>Total Bruto</td>
                      <td className={styles.td}>{formatCurrency(data.gross.opening_balance)}</td>
                      <td className={styles.td}>{formatCurrency(data.gross.total_in)}</td>
                      <td className={styles.td}>{formatCurrency(data.gross.total_out)}</td>
                      <td className={styles.td}>{formatCurrency(data.gross.flow_balance)}</td>
                      <td className={styles.td}>{formatCurrency(data.gross.bank_balance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
