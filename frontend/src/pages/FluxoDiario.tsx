import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { Company, listCompanies } from '../services/companyService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { getDailyFlow, DailyFlowSummary, Movement } from '../services/flowService';
import { getTodayLocal, formatDateBR } from '../utils/date';
import styles from './FluxoDiario.module.css';

export default function FluxoDiario() {
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
  const [error, setError] = useState('');

  const loadFlow = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getDailyFlow(companyId, dataFiltro);
      setResumo(data);
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível carregar o fluxo diário.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlow();
  }, [companyId]);

  const movementsComSaldo = useMemo(() => {
    if (!resumo?.movements) return [];
    let saldoAtual = resumo.initial_balance_info?.amount || 0;
    return resumo.movements.map(mov => {
      if (mov.tipo === 'ENTRADA') {
        saldoAtual += mov.valor;
      } else {
        saldoAtual -= mov.valor;
      }
      return { ...mov, saldoAcumulado: saldoAtual };
    });
  }, [resumo]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const colunas = [
    { header: 'DATA', accessor: (row: Movement) => formatDateBR(row.data) },
    { header: 'DESCRIÇÃO', accessor: 'descricao' as keyof Movement },
    { header: 'CATEGORIA', accessor: 'categoria' as keyof Movement },
    {
      header: 'TIPO',
      accessor: (row: Movement) => (
        <Badge variant={row.tipo === 'ENTRADA' ? 'success' : 'error'} size="small">
          {row.tipo}
        </Badge>
      )
    },
    {
      header: 'STATUS',
      accessor: (row: Movement) => (
        <Badge 
          variant={row.status === 'REALIZADO' ? 'success' : 'warning'} 
          size="small"
        >
          {row.status}
        </Badge>
      )
    },
    {
      header: 'VALOR',
      accessor: (row: Movement) => formatarMoeda(row.valor),
      align: 'right' as const
    },
    {
      header: 'SALDO',
      accessor: (row: any) => formatarMoeda(row.saldoAcumulado),
      align: 'right' as const
    },
  ];

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2>Fluxo Diário</h2>
            <p>Acompanhamento de entradas e saídas do dia.</p>
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
              label="DATA DE REFERÊNCIA"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              variant="date"
            />
            <Button variant="primary" onClick={loadFlow} disabled={isLoading}>
              {isLoading ? 'CARREGANDO...' : 'ATUALIZAR'}
            </Button>
          </div>
        </div>

        {error && (
          <div className={styles.alertBox}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Info Saldo Inicial */}
        {resumo?.initial_balance_info && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Card
              title="SALDO INICIAL CADASTRADO"
              subtitle={`Registrado em: ${formatDateBR(resumo.initial_balance_info.date)}`}
              className=""
            >
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: 'var(--font-size-2xl)', 
                fontWeight: 600,
                color: 'var(--accent-green)'
              }}>
                {formatarMoeda(resumo.initial_balance_info.amount)}
              </span>
            </Card>
          </div>
        )}

        {/* Cards de Resumo (KPIs) */}
        <div className={styles.cardsGrid}>
          <MetricCard
            label="SALDO ANTERIOR"
            value={formatarMoeda(resumo?.opening_balance || 0)}
            subtitle="Fechamento do dia anterior"
            size="large"
          />
          <MetricCard
            label="ENTRADAS REALIZADAS"
            value={formatarMoeda(resumo?.realized_in || 0)}
            subtitle="Títulos recebidos no período"
            variant="success"
            size="large"
          />
          <MetricCard
            label="SAÍDAS REALIZADAS"
            value={formatarMoeda(resumo?.realized_out || 0)}
            subtitle="Títulos pagos no período"
            variant="error"
            size="large"
          />
          <MetricCard
            label="SALDO FINAL"
            value={formatarMoeda(resumo?.flow_balance || 0)}
            subtitle="Saldo Anterior + Entradas - Saídas"
            variant="info"
            size="large"
          />
        </div>

        {/* Métricas Secundárias */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
           <MetricCard
            label="SALDO EM BANCO"
            value={formatarMoeda(resumo?.bank_balance || 0)}
            subtitle="Saldo disponível no extrato"
            density="compact"
          />
          <MetricCard
            label="DIFERENÇA (CAIXA × BANCO)"
            value={formatarMoeda(resumo?.difference || 0)}
            subtitle="Valores não conciliados"
            variant={(resumo?.difference || 0) !== 0 ? 'warning' : 'success'}
            density="compact"
          />
           <MetricCard
            label="ENTRADAS PREVISTAS"
            value={formatarMoeda(resumo?.planned_in || 0)}
            subtitle="Títulos a receber não baixados"
            density="compact"
          />
           <MetricCard
            label="SAÍDAS PREVISTAS"
            value={formatarMoeda(resumo?.planned_out || 0)}
            subtitle="Títulos a pagar não baixados"
            density="compact"
          />
        </div>

        {/* Tabela de Movimentações */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>MOVIMENTAÇÕES DO DIA</h3>
            <Button variant="secondary" size="sm">EXPORTAR CSV</Button>
          </div>

          <Table
            columns={colunas}
            data={movementsComSaldo}
            keyExtractor={(item) => item.id}
            compact
            striped
          />
        </div>
      </div>
    </Layout>
  );
}
