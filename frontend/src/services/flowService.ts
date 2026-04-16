import api from './api';

export interface Movement {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: 'ENTRADA' | 'SAIDA';
  valor: number;
  status: 'PREVISTO' | 'REALIZADO' | 'CANCELADO';
}

export interface DailyFlowSummary {
  company_id: number;
  date: string;
  opening_balance: number;
  planned_in: number;
  planned_out: number;
  realized_in: number;
  realized_out: number;
  flow_balance: number;
  bank_balance: number;
  difference: number;
  movements: Movement[];
  initial_balance_info?: {
    amount: number;
    date: string;
  };
}

export const getDailyFlow = async (companyId: number, targetDate: string): Promise<DailyFlowSummary> => {
  const response = await api.get<DailyFlowSummary>(`/flows/${companyId}`, {
    params: { target_date: targetDate },
  });
  return response.data;
};

export const closeDay = async (companyId: number, targetDate: string, notes?: string): Promise<{ detail: string, closing_id: number }> => {
  const response = await api.post(`/flows/${companyId}/${targetDate}`, { notes });
  return response.data;
};

export const reopenDay = async (companyId: number, targetDate: string, reason: string): Promise<{ detail: string }> => {
  const response = await api.post(`/flows/${companyId}/${targetDate}/reopen`, { reason });
  return response.data;
};

export const deleteMovement = async (movementId: string): Promise<{ detail: string }> => {
  const response = await api.delete(`/flows/movement/${movementId}`);
  return response.data;
};
