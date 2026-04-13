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

export const getConsolidated = async (targetDate: string): Promise<ConsolidatedResponse> => {
  const response = await api.get<ConsolidatedResponse>('/consolidated/', {
    params: { target_date: targetDate },
  });
  return response.data;
};
