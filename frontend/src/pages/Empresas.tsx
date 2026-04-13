import { FormEvent, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import BankAccountsModal from '../components/BankAccountsModal';
import {
  Company,
  CompanyPayload,
  createCompany,
  listCompanies,
  updateCompany,
} from '../services/companyService';
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Erro ao carregar empresas.',
      });
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
      setMessage({ type: 'error', text: 'Informe o nome da empresa.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const payload: CompanyPayload = {
      name: form.name.trim(),
      cnpj: form.cnpj.trim() || null,
      is_active: form.is_active,
    };

    try {
      if (editingCompanyId) {
        await updateCompany(editingCompanyId, payload);
        setMessage({ type: 'success', text: 'Empresa atualizada com sucesso.' });
      } else {
        await createCompany(payload);
        setMessage({ type: 'success', text: 'Empresa cadastrada com sucesso.' });
      }

      resetForm();
      await loadCompanies(showActiveOnly);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Não foi possível salvar a empresa.',
      });
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
    setMessage(null);
  };

  const handleToggleStatus = async (company: Company) => {
    setMessage(null);
    try {
      await updateCompany(company.id, {
        name: company.name,
        cnpj: company.cnpj,
        is_active: !company.is_active,
      });
      setMessage({
        type: 'success',
        text: `Empresa ${!company.is_active ? 'ativada' : 'inativada'} com sucesso.`,
      });
      await loadCompanies(showActiveOnly);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Não foi possível alterar o status da empresa.',
      });
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Empresas</h2>
          <p className={styles.subtitle}>
            Cadastre, edite e organize as empresas usadas nas importações e nas demais rotinas do sistema.
          </p>
        </div>

        {message && (
          <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
            {message.text}
          </div>
        )}

        <div className={styles.grid}>
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>
              {editingCompanyId ? 'Editar empresa' : 'Nova empresa'}
            </h3>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="company-name">
                  Nome
                </label>
                <input
                  id="company-name"
                  className={styles.input}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex: Empresa Alpha Ltda"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="company-cnpj">
                  CNPJ
                </label>
                <input
                  id="company-cnpj"
                  className={styles.input}
                  value={form.cnpj}
                  onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))}
                  placeholder="00.000.000/0001-00"
                />
              </div>

              <label className={styles.checkboxRow} htmlFor="company-active">
                <input
                  id="company-active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Empresa ativa
              </label>

              <div className={styles.actions}>
                {editingCompanyId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : editingCompanyId ? 'Salvar alterações' : 'Cadastrar empresa'}
                </Button>
              </div>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.toolbar}>
              <h3 className={styles.cardTitle}>Empresas cadastradas</h3>
              <label className={styles.checkboxRow} htmlFor="filter-active">
                <input
                  id="filter-active"
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(event) => setShowActiveOnly(event.target.checked)}
                />
                Mostrar apenas ativas
              </label>
            </div>

            <div className={styles.list}>
              {isLoading ? (
                <div className={styles.emptyState}>Carregando empresas...</div>
              ) : companies.length === 0 ? (
                <div className={styles.emptyState}>
                  Nenhuma empresa cadastrada. Crie a primeira para começar a usar as importações.
                </div>
              ) : (
                <div className={styles.companyList}>
                  {companies.map((company) => (
                    <article className={styles.companyItem} key={company.id}>
                      <div className={styles.companyInfo}>
                        <div className={styles.companyName}>{company.name}</div>
                        <div className={styles.companyMeta}>
                          CNPJ: {company.cnpj || 'não informado'}
                        </div>
                        <span
                          className={`${styles.badge} ${company.is_active ? styles.badgeActive : styles.badgeInactive}`}
                        >
                          {company.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>

                      <div className={styles.itemActions}>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedCompanyForBank({ id: company.id, name: company.name })}>
                          Contas Bancárias
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => handleEdit(company)}>
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant={company.is_active ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(company)}
                        >
                          {company.is_active ? 'Inativar' : 'Ativar'}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
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
