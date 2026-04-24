import api from './api';

export interface CompanyBreakdown {
  company_name: string;
  company_id: number;
  opening_balance: number;
  total_in: number;
  total_out: number;
  flow_balance: number;
  bank_balance: number;
}

export interface ConsolidatedTotals {
  opening_balance: number;
  total_in: number;
  total_out: number;
  flow_balance: number;
  bank_balance: number;
}

export interface ConsolidatedResponse {
  date: string;
  companies_breakdown: CompanyBreakdown[];
  gross: ConsolidatedTotals;
  internal_transfers_eliminated: number;
  net: ConsolidatedTotals;
}

export interface ConsolidatedDailyCompany {
  id: number;
  name: string;
}

export interface ConsolidatedDailyCompanyValues {
  company_id: number;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface ConsolidatedDailyMonthlyCompanyValues {
  company_id: number;
  entradas: number;
  saidas: number;
  saldo_final: number;
}

export interface ConsolidatedDailyRow {
  date: string;
  companies: Record<string, ConsolidatedDailyCompanyValues>;
  total_entradas: number;
  total_saidas: number;
  saldo_consolidado: number;
  situacao: 'COM SALDO' | 'SEM SALDO';
}

export interface ConsolidatedDailyMonthlySummary {
  month: string;
  label: string;
  companies: Record<string, ConsolidatedDailyMonthlyCompanyValues>;
  total_entradas: number;
  total_saidas: number;
  saldo_final_total: number;
}

export interface ConsolidatedDailyResponse {
  start_date: string;
  end_date: string;
  companies: ConsolidatedDailyCompany[];
  opening_balances: {
    companies: Record<string, number>;
    total: number;
  };
  rows: ConsolidatedDailyRow[];
  monthly_summary: ConsolidatedDailyMonthlySummary[];
}

export const getConsolidated = async (targetDate: string): Promise<ConsolidatedResponse> => {
  const response = await api.get<ConsolidatedResponse>('/consolidated/', {
    params: { target_date: targetDate },
  });
  return response.data;
};

export const getConsolidatedDaily = async (
  startDate?: string,
  endDate?: string
): Promise<ConsolidatedDailyResponse> => {
  const response = await api.get<ConsolidatedDailyResponse>('/consolidated/daily', {
    params: {
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    },
  });
  return response.data;
};
