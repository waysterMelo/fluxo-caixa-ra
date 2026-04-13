import api from './api';

export interface Company {
  id: number;
  name: string;
  cnpj: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CompanyPayload {
  name: string;
  cnpj: string | null;
  is_active: boolean;
}

export const listCompanies = async (activeOnly = false): Promise<Company[]> => {
  const response = await api.get<Company[]>('/companies/', {
    params: { active_only: activeOnly },
  });
  return response.data;
};

export const createCompany = async (payload: CompanyPayload): Promise<Company> => {
  const response = await api.post<Company>('/companies/', payload);
  return response.data;
};

export const updateCompany = async (companyId: number, payload: CompanyPayload): Promise<Company> => {
  const response = await api.put<Company>(`/companies/${companyId}`, payload);
  return response.data;
};
