import api from './api';

export interface ImportResponse {
  detail: string;
  batch_id?: number;
  records_processed?: number;
}

export const importErpPayable = async (companyId: number, file: File): Promise<ImportResponse> => {
  const formData = new FormData();
  formData.append('company_id', companyId.toString());
  formData.append('file', file);
  const response = await api.post<ImportResponse>('/imports/erp/payable', formData);
  return response.data;
};

export const importErpReceivable = async (companyId: number, file: File): Promise<ImportResponse> => {
  const formData = new FormData();
  formData.append('company_id', companyId.toString());
  formData.append('file', file);
  const response = await api.post<ImportResponse>('/imports/erp/receivable', formData);
  return response.data;
};

export const importBank = async (companyId: number, bankAccountId: number, replacePeriod: boolean, file: File): Promise<ImportResponse> => {
  const formData = new FormData();
  formData.append('company_id', companyId.toString());
  formData.append('bank_account_id', bankAccountId.toString());
  formData.append('replace_period', replacePeriod ? 'true' : 'false');
  formData.append('file', file);
  const response = await api.post<ImportResponse>('/imports/bank', formData);
  return response.data;
};

export interface ImportHistoryRow {
  id: number;
  date: string;
  type: string;
  status: string;
  user: string;
  records: number;
}

export interface ImportHistoryResponse {
  data: ImportHistoryRow[];
  total: number;
  page: number;
  totalPages: number;
}

export const getImportHistory = async (_companyId: number, page: number, limit: number = 5): Promise<ImportHistoryResponse> => {
  // Mock data implementation since endpoint doesn't exist yet
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: [
          { id: 105, date: '2026-04-13T10:00:00Z', type: 'ERP - Contas a Pagar', status: 'Sucesso', user: 'Admin', records: 45 },
          { id: 104, date: '2026-04-12T14:30:00Z', type: 'Extrato Bancário', status: 'Sucesso', user: 'Operador', records: 12 },
          { id: 103, date: '2026-04-11T09:15:00Z', type: 'ERP - Contas a Receber', status: 'Erro parcial', user: 'Admin', records: 89 },
          { id: 102, date: '2026-04-10T16:45:00Z', type: 'ERP - Contas a Pagar', status: 'Sucesso', user: 'Admin', records: 34 },
          { id: 101, date: '2026-04-09T11:20:00Z', type: 'Extrato Bancário', status: 'Sucesso', user: 'Operador', records: 56 },
        ].slice(0, limit),
        total: 12,
        page,
        totalPages: Math.ceil(12 / limit)
      });
    }, 500);
  });
};
