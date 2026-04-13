import api from './api';

export interface BankAccount {
  id: number;
  company_id: number;
  bank_code: string;
  bank_name: string;
  agency: string;
  account_number: string;
  is_active: boolean;
}

export interface BankAccountCreate {
  company_id: number;
  bank_code: string;
  bank_name: string;
  agency: string;
  account_number: string;
  is_active?: boolean;
}

export const bankAccountService = {
  getBankAccounts: async (companyId?: number): Promise<BankAccount[]> => {
    const params = companyId ? { company_id: companyId } : {};
    const response = await api.get('/bank-accounts/', { params });
    return response.data;
  },

  createBankAccount: async (data: BankAccountCreate): Promise<BankAccount> => {
    const response = await api.post('/bank-accounts/', data);
    return response.data;
  },

  deleteBankAccount: async (id: number): Promise<void> => {
    await api.delete(`/bank-accounts/${id}`);
  }
};
