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

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <PageHeader
          title="Relatório Consolidado do Grupo"
          subtitle="Visão gerencial do fluxo de caixa e saldos líquidos (desconsiderando transferências internas)."
          filters={
            <>
              <Input 
                type="date" 
                label="DATA DE REFERÊNCIA" 
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                variant="date"
              />
              <Button variant="secondary" onClick={loadData} disabled={isLoading}>
                {isLoading ? 'CARREGANDO...' : 'ATUALIZAR'}
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
            <div className={styles.tableSection}>
              <div style={{ paddingBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 var(--spacing-xs)' }}>
                  Indicadores Líquidos (Visão Grupo)
                </h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                  Totais descontando R$ {formatarMoeda(data.internal_transfers_eliminated)} em transferências entre empresas do grupo.
                </p>
              </div>
              
              <div className={styles.metricsGrid}>
                <MetricCard 
                  label="Saldo Inicial Consolidado" 
                  value={formatarMoeda(data.net.opening_balance)} 
                  density="compact" 
                />
                <MetricCard 
                  label="Entradas Líquidas" 
                  value={formatarMoeda(data.net.total_in)} 
                  variant="success" 
                  density="compact" 
                />
                <MetricCard 
                  label="Saídas Líquidas" 
                  value={formatarMoeda(data.net.total_out)} 
                  variant="error" 
                  density="compact" 
                />
                <MetricCard 
                  label="Saldo Final Consolidado" 
                  value={formatarMoeda(data.net.flow_balance)} 
                  variant="info" 
                  density="compact" 
                />
                <MetricCard 
                  label="Saldo em Banco (Grupo)" 
                  value={formatarMoeda(data.net.bank_balance)}
                  density="compact" 
                  style={{ border: '1px solid var(--accent-purple)', background: 'var(--accent-purple-light)' }}
                />
              </div>
            </div>

            {/* Seção 2: Breakdown por Empresa */}
            <div className={styles.tableSection}>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 var(--spacing-md)' }}>
                Detalhamento Bruto por Empresa
              </h3>
              
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={`${styles.th} ${styles.textLeft}`}>EMPRESA</th>
                      <th className={styles.th}>SALDO INICIAL</th>
                      <th className={styles.th}>ENTRADAS (BRUTO)</th>
                      <th className={styles.th}>SAÍDAS (BRUTO)</th>
                      <th className={styles.th}>SALDO FINAL (CAIXA)</th>
                      <th className={styles.th}>SALDO FINAL (BANCO)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.companies_breakdown.map((company) => (
                      <tr key={company.company_id} className={styles.tr}>
                        <td className={`${styles.td} ${styles.textLeft} ${styles.textBold}`}>{company.company_name}</td>
                        <td className={styles.td}>{formatarMoeda(company.opening_balance)}</td>
                        <td className={`${styles.td} ${styles.tdPositive}`}>{formatarMoeda(company.total_in)}</td>
                        <td className={`${styles.td} ${styles.tdNegative}`}>{formatarMoeda(company.total_out)}</td>
                        <td className={`${styles.td} ${styles.tdNeutral} ${styles.textBold}`}>{formatarMoeda(company.flow_balance)}</td>
                        <td className={`${styles.td} ${styles.tdSpecial}`}>{formatarMoeda(company.bank_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Linha de Totais Brutos */}
                  <tfoot className={styles.tfoot}>
                    <tr>
                      <td className={`${styles.td} ${styles.textLeft}`}>TOTAL BRUTO</td>
                      <td className={styles.td}>{formatarMoeda(data.gross.opening_balance)}</td>
                      <td className={styles.td}>{formatarMoeda(data.gross.total_in)}</td>
                      <td className={styles.td}>{formatarMoeda(data.gross.total_out)}</td>
                      <td className={styles.td}>{formatarMoeda(data.gross.flow_balance)}</td>
                      <td className={styles.td}>{formatarMoeda(data.gross.bank_balance)}</td>
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
