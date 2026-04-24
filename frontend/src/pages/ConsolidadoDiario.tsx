import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import {
  ConsolidatedDailyResponse,
  getConsolidatedDaily,
} from '../services/consolidatedService';
import { formatDateBR, getTodayLocal } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  Landmark,
  RefreshCw,
  Table2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import styles from './ConsolidadoDiario.module.css';

const DAILY_PAGE_SIZE = 30;

function valueClass(value: number): string {
  if (value > 0) return styles.positive;
  if (value < 0) return styles.negative;
  return styles.muted;
}

export default function ConsolidadoDiario() {
  const { error } = useToast();
  const today = getTodayLocal();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<ConsolidatedDailyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [dailyPage, setDailyPage] = useState(1);

  const loadData = async (useImportedRange = false) => {
    if (!useImportedRange && (!startDate || !endDate)) {
      error('Informe a data inicial e final.');
      return;
    }

    setIsLoading(true);
    try {
      const result = useImportedRange
        ? await getConsolidatedDaily()
        : await getConsolidatedDaily(startDate, endDate);
      setData(result);
      setStartDate(result.start_date);
      setEndDate(result.end_date);
      setSelectedDate(result.rows[0]?.date || null);
      setSelectedMonth(result.monthly_summary[0]?.month || null);
      setDailyPage(1);
    } catch (err: any) {
      console.error(err);
      error(err.response?.data?.detail || 'Nao foi possivel carregar o consolidado diario.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    if (!data || data.rows.length === 0) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        saldoFinal: data?.opening_balances.total || 0,
        menorSaldo: data?.opening_balances.total || 0,
      };
    }

    return {
      totalEntradas: data.rows.reduce((sum, row) => sum + row.total_entradas, 0),
      totalSaidas: data.rows.reduce((sum, row) => sum + row.total_saidas, 0),
      saldoFinal: data.rows[data.rows.length - 1].saldo_consolidado,
      menorSaldo: Math.min(...data.rows.map((row) => row.saldo_consolidado)),
    };
  }, [data]);

  const selectedRow = useMemo(() => {
    if (!data || !selectedDate) return null;
    return data.rows.find((row) => row.date === selectedDate) || data.rows[0] || null;
  }, [data, selectedDate]);

  const selectedMonthSummary = useMemo(() => {
    if (!data || !selectedMonth) return null;
    return data.monthly_summary.find((month) => month.month === selectedMonth) || data.monthly_summary[0] || null;
  }, [data, selectedMonth]);

  const dailyPagination = useMemo(() => {
    const totalRows = data?.rows.length || 0;
    const totalPages = Math.max(1, Math.ceil(totalRows / DAILY_PAGE_SIZE));
    const safePage = Math.min(Math.max(dailyPage, 1), totalPages);
    const startIndex = (safePage - 1) * DAILY_PAGE_SIZE;
    const endIndex = Math.min(startIndex + DAILY_PAGE_SIZE, totalRows);

    return {
      totalRows,
      totalPages,
      page: safePage,
      startIndex,
      endIndex,
      rows: data?.rows.slice(startIndex, endIndex) || [],
    };
  }, [data, dailyPage]);

  const periodLabel = data
    ? `${formatDateBR(data.start_date)} a ${formatDateBR(data.end_date)}`
    : '';

  useEffect(() => {
    if (!data || !selectedDate) return;

    const selectedIndex = data.rows.findIndex((row) => row.date === selectedDate);
    if (selectedIndex < 0) return;

    const selectedPage = Math.floor(selectedIndex / DAILY_PAGE_SIZE) + 1;
    setDailyPage((prev) => {
      if (prev !== selectedPage) return selectedPage;
      return prev;
    });
  }, [data, selectedDate]);

  return (
    <Layout>
      <div className={styles.container}>
        <PageHeader
          title="Consolidado Diario"
          subtitle="Projecao diaria por empresa com entradas, saidas e saldo consolidado do grupo."
          filters={
            <>
              <Input
                type="date"
                label="DATA INICIAL"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                variant="date"
              />
              <Input
                type="date"
                label="DATA FINAL"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                variant="date"
              />
              <Button
                variant="secondary"
                onClick={() => loadData()}
                disabled={isLoading}
                loading={isLoading}
                icon={<RefreshCw size={16} />}
              >
                Atualizar
              </Button>
            </>
          }
        />

        {isLoading && !data ? (
          <>
            <div className={styles.metricsGrid}>
              {[...Array(5)].map((_, index) => <Skeleton key={index} variant="metric" />)}
            </div>
            <Skeleton variant="table" />
          </>
        ) : data ? (
          <>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricAccent} />
                <div className={styles.metricHeader}>
                  <span className={styles.metricIcon}><Wallet size={17} /></span>
                  <span className={styles.metricLabel}>Saldo inicial</span>
                </div>
                <strong className={styles.metricValue}>{formatCurrency(data.opening_balances.total)}</strong>
                <span className={styles.metricFooter}>{data.companies.length} empresas ativas</span>
              </div>

              <div className={`${styles.metricCard} ${styles.metricSuccess}`}>
                <span className={styles.metricAccent} />
                <div className={styles.metricHeader}>
                  <span className={styles.metricIcon}><ArrowUpRight size={17} /></span>
                  <span className={styles.metricLabel}>Entradas</span>
                </div>
                <strong className={styles.metricValue}>{formatCurrency(totals.totalEntradas)}</strong>
                <span className={styles.metricFooter}>Total do periodo</span>
              </div>

              <div className={`${styles.metricCard} ${styles.metricError}`}>
                <span className={styles.metricAccent} />
                <div className={styles.metricHeader}>
                  <span className={styles.metricIcon}><ArrowDownRight size={17} /></span>
                  <span className={styles.metricLabel}>Saidas</span>
                </div>
                <strong className={styles.metricValue}>{formatCurrency(totals.totalSaidas)}</strong>
                <span className={styles.metricFooter}>Total do periodo</span>
              </div>

              <div className={`${styles.metricCard} ${totals.saldoFinal >= 0 ? styles.metricInfo : styles.metricError}`}>
                <span className={styles.metricAccent} />
                <div className={styles.metricHeader}>
                  <span className={styles.metricIcon}><TrendingUp size={17} /></span>
                  <span className={styles.metricLabel}>Saldo final</span>
                </div>
                <strong className={styles.metricValue}>{formatCurrency(totals.saldoFinal)}</strong>
                <span className={styles.metricFooter}>{periodLabel}</span>
              </div>

              <div className={`${styles.metricCard} ${totals.menorSaldo >= 0 ? styles.metricWarning : styles.metricError}`}>
                <span className={styles.metricAccent} />
                <div className={styles.metricHeader}>
                  <span className={styles.metricIcon}><TrendingDown size={17} /></span>
                  <span className={styles.metricLabel}>Menor saldo</span>
                </div>
                <strong className={styles.metricValue}>{formatCurrency(totals.menorSaldo)}</strong>
                <span className={styles.metricFooter}>{data.rows.length} dias projetados</span>
              </div>
            </div>

            {data.companies.length === 0 ? (
              <EmptyState
                icon={<Table2 size={40} />}
                title="Nenhuma empresa ativa"
                description="Cadastre ou ative empresas para visualizar o consolidado diario."
              />
            ) : (
              <>
                <section className={styles.tableSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h3 className={styles.sectionTitle}>Grade diaria consolidada</h3>
                      <p className={styles.sectionSubtitle}>
                        {periodLabel} - selecione uma linha para ver o detalhe por empresa.
                      </p>
                    </div>
                    <Badge variant={totals.saldoFinal >= 0 ? 'success' : 'error'} size="small" withDot>
                      {totals.saldoFinal >= 0 ? 'COM SALDO' : 'SEM SALDO'}
                    </Badge>
                  </div>

                  <div className={`${styles.masterDetailGrid} ${styles.dailyMasterDetailGrid}`}>
                    <div className={`${styles.tableScroller} ${styles.dailyTableScroller}`}>
                      <div className={styles.dailyTableViewport}>
                        <table className={styles.compactTable}>
                          <thead>
                            <tr>
                              <th className={styles.thCompact}>Data</th>
                              <th className={styles.thCompact}>Entradas</th>
                              <th className={styles.thCompact}>Saidas</th>
                              <th className={styles.thCompact}>Saldo Consolidado</th>
                              <th className={styles.thCompact}>Situacao</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailyPagination.rows.map((row) => (
                              <tr
                                key={row.date}
                                className={`${styles.tr} ${selectedRow?.date === row.date ? styles.selectedRow : ''} ${row.saldo_consolidado < 0 ? styles.negativeRow : styles.positiveRow}`}
                                onClick={() => setSelectedDate(row.date)}
                              >
                                <td className={`${styles.tdCompact} ${styles.dateCell}`}>{formatDateBR(row.date)}</td>
                                <td className={`${styles.tdCompact} ${styles.amountIn}`}>{formatCurrency(row.total_entradas)}</td>
                                <td className={`${styles.tdCompact} ${styles.amountOut}`}>{formatCurrency(row.total_saidas)}</td>
                                <td className={`${styles.tdCompact} ${valueClass(row.saldo_consolidado)}`}>
                                  {formatCurrency(row.saldo_consolidado)}
                                </td>
                                <td className={`${styles.tdCompact} ${styles.statusCell}`}>
                                  <Badge variant={row.situacao === 'COM SALDO' ? 'success' : 'error'} size="xs" withDot>
                                    {row.situacao}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className={styles.paginationBar}>
                        <span>
                          {dailyPagination.totalRows === 0
                            ? 'Nenhum dia'
                            : `${dailyPagination.startIndex + 1}-${dailyPagination.endIndex} de ${dailyPagination.totalRows} dias`}
                        </span>
                        <div className={styles.paginationActions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDailyPage((page) => Math.max(1, page - 1))}
                            disabled={dailyPagination.page <= 1}
                            icon={<ChevronLeft size={14} />}
                          >
                            Anterior
                          </Button>
                          <span className={styles.pageIndicator}>
                            Pagina {dailyPagination.page} de {dailyPagination.totalPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDailyPage((page) => Math.min(dailyPagination.totalPages, page + 1))}
                            disabled={dailyPagination.page >= dailyPagination.totalPages}
                            icon={<ChevronRight size={14} />}
                          >
                            Proxima
                          </Button>
                        </div>
                      </div>
                    </div>

                    <aside className={`${styles.detailPanel} ${styles.dailyDetailPanel}`}>
                      <div className={styles.detailHeader}>
                        <span className={styles.detailLabel}>Detalhe por empresa</span>
                        <div className={styles.detailTitleRow}>
                          <span className={styles.detailTitleIcon}><Landmark size={18} /></span>
                          <strong>{selectedRow ? formatDateBR(selectedRow.date) : 'Selecione um dia'}</strong>
                        </div>
                      </div>
                      {selectedRow && (
                        <div className={styles.detailTotals}>
                          <div>
                            <span>Entradas</span>
                            <strong className={styles.amountIn}>{formatCurrency(selectedRow.total_entradas)}</strong>
                          </div>
                          <div>
                            <span>Saidas</span>
                            <strong className={styles.amountOut}>{formatCurrency(selectedRow.total_saidas)}</strong>
                          </div>
                          <div>
                            <span>Saldo</span>
                            <strong className={valueClass(selectedRow.saldo_consolidado)}>
                              {formatCurrency(selectedRow.saldo_consolidado)}
                            </strong>
                          </div>
                        </div>
                      )}
                      <div className={styles.detailList}>
                        {selectedRow && data.companies.map((company) => {
                          const values = selectedRow.companies[String(company.id)];
                          return (
                            <div key={company.id} className={`${styles.companyDetail} ${(values?.saldo || 0) < 0 ? styles.companyNegative : styles.companyPositive}`}>
                              <div className={styles.companyDetailHeader}>
                                <span>{company.name}</span>
                                <strong className={valueClass(values?.saldo || 0)}>
                                  {formatCurrency(values?.saldo || 0)}
                                </strong>
                              </div>
                              <div className={styles.companyDetailValues}>
                                <span><span>Entradas</span><strong className={styles.amountIn}>{formatCurrency(values?.entradas || 0)}</strong></span>
                                <span><span>Saidas</span><strong className={styles.amountOut}>{formatCurrency(values?.saidas || 0)}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </aside>
                  </div>
                </section>

                <section className={styles.tableSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h3 className={styles.sectionTitle}>Resumo mensal</h3>
                      <p className={styles.sectionSubtitle}>Totais do periodo agrupados por mes.</p>
                    </div>
                    <span className={styles.sectionIconBadge}><CalendarRange size={18} /></span>
                  </div>

                  <div className={`${styles.masterDetailGrid} ${styles.monthlyMasterDetailGrid}`}>
                    <div className={styles.tableScroller}>
                    <table className={styles.compactTable}>
                      <thead>
                        <tr>
                          <th className={styles.thCompact}>Mes</th>
                          <th className={styles.thCompact}>Entradas</th>
                          <th className={styles.thCompact}>Saidas</th>
                          <th className={styles.thCompact}>Saldo Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.monthly_summary.map((month) => (
                          <tr
                            key={month.month}
                            className={`${styles.tr} ${selectedMonthSummary?.month === month.month ? styles.selectedRow : ''} ${month.saldo_final_total < 0 ? styles.negativeRow : styles.positiveRow}`}
                            onClick={() => setSelectedMonth(month.month)}
                          >
                            <td className={`${styles.tdCompact} ${styles.dateCell}`}>{month.label}</td>
                            <td className={`${styles.tdCompact} ${styles.amountIn}`}>{formatCurrency(month.total_entradas)}</td>
                            <td className={`${styles.tdCompact} ${styles.amountOut}`}>{formatCurrency(month.total_saidas)}</td>
                            <td className={`${styles.tdCompact} ${valueClass(month.saldo_final_total)}`}>
                              {formatCurrency(month.saldo_final_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                    <aside className={`${styles.detailPanel} ${styles.monthlyDetailPanel}`}>
                      <div className={styles.detailHeader}>
                        <span className={styles.detailLabel}>Detalhe mensal por empresa</span>
                        <div className={styles.detailTitleRow}>
                          <span className={styles.detailTitleIcon}><CircleDollarSign size={18} /></span>
                          <strong>{selectedMonthSummary?.label || 'Selecione um mes'}</strong>
                        </div>
                      </div>
                      <div className={styles.detailList}>
                        {selectedMonthSummary && data.companies.map((company) => {
                          const values = selectedMonthSummary.companies[String(company.id)];
                          return (
                            <div key={company.id} className={`${styles.companyDetail} ${(values?.saldo_final || 0) < 0 ? styles.companyNegative : styles.companyPositive}`}>
                              <div className={styles.companyDetailHeader}>
                                <span>{company.name}</span>
                                <strong className={valueClass(values?.saldo_final || 0)}>
                                  {formatCurrency(values?.saldo_final || 0)}
                                </strong>
                              </div>
                              <div className={styles.companyDetailValues}>
                                <span><span>Entradas</span><strong className={styles.amountIn}>{formatCurrency(values?.entradas || 0)}</strong></span>
                                <span><span>Saidas</span><strong className={styles.amountOut}>{formatCurrency(values?.saidas || 0)}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </aside>
                  </div>
                </section>
              </>
            )}
          </>
        ) : null}
      </div>
    </Layout>
  );
}
