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
import { useToast } from '../components/ui/Toast';
import { getDailyFlow, DailyFlowSummary, Movement, deleteMovement } from '../services/flowService';
import { getTodayLocal, formatDateBR } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Download, Info, GripVertical, ListFilter } from 'lucide-react';
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
  const { success, error } = useToast();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [mesFiltro, setMesFiltro] = useState<string>('todos');
  const [resumo, setResumo] = useState<DailyFlowSummary | null>(null);
  const [orderedMovements, setOrderedMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFlow = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await getDailyFlow(companyId, getTodayLocal());
      setResumo(data);
      setOrderedMovements(data.movements || []);
    } catch (err: any) {
      console.error(err);
      error('Não foi possível carregar o fluxo diário.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMovement = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta movimentação?')) return;
    try {
      await deleteMovement(id);
      success('Movimentação excluída com sucesso.');
      loadFlow();
    } catch (err: any) {
      console.error(err);
      error('Erro ao excluir a movimentação.');
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
      accessor: (row: Movement) => formatCurrency(row.valor),
      align: 'right' as const
    },
    {
      header: 'SALDO',
      accessor: (row: any) => formatCurrency(row.saldoAcumulado),
      align: 'right' as const,
      cellStyle: (row: any) => {
        const isNegative = row.saldoAcumulado < 0;
        return {
          color: isNegative ? 'var(--status-error)' : 'var(--status-success)',
          fontWeight: 600,
          backgroundColor: isNegative ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)',
        };
      },
    },
    {
      header: 'AÇÕES',
      accessor: (row: Movement) => (
        <Button variant="ghost" size="sm" onClick={() => handleDeleteMovement(row.id)}>
          Excluir
        </Button>
      ),
      align: 'center' as const,
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
              <Button variant="primary" onClick={loadFlow} disabled={isLoading} icon={<TrendingUp size={16} />}>
                {isLoading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </>
          }
        />

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
                label="Saldo Inicial"
                value={formatCurrency(saldoInicialExibido)}
                subtitle={mesFiltro === 'todos' ? `Cadastrado em: ${resumo?.initial_balance_info ? formatDateBR(resumo.initial_balance_info.date) : '--'}` : `Base do Mês`}
                icon={<Wallet size={18} />}
              />
              <MetricCard
                label="Total de Entradas"
                value={formatCurrency(totalEntradas)}
                subtitle="Deste período"
                variant="success"
                icon={<ArrowUpRight size={18} />}
              />
              <MetricCard
                label="Total de Saídas"
                value={formatCurrency(totalSaidas)}
                subtitle="Deste período"
                variant="error"
                icon={<ArrowDownRight size={18} />}
              />
              <MetricCard
                label={mesFiltro === 'todos' ? "Saldo Final do Fluxo" : "Saldo Final Mês"}
                value={formatCurrency(saldoFinalMes)}
                subtitle={mesFiltro === 'todos' ? "Acumulado total" : "Projetado para este mês"}
                variant="info"
                icon={<TrendingUp size={18} />}
              />
            </div>

            {/* Tabela Interativa de Movimentações */}
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <div className={styles.tableTitleGroup}>
                  <h3 className={styles.tableTitle}>
                    <ListFilter size={18} className="text-primary" />
                    Movimentações do Período
                  </h3>
                  <div className={styles.tableSubtitle}>
                    <Info size={16} />
                    <span>Você pode <strong>arrastar as linhas</strong> (usando o ícone <GripVertical size={14} style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.5 }} /> à esquerda) para reordenar os lançamentos e recalcular o saldo acumulado dinamicamente.</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" icon={<Download size={14} />}>Exportar CSV</Button>
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
