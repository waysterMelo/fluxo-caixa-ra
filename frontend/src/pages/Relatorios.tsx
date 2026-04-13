import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { getConsolidated, ConsolidatedResponse } from '../services/consolidatedService';
import { getTodayLocal } from '../utils/date';
import styles from './Relatorios.module.css';

export default function Relatorios() {
  const [dataFiltro, setDataFiltro] = useState(getTodayLocal());
  const [data, setData] = useState<ConsolidatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getConsolidated(dataFiltro);
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível carregar o relatório consolidado.');
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
        <div className={styles.header}>
          <div>
            <h2>Relatório Consolidado do Grupo</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Visão gerencial do fluxo de caixa e saldos líquidos (desconsiderando transferências internas).
            </p>
          </div>
          
          <div className={styles.filters}>
            <Input 
              type="date" 
              label="Data de Referência" 
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
            />
            <Button variant="primary" onClick={loadData} disabled={isLoading}>
              {isLoading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {error && (
          <div className={styles.alert}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Seção 1: Indicadores Líquidos do Grupo */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Indicadores Líquidos (Visão Grupo)</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                Totais descontando R$ {formatarMoeda(data.internal_transfers_eliminated)} em transferências entre empresas do grupo.
              </p>
              
              <div className={styles.cardsGrid}>
                <Card title="Saldo Inicial Consolidado">
                  {formatarMoeda(data.net.opening_balance)}
                </Card>
                <Card title="Entradas Líquidas" className={styles.cardPositive}>
                  {formatarMoeda(data.net.total_in)}
                </Card>
                <Card title="Saídas Líquidas" className={styles.cardNegative}>
                  {formatarMoeda(data.net.total_out)}
                </Card>
                <Card title="Saldo Final Consolidado" className={styles.cardNeutral}>
                  {formatarMoeda(data.net.flow_balance)}
                </Card>
                <Card title="Saldo em Banco (Grupo)" className={styles.cardSpecial}>
                  {formatarMoeda(data.net.bank_balance)}
                </Card>
              </div>
            </div>

            {/* Seção 2: Breakdown por Empresa */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Detalhamento Bruto por Empresa</h3>
              
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
                        <td className={`${styles.td} ${styles.textLeft} ${styles.textBold}`}>{company.company_name}</td>
                        <td className={styles.td}>{formatarMoeda(company.opening_balance)}</td>
                        <td className={`${styles.td} ${styles.cardPositive}`}>{formatarMoeda(company.total_in)}</td>
                        <td className={`${styles.td} ${styles.cardNegative}`}>{formatarMoeda(company.total_out)}</td>
                        <td className={`${styles.td} ${styles.cardNeutral} ${styles.textBold}`}>{formatarMoeda(company.flow_balance)}</td>
                        <td className={`${styles.td} ${styles.cardSpecial}`}>{formatarMoeda(company.bank_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Linha de Totais Brutos */}
                  <tfoot>
                    <tr style={{ backgroundColor: 'var(--color-bg)' }}>
                      <td className={`${styles.td} ${styles.textLeft} ${styles.textBold}`}>TOTAL BRUTO</td>
                      <td className={`${styles.td} ${styles.textBold}`}>{formatarMoeda(data.gross.opening_balance)}</td>
                      <td className={`${styles.td} ${styles.textBold}`}>{formatarMoeda(data.gross.total_in)}</td>
                      <td className={`${styles.td} ${styles.textBold}`}>{formatarMoeda(data.gross.total_out)}</td>
                      <td className={`${styles.td} ${styles.textBold}`}>{formatarMoeda(data.gross.flow_balance)}</td>
                      <td className={`${styles.td} ${styles.textBold}`}>{formatarMoeda(data.gross.bank_balance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
