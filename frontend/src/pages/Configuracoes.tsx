import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Company, listCompanies } from '../services/companyService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cleanupPeriod } from '../services/configService';
import { getTodayLocal } from '../utils/date';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { AlertTriangle, Trash2, Database, ShieldAlert } from 'lucide-react';
import styles from './Configuracoes.module.css';

export default function Configuracoes() {
  const { success, error, warning } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [companyId, setCompanyId] = useState<number | ''>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  const [startDate, setStartDate] = useState(getTodayLocal());
  const [endDate, setEndDate] = useState(getTodayLocal());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    const loadComps = async () => {
      try {
        const data = await listCompanies(true);
        setCompanies(data);
        if (data.length > 0) setCompanyId(data[0].id);
      } catch (e) {
        console.error(e);
        error('Não foi possível carregar as empresas.');
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadComps();
  }, []);

  const handleRequestDelete = () => {
    if (!companyId) {
      warning('Selecione uma empresa.');
      return;
    }
    if (!startDate || !endDate) {
      warning('Selecione o período.');
      return;
    }
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmDelete(false);
    setIsLoading(true);
    try {
      const result = await cleanupPeriod(Number(companyId), startDate, endDate);
      success(result.message || 'Dados apagados com sucesso.');
    } catch (err: any) {
      error(err.response?.data?.detail || 'Erro ao apagar dados do período.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Configurações do Sistema</h2>
          <p className={styles.subtitle}>Gerenciamento avançado e manutenção de dados.</p>
        </div>

        <div className={styles.sections}>
          <Card 
            title="Limpeza de Movimentações do Período" 
            headerAction={<Database size={18} className={styles.sectionIcon} />}
          >
            <div className={styles.warningBox}>
              <ShieldAlert size={24} className={styles.warningIcon} />
              <div>
                <strong>AÇÃO IRREVERSÍVEL:</strong> Esta operação apagará permanentemente todos os 
                dados de movimentação bancária, conciliações, liquidações de títulos, ajustes e fechamentos 
                da empresa selecionada dentro do período informado.
              </div>
            </div>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Empresa para Limpeza</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(Number(e.target.value))}
                  disabled={isLoadingCompanies || companies.length === 0 || isLoading}
                  className={styles.select}
                >
                  {companies.length === 0 ? (
                    <option value="">Carregando...</option>
                  ) : (
                    companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  )}
                </select>
              </div>

              <div className={styles.formGrid}>
                <Input 
                  type="date" 
                  label="Data Início" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  required 
                  variant="date"
                  disabled={isLoading}
                />
                <Input 
                  type="date" 
                  label="Data Fim" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  required 
                  variant="date"
                  disabled={isLoading}
                />
              </div>

              <div className={styles.actions}>
                <Button 
                  variant="danger" 
                  onClick={handleRequestDelete} 
                  disabled={isLoading || isLoadingCompanies}
                  icon={<Trash2 size={18} />}
                >
                  {isLoading ? 'Apagando Dados...' : 'Apagar Dados do Período'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        title="⚠️ CONFIRMAR EXCLUSÃO DE DADOS"
        message={`Você tem certeza absoluta que deseja apagar TODOS os dados da empresa selecionada de ${new Date(startDate).toLocaleDateString()} até ${new Date(endDate).toLocaleDateString()}? Esta ação não pode ser desfeita.`}
        variant="danger"
      />
    </Layout>
  );
}
