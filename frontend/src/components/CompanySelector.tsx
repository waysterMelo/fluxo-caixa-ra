import { useState, useEffect } from 'react';
import { Select } from './ui/Select';
import { Company, listCompanies } from '../services/companyService';

interface CompanySelectorProps {
  value: number | null;
  onChange: (companyId: number) => void;
  label?: string;
  className?: string;
}

export function CompanySelector({ value, onChange, label = 'EMPRESA', className = '' }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listCompanies(true);
        setCompanies(data);
        if (data.length > 0 && value === null) {
          onChange(data[0].id);
        }
      } catch (e) {
        console.error('Erro ao carregar empresas', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const options = companies.map(c => ({ value: c.id, label: c.name }));

  return (
    <Select
      label={label}
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      options={isLoading ? [{ value: '', label: 'Carregando...' }] : options}
      disabled={isLoading || companies.length === 0}
      className={className}
    />
  );
}
