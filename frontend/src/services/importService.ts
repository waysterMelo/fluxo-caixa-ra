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
