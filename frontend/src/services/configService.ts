import api from './api';

export async function cleanupPeriod(companyId: number, startDate: string, endDate: string) {
  const response = await api.post('/config/cleanup-period', {
    company_id: companyId,
    start_date: startDate,
    end_date: endDate,
  });
  return response.data;
}
