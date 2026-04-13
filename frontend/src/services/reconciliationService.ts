import api from './api';

export interface AutoRunRequest {
  company_id: number;
}

export interface ManualLinkRequest {
  movement_id: number;
  target_type: 'PAYABLE' | 'RECEIVABLE' | 'SETTLEMENT';
  target_id: number;
}

export const runAutoReconciliation = async (companyId: number): Promise<any> => {
  const response = await api.post('/reconciliations/auto-run', { company_id: companyId });
  return response.data;
};

export const createManualLink = async (req: ManualLinkRequest): Promise<any> => {
  const response = await api.post('/reconciliations/manual-link', req);
  return response.data;
};

export const getReconciliations = async (companyId: number): Promise<any> => {
  const response = await api.get('/reconciliations/', {
    params: { company_id: companyId },
  });
  return response.data;
};
