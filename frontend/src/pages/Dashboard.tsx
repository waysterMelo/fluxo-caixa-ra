import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import styles from './Dashboard.module.css';

interface DashboardData {
  saldoAtual: number;
  entradas: number;
  saidas: number;
  saldoPrevisto: number;
  contasPagar: number;
  contasReceber: number;
  fluxoSemanal: Array<{ dia: string; entradas: number; saidas: number }>;
  movimentacoesRecentes: Array<{
    id: number;
    descricao: string;
    valor: number;
    data: string;
    tipo: 'entrada' | 'saida';
  }>;
  alertas: Array<{
    id: number;
    mensagem: string;
    tipo: 'warning' | 'error' | 'info' | 'success';
  }>;
}

// Ícones para KPIs
const KpiIcons = {
  wallet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 010-4h14v4" />
      <path d="M3 5v14a2 2 0 002 2h16v-5" />
      <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  ),
  arrowUp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  arrowDown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData({
        saldoAtual: 125000.00,
        entradas: 45000.00,
        saidas: 32000.00,
        saldoPrevisto: 138000.00,
        contasPagar: 18500.00,
        contasReceber: 27000.00,
        fluxoSemanal: [
          { dia: 'Seg', entradas: 8200, saidas: 4500 },
          { dia: 'Ter', entradas: 12000, saidas: 7800 },
          { dia: 'Qua', entradas: 5500, saidas: 3200 },
          { dia: 'Qui', entradas: 9800, saidas: 6100 },
          { dia: 'Sex', entradas: 15000, saidas: 8400 },
          { dia: 'Sáb', entradas: 3200, saidas: 1200 },
          { dia: 'Dom', entradas: 1800, saidas: 800 },
        ],
        movimentacoesRecentes: [
          { id: 1, descricao: 'Pagamento cliente XYZ', valor: 5500.00, data: '2026-04-13', tipo: 'entrada' },
          { id: 2, descricao: 'Fornecedor ABC', valor: 3200.00, data: '2026-04-12', tipo: 'saida' },
          { id: 3, descricao: 'Recebimento NF 1234', valor: 8900.00, data: '2026-04-11', tipo: 'entrada' },
          { id: 4, descricao: 'Aluguel escritório', valor: 4500.00, data: '2026-04-10', tipo: 'saida' },
          { id: 5, descricao: 'Projeto consultoria', valor: 12000.00, data: '2026-04-09', tipo: 'entrada' },
        ],
        alertas: [
          { id: 1, mensagem: '5 contas a vencer esta semana', tipo: 'warning' },
          { id: 2, mensagem: 'Conciliação pendente do dia 10/04', tipo: 'info' },
          { id: 3, mensagem: 'Importação ERP concluída com sucesso', tipo: 'success' },
        ],
      });
      setLoading(false);
    }, 600);
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
    return formatCurrency(value);
  };

  const alertIcons: Record<string, React.ReactNode> = {
    warning: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    success: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  };

  return (
    <Layout>
      <div className={styles.dashboard}>
        <PageHeader
          title="Painel Financeiro"
          subtitle="Visão geral do fluxo de caixa e indicadores financeiros"
        />

        {loading ? (
          <div className={styles.skeletonGrid}>
            {[...Array(4)].map((_, i) => <Skeleton key={i} variant="metric" />)}
          </div>
        ) : data ? (
          <>
            {/* KPIs Principais */}
            <section className={styles.kpiRow}>
              <MetricCard
                label="Saldo Atual"
                value={formatCurrency(data.saldoAtual)}
                subtitle="Posição consolidada hoje"
                size="large"
                variant="info"
                icon={KpiIcons.wallet}
              />
              <MetricCard
                label="Entradas"
                value={formatCurrency(data.entradas)}
                subtitle="Recebimentos realizados"
                size="large"
                variant="success"
                icon={KpiIcons.arrowUp}
                trend={{ value: '+12.5%', direction: 'up' }}
              />
              <MetricCard
                label="Saídas"
                value={formatCurrency(data.saidas)}
                subtitle="Pagamentos efetuados"
                size="large"
                variant="error"
                icon={KpiIcons.arrowDown}
                trend={{ value: '-8.2%', direction: 'down' }}
              />
              <MetricCard
                label="Saldo Previsto"
                value={formatCurrency(data.saldoPrevisto)}
                subtitle="Projeção para 30 dias"
                size="large"
                variant="success"
                icon={KpiIcons.target}
              />
            </section>

            {/* KPIs Secundários */}
            <section className={styles.kpiRowSecondary}>
              <MetricCard
                label="Contas a Pagar"
                value={formatCurrency(data.contasPagar)}
                subtitle="Próximos 30 dias"
                variant="warning"
                density="compact"
              />
              <MetricCard
                label="Contas a Receber"
                value={formatCurrency(data.contasReceber)}
                subtitle="Próximos 30 dias"
                variant="success"
                density="compact"
              />
            </section>

            {/* Gráfico + Movimentações */}
            <section className={styles.contentGrid}>
              {/* Gráfico de Fluxo Semanal */}
              <Card title="Fluxo da Semana" subtitle="Entradas vs Saídas (últimos 7 dias)">
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data.fluxoSemanal} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16A34A" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#DC2626" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="dia"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        tickFormatter={formatCurrencyShort}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          fontSize: '13px',
                          padding: '12px 16px',
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value))]}
                        labelStyle={{ color: '#64748B', fontWeight: 600, marginBottom: 4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="entradas"
                        stroke="#16A34A"
                        strokeWidth={2}
                        fill="url(#gradEntradas)"
                        name="Entradas"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#16A34A' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="saidas"
                        stroke="#DC2626"
                        strokeWidth={2}
                        fill="url(#gradSaidas)"
                        name="Saídas"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#DC2626' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Movimentações Recentes */}
              <Card title="Movimentações Recentes" subtitle="Últimas 5 operações">
                <div className={styles.movList}>
                  {data.movimentacoesRecentes.map((mov) => (
                    <div key={mov.id} className={styles.movItem}>
                      <div className={`${styles.movDot} ${mov.tipo === 'entrada' ? styles.dotGreen : styles.dotRed}`} />
                      <div className={styles.movInfo}>
                        <span className={styles.movDesc}>{mov.descricao}</span>
                        <span className={styles.movDate}>
                          {new Date(mov.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <span className={`${styles.movValue} ${mov.tipo === 'entrada' ? styles.valuePositive : styles.valueNegative}`}>
                        {mov.tipo === 'entrada' ? '+' : '−'} {formatCurrency(mov.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* Alertas */}
            {data.alertas.length > 0 && (
              <section>
                <Card title="Alertas e Notificações">
                  <div className={styles.alertsList}>
                    {data.alertas.map((alerta) => (
                      <div key={alerta.id} className={`${styles.alertItem} ${styles[`alert_${alerta.tipo}`]}`}>
                        <span className={styles.alertIcon}>{alertIcons[alerta.tipo]}</span>
                        <span className={styles.alertText}>{alerta.mensagem}</span>
                        <Badge variant={alerta.tipo} size="small">{alerta.tipo === 'warning' ? 'Atenção' : alerta.tipo === 'info' ? 'Info' : alerta.tipo === 'success' ? 'OK' : 'Erro'}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>
            )}
          </>
        ) : (
          <Card>
            <p>Nenhum dado disponível.</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
