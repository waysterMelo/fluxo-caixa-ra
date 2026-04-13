import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Info,
  XCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatCurrencyCompact, getValueColorClass } from '../utils/currency';
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

  const alertIcons: Record<string, React.ReactNode> = {
    warning: <AlertTriangle size={16} />,
    info: <Info size={16} />,
    success: <CheckCircle2 size={16} />,
    error: <XCircle size={16} />,
  };

  const alertLabels: Record<string, string> = {
    warning: 'Atenção',
    info: 'Info',
    success: 'OK',
    error: 'Erro',
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
            {/* SEÇÃO 1 — Alertas Críticos (prioridade máxima) */}
            {data.alertas.length > 0 && (
              <section className={styles.alertsSection}>
                <Card variant="simple" className={styles.alertsCard}>
                  <div className={styles.alertsHeader}>
                    <AlertTriangle size={18} className={styles.alertsIcon} />
                    <h3 className={styles.alertsTitle}>Atenção — {data.alertas.length} alerta{data.alertas.length > 1 ? 's' : ''}</h3>
                  </div>
                  <div className={styles.alertsList}>
                    {data.alertas.map((alerta) => (
                      <div key={alerta.id} className={styles.alertItem}>
                        <span className={styles.alertIcon}>{alertIcons[alerta.tipo]}</span>
                        <span className={styles.alertText}>{alerta.mensagem}</span>
                        <Badge variant={alerta.tipo} size="small" withDot>
                          {alertLabels[alerta.tipo]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>
            )}

            {/* SEÇÃO 2 — Posição de Caixa (KPI Hero) */}
            <section className={styles.heroSection}>
              <Card variant="hero" className={styles.heroCard}>
                <div className={styles.heroContent}>
                  <div className={styles.heroLeft}>
                    <div className={styles.heroLabel}>
                      <Wallet size={16} />
                      <span>Posição de Caixa</span>
                    </div>
                    <div className={styles.heroValue}>{formatCurrency(data.saldoAtual)}</div>
                    <div className={styles.heroSubtitle}>Saldo consolidado hoje</div>
                  </div>
                  
                  <div className={styles.heroCenter}>
                    <div className={styles.heroStat}>
                      <div className={styles.heroStatLabel}>
                        <ArrowUpRight size={14} />
                        Entradas
                      </div>
                      <div className={`${styles.heroStatValue} ${styles.textSuccess}`}>
                        {formatCurrency(data.entradas)}
                      </div>
                    </div>
                    <div className={styles.heroDivider} />
                    <div className={styles.heroStat}>
                      <div className={styles.heroStatLabel}>
                        <ArrowDownRight size={14} />
                        Saídas
                      </div>
                      <div className={`${styles.heroStatValue} ${styles.textError}`}>
                        {formatCurrency(data.saidas)}
                      </div>
                    </div>
                  </div>

                  <div className={styles.heroRight}>
                    <div className={styles.heroTrendLabel}>Saldo do período</div>
                    <div className={`${styles.heroTrendValue} ${getValueColorClass(data.entradas - data.saidas)}`}>
                      {formatCurrency(data.entradas - data.saidas)}
                    </div>
                    <div className={styles.heroTrendIcon}>
                      <Sparkles size={14} />
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* SEÇÃO 3 — Indicadores Secundários (grid 4 colunas) */}
            <section className={styles.kpiRow}>
              <MetricCard
                label="Saldo Previsto"
                value={formatCurrency(data.saldoPrevisto)}
                subtitle="Projeção para 30 dias"
                size="large"
                variant="info"
                icon={<TrendingUp size={18} />}
                trend={{ value: '+9.8%', direction: 'up' }}
              />
              <MetricCard
                label="Contas a Pagar"
                value={formatCurrency(data.contasPagar)}
                subtitle="Próximos 30 dias"
                variant="warning"
                icon={<ArrowDownRight size={18} />}
              />
              <MetricCard
                label="Contas a Receber"
                value={formatCurrency(data.contasReceber)}
                subtitle="Próximos 30 dias"
                variant="success"
                icon={<ArrowUpRight size={18} />}
              />
              <MetricCard
                label="Saldo Líquido"
                value={formatCurrency(data.contasReceber - data.contasPagar)}
                subtitle="A receber - a pagar"
                variant={data.contasReceber - data.contasPagar >= 0 ? 'success' : 'error'}
                icon={<Wallet size={18} />}
              />
            </section>

            {/* SEÇÃO 4 — Gráfico de Fluxo */}
            <section className={styles.contentGrid}>
              <Card 
                title="Evolução — Últimos 7 Dias" 
                subtitle="Entradas vs Saídas diárias"
                className={styles.chartCard}
              >
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data.fluxoSemanal} margin={{ top: 12, right: 12, left: -16, bottom: 4 }}>
                      <defs>
                        <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="dia"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        tickFormatter={formatCurrencyCompact}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          fontSize: '13px',
                          padding: '12px 16px',
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value))]}
                        labelStyle={{ color: '#475569', fontWeight: 600, marginBottom: 6, fontSize: '12px' }}
                        itemStyle={{ fontWeight: 500 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="entradas"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fill="url(#gradEntradas)"
                        name="Entradas"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF', fill: '#10B981' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="saidas"
                        stroke="#EF4444"
                        strokeWidth={2.5}
                        fill="url(#gradSaidas)"
                        name="Saídas"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF', fill: '#EF4444' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Movimentações Recentes */}
              <Card 
                title="Últimas Movimentações" 
                headerAction={
                  <button className={styles.seeAllButton}>
                    Ver todas <ChevronRight size={14} />
                  </button>
                }
                className={styles.movCard}
              >
                <div className={styles.movList}>
                  {data.movimentacoesRecentes.map((mov) => (
                    <div key={mov.id} className={styles.movItem}>
                      <div className={`${styles.movIcon} ${mov.tipo === 'entrada' ? styles.iconSuccess : styles.iconError}`}>
                        {mov.tipo === 'entrada' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
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
