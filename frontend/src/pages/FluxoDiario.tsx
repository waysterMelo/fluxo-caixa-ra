import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { CompanySelector } from '../components/CompanySelector';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SortableTable } from '../components/ui/SortableTable';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { getDailyFlow, DailyFlowSummary, Movement } from '../services/flowService';
import { getTodayLocal, formatDateBR } from '../utils/date';
import styles from './FluxoDiario.module.css';

const MESES = [
  { value: 'todos', label: 'Todos os meses' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
];

export default function FluxoDiario() {
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [mesFiltro, setMesFiltro] = useState<string>('todos');
  const [resumo, setResumo] = useState<DailyFlowSummary | null>(null);
  const [orderedMovements, setOrderedMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFlow = async () => {
    if (!companyId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await getDailyFlow(companyId, getTodayLocal());
      setResumo(data);
      setOrderedMovements(data.movements || []);
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível carregar o fluxo diário.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) loadFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleDataChange = (newData: Movement[]) => {
    setOrderedMovements(newData);
  };

  const movementsComSaldo = useMemo(() => {
    let saldoAtual = resumo?.initial_balance_info?.amount || 0;
    return orderedMovements.map(mov => {
      if (mov.tipo === 'ENTRADA') {
        saldoAtual += mov.valor;
      } else {
        saldoAtual -= mov.valor;
      }
      return { ...mov, saldoAcumulado: saldoAtual };
    });
  }, [orderedMovements, resumo]);

  const movimentosExibidos = useMemo(() => {
    if (mesFiltro === 'todos') return movementsComSaldo;
    return movementsComSaldo.filter(mov => {
      const [, month] = mov.data.split('-');
      return month === mesFiltro;
    });
  }, [movementsComSaldo, mesFiltro]);

  // KPIs Dinâmicos
  let saldoInicialExibido = resumo?.initial_balance_info?.amount || 0;
  if (mesFiltro !== 'todos' && movimentosExibidos.length > 0) {
    const first = movimentosExibidos[0];
    saldoInicialExibido = first.saldoAcumulado - (first.tipo === 'ENTRADA' ? first.valor : -first.valor);
  }

  const totalEntradas = movimentosExibidos.filter(m => m.tipo === 'ENTRADA').reduce((acc, m) => acc + m.valor, 0);
  const totalSaidas = movimentosExibidos.filter(m => m.tipo === 'SAIDA').reduce((acc, m) => acc + m.valor, 0);

  const saldoFinalMes = movimentosExibidos.length > 0 
    ? movimentosExibidos[movimentosExibidos.length - 1].saldoAcumulado 
    : saldoInicialExibido;

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const colunas = [
    { header: 'DATA', accessor: (row: Movement) => formatDateBR(row.data) },
    { header: 'DESCRIÇÃO', accessor: 'descricao' as keyof Movement },
    { header: 'CATEGORIA', accessor: 'categoria' as keyof Movement },
    {
      header: 'TIPO',
      accessor: (row: Movement) => (
        <Badge variant={row.tipo === 'ENTRADA' ? 'success' : 'error'} size="small" withDot>
          {row.tipo}
        </Badge>
      )
    },
    {
      header: 'STATUS',
      accessor: (row: Movement) => (
        <Badge variant={row.status === 'REALIZADO' ? 'success' : 'warning'} size="small">
          {row.status}
        </Badge>
      )
    },
    {
      header: 'A PAGAR',
      accessor: (row: Movement) => formatarMoeda(row.valor),
      align: 'right' as const
    },
    {
      header: 'SALDO',
      accessor: (row: any) => formatarMoeda(row.saldoAcumulado),
      align: 'right' as const,
      cellStyle: (row: any) => ({
        backgroundColor: row.saldoAcumulado < 0 ? 'var(--status-error)' : row.saldoAcumulado > 0 ? 'var(--status-success)' : 'inherit',
        color: row.saldoAcumulado !== 0 ? '#FFFFFF' : 'inherit',
        fontWeight: 'var(--font-weight-bold)'
      })
    },
  ];

  return (
    <Layout>
      <div className={styles.container}>
        <PageHeader
          title="Fluxo Diário"
          subtitle="Acompanhamento de entradas e saídas e reordenação de faturas"
          filters={
            <>
              <CompanySelector value={companyId} onChange={setCompanyId} />
              <Select 
                label="MÊS"
                options={MESES}
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
              />
              <Button variant="primary" onClick={loadFlow} disabled={isLoading}>
                {isLoading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </>
          }
        />

        {error && (
          <div className={styles.alertBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <>
            <div className={styles.cardsGrid}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} variant="metric" />)}
            </div>
            <Skeleton variant="table" />
          </>
        ) : (
          <>
            {/* KPIs Principais */}
            <div className={styles.cardsGrid}>
              <MetricCard 
                label="SALDO INICIAL" 
                value={formatarMoeda(saldoInicialExibido)} 
                subtitle={mesFiltro === 'todos' ? `Cadastrado em: ${resumo?.initial_balance_info ? formatDateBR(resumo.initial_balance_info.date) : '--'}` : `Base do Mês`} 
              />
              <MetricCard 
                label="TOTAL DE ENTRADAS" 
                value={formatarMoeda(totalEntradas)} 
                subtitle="Deste período" 
                variant="success" 
              />
              <MetricCard 
                label="TOTAL DE SAÍDAS" 
                value={formatarMoeda(totalSaidas)} 
                subtitle="Deste período" 
                variant="error" 
              />
              <MetricCard 
                label={mesFiltro === 'todos' ? "SALDO FINAL DO FLUXO" : "SALDO FINAL MÊS"} 
                value={formatarMoeda(saldoFinalMes)} 
                subtitle={mesFiltro === 'todos' ? "Acumulado total" : "Projetado para este mês"} 
                variant="info" 
              />
            </div>

            {/* Tabela Interativa de Movimentações */}
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <div>
                  <h3 className={styles.tableTitle}>Movimentações do Período</h3>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Arraste as linhas para reordenar os lançamentos e recalcular o saldo acumulado.</p>
                </div>
                <Button variant="secondary" size="sm">Exportar CSV</Button>
              </div>
              <SortableTable
                columns={colunas}
                data={movimentosExibidos}
                onDataChange={handleDataChange}
                keyExtractor={(item) => item.id}
                compact
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
