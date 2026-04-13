import api from './api';

export interface AdjustmentCreate {
  company_id: number;
  adjustment_date: string;
  kind: 'IN' | 'OUT';
  amount: number;
  description: string;
  category_id?: string;
  reason: string;
}

export const createAdjustment = async (data: AdjustmentCreate): Promise<{ detail: string, id: number }> => {
  const response = await api.post('/adjustments/', data);
  return response.data;
};
