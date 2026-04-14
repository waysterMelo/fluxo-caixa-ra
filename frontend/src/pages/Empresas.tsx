import { FormEvent, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import BankAccountsModal from '../components/BankAccountsModal';
import {
  Company,
  CompanyPayload,
  createCompany,
  listCompanies,
  updateCompany,
} from '../services/companyService';
import { Building2, Edit, CheckCircle, XCircle, Landmark } from 'lucide-react';
import styles from './Empresas.module.css';

interface FormState {
  name: string;
  cnpj: string;
  is_active: boolean;
}

const initialFormState: FormState = {
  name: '',
  cnpj: '',
  is_active: true,
};

export default function Empresas() {
  const { success, error } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyForBank, setSelectedCompanyForBank] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    void loadCompanies(showActiveOnly);
  }, [showActiveOnly]);

  const loadCompanies = async (activeOnly: boolean) => {
    setIsLoading(true);
    try {
      const data = await listCompanies(activeOnly);
      setCompanies(data);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Erro ao carregar empresas.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingCompanyId(null);
    setForm(initialFormState);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      error('Informe o nome da empresa.');
      return;
    }
    setIsSubmitting(true);
    const payload: CompanyPayload = {
      name: form.name.trim(),
      cnpj: form.cnpj.trim() || null,
      is_active: form.is_active,
    };
    try {
      if (editingCompanyId) {
        await updateCompany(editingCompanyId, payload);
        success('Empresa atualizada com sucesso.');
      } else {
        await createCompany(payload);
        success('Empresa cadastrada com sucesso.');
      }
      resetForm();
      await loadCompanies(showActiveOnly);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Não foi possível salvar a empresa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompanyId(company.id);
    setForm({
      name: company.name,
      cnpj: company.cnpj || '',
      is_active: company.is_active,
    });
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      await updateCompany(company.id, {
        name: company.name,
        cnpj: company.cnpj,
        is_active: !company.is_active,
      });
      success(`Empresa ${!company.is_active ? 'ativada' : 'inativada'} com sucesso.`);
      await loadCompanies(showActiveOnly);
    } catch (err: any) {
      error(err.response?.data?.detail || 'Não foi possível alterar o status da empresa.');
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <PageHeader
          title="Empresas"
          subtitle="Cadastre, edite e organize as empresas usadas nas importações e nas demais rotinas do sistema."
        />

        <div className={styles.grid}>
          {/* Formulário */}
          <Card title={editingCompanyId ? 'Editar Empresa' : 'Nova Empresa'}>
            <form className={styles.formForm} onSubmit={handleSubmit}>
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="Ex: Empresa Alpha Ltda"
              />
              <Input
                label="CNPJ"
                value={form.cnpj}
                onChange={(e) => setForm((current) => ({ ...current, cnpj: e.target.value }))}
                placeholder="00.000.000/0001-00"
              />
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
                Empresa ativa
              </label>
              <div className={styles.actions}>
                {editingCompanyId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : editingCompanyId ? 'Salvar alterações' : 'Cadastrar empresa'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Listagem */}
          <div>
            <div className={styles.toolbar}>
              <h3 className={styles.toolbarTitle}>Empresas Cadastradas</h3>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={showActiveOnly} onChange={(event) => setShowActiveOnly(event.target.checked)} />
                Mostrar apenas ativas
              </label>
            </div>

            <div className={styles.list}>
              {isLoading ? (
                <>
                  <Skeleton height="100px" style={{ borderRadius: 'var(--radius-md)' }} />
                  <Skeleton height="100px" style={{ borderRadius: 'var(--radius-md)' }} />
                </>
              ) : companies.length === 0 ? (
                <EmptyState
                  title="Nenhuma empresa encontrada"
                  description="Comece criando uma nova empresa para utilizar as rotinas do sistema."
                />
              ) : (
                companies.map((company) => (
                  <article className={styles.companyItem} key={company.id}>
                    <div className={styles.companyInfo}>
                      <div className={styles.companyName}>
                        <Building2 size={18} className={styles.companyIcon} />
                        {company.name}
                        <Badge variant={company.is_active ? 'success' : 'error'} size="small" withDot>
                          {company.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <div className={styles.companyMeta}>
                        CNPJ: {company.cnpj || 'não informado'}
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedCompanyForBank({ id: company.id, name: company.name })} icon={<Landmark size={14} />}>
                        Contas
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleEdit(company)} icon={<Edit size={14} />}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant={company.is_active ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleStatus(company)}
                        icon={company.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      >
                        {company.is_active ? 'Inativar' : 'Ativar'}
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedCompanyForBank && (
        <BankAccountsModal
          companyId={selectedCompanyForBank.id}
          companyName={selectedCompanyForBank.name}
          onClose={() => setSelectedCompanyForBank(null)}
        />
      )}
    </Layout>
  );
}
