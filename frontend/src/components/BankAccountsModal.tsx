import { FormEvent, useEffect, useState } from 'react';
import { BankAccount, bankAccountService } from '../services/bankAccountService';
import { Button } from './ui/Button';
import styles from './BankAccountsModal.module.css';

interface BankAccountsModalProps {
  companyId: number;
  companyName: string;
  onClose: () => void;
}

export default function BankAccountsModal({ companyId, companyName, onClose }: BankAccountsModalProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    bank_code: '',
    bank_name: '',
    agency: '',
    account_number: '',
  });

  useEffect(() => {
    loadAccounts();
  }, [companyId]);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await bankAccountService.getBankAccounts(companyId);
      setAccounts(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao carregar contas bancárias.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.bank_code || !form.bank_name || !form.agency || !form.account_number) {
      setMessage({ type: 'error', text: 'Preencha todos os campos.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      await bankAccountService.createBankAccount({
        company_id: companyId,
        bank_code: form.bank_code,
        bank_name: form.bank_name,
        agency: form.agency,
        account_number: form.account_number,
        is_active: true,
      });
      setMessage({ type: 'success', text: 'Conta bancária adicionada com sucesso!' });
      setForm({ bank_code: '', bank_name: '', agency: '', account_number: '' });
      await loadAccounts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erro ao adicionar conta.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      await bankAccountService.deleteBankAccount(id);
      setMessage({ type: 'success', text: 'Conta excluída com sucesso.' });
      await loadAccounts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erro ao excluir conta.' });
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Contas Bancárias - {companyName}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {message && (
            <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
              {message.text}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <h4 className={styles.formTitle}>Adicionar Nova Conta</h4>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Código do Banco</label>
                <input 
                  className={styles.input} 
                  placeholder="Ex: 341" 
                  value={form.bank_code}
                  onChange={e => setForm({...form, bank_code: e.target.value})}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Nome do Banco</label>
                <input 
                  className={styles.input} 
                  placeholder="Ex: Itaú Unibanco" 
                  value={form.bank_name}
                  onChange={e => setForm({...form, bank_name: e.target.value})}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Agência</label>
                <input 
                  className={styles.input} 
                  placeholder="Ex: 0001" 
                  value={form.agency}
                  onChange={e => setForm({...form, agency: e.target.value})}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Conta Corrente</label>
                <input 
                  className={styles.input} 
                  placeholder="Ex: 12345-6" 
                  value={form.account_number}
                  onChange={e => setForm({...form, account_number: e.target.value})}
                />
              </div>
            </div>
            <div className={styles.actions}>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adicionando...' : 'Adicionar Conta'}
              </Button>
            </div>
          </form>

          <div className={styles.list}>
            <h4 className={styles.formTitle}>Contas Cadastradas</h4>
            {isLoading ? (
              <div className={styles.emptyState}>Carregando contas...</div>
            ) : accounts.length === 0 ? (
              <div className={styles.emptyState}>Nenhuma conta bancária cadastrada para esta empresa.</div>
            ) : (
              accounts.map(acc => (
                <div key={acc.id} className={styles.listItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{acc.bank_code} - {acc.bank_name}</span>
                    <span className={styles.itemDetails}>Ag: {acc.agency} | CC: {acc.account_number}</span>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(acc.id)}>Excluir</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
