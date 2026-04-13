import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { Company, listCompanies } from '../services/companyService';
import { importBank, importErpPayable, importErpReceivable } from '../services/importService';
import { BankAccount, bankAccountService } from '../services/bankAccountService';
import styles from './Importacoes.module.css';

type Message = { type: 'success' | 'error'; text: string } | null;

export default function Importacoes() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(null);
  
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankAccountId, setBankAccountId] = useState<number | null>(null);
  
  const [replacePeriod, setReplacePeriod] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<Message>(null);

  const payableFileRef = useRef<HTMLInputElement>(null);
  const receivableFileRef = useRef<HTMLInputElement>(null);
  const bankFileRef = useRef<HTMLInputElement>(null);

  const [isLoadingPayable, setIsLoadingPayable] = useState(false);
  const [isLoadingReceivable, setIsLoadingReceivable] = useState(false);
  const [isLoadingBank, setIsLoadingBank] = useState(false);

  const [msgPayable, setMsgPayable] = useState<Message>(null);
  const [msgReceivable, setMsgReceivable] = useState<Message>(null);
  const [msgBank, setMsgBank] = useState<Message>(null);

  useEffect(() => {
    void loadCompanies();
  }, []);

  useEffect(() => {
    if (companyId) {
      void loadBankAccounts(companyId);
    } else {
      setBankAccounts([]);
      setBankAccountId(null);
    }
  }, [companyId]);

  const loadCompanies = async () => {
    setIsLoadingCompanies(true);
    setCompanyMessage(null);

    try {
      const data = await listCompanies(true);
      setCompanies(data);
      setCompanyId((current) => current ?? data[0]?.id ?? null);
    } catch (err: any) {
      setCompanyMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Nao foi possivel carregar as empresas.',
      });
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const loadBankAccounts = async (selectedCompanyId: number) => {
    setIsLoadingBankAccounts(true);
    try {
      const data = await bankAccountService.getBankAccounts(selectedCompanyId);
      setBankAccounts(data);
      setBankAccountId(data.length > 0 ? data[0].id : null);
    } catch (err: any) {
      setBankAccounts([]);
      setBankAccountId(null);
    } finally {
      setIsLoadingBankAccounts(false);
    }
  };

  const selectedCompanyUnavailable = companyId === null;

  const handleImportPayable = async (event: FormEvent) => {
    event.preventDefault();
    const selectedCompanyId = companyId;

    if (selectedCompanyId === null) {
      setMsgPayable({ type: 'error', text: 'Cadastre e selecione uma empresa antes de importar.' });
      return;
    }

    const file = payableFileRef.current?.files?.[0];
    if (!file) {
      setMsgPayable({ type: 'error', text: 'Selecione um arquivo CSV ou XLSX.' });
      return;
    }

    setIsLoadingPayable(true);
    setMsgPayable(null);

    try {
      const response = await importErpPayable(selectedCompanyId, file);
      setMsgPayable({ type: 'success', text: `${response.detail} (${response.records_processed} registros)` });
      if (payableFileRef.current) {
        payableFileRef.current.value = '';
      }
    } catch (err: any) {
      setMsgPayable({
        type: 'error',
        text: err.response?.data?.detail || 'Erro ao importar contas a pagar.',
      });
    } finally {
      setIsLoadingPayable(false);
    }
  };

  const handleImportReceivable = async (event: FormEvent) => {
    event.preventDefault();
    const selectedCompanyId = companyId;

    if (selectedCompanyId === null) {
      setMsgReceivable({ type: 'error', text: 'Cadastre e selecione uma empresa antes de importar.' });
      return;
    }

    const file = receivableFileRef.current?.files?.[0];
    if (!file) {
      setMsgReceivable({ type: 'error', text: 'Selecione um arquivo CSV ou XLSX.' });
      return;
    }

    setIsLoadingReceivable(true);
    setMsgReceivable(null);

    try {
      const response = await importErpReceivable(selectedCompanyId, file);
      setMsgReceivable({ type: 'success', text: `${response.detail} (${response.records_processed} registros)` });
      if (receivableFileRef.current) {
        receivableFileRef.current.value = '';
      }
    } catch (err: any) {
      setMsgReceivable({
        type: 'error',
        text: err.response?.data?.detail || 'Erro ao importar contas a receber.',
      });
    } finally {
      setIsLoadingReceivable(false);
    }
  };

  const handleImportBank = async (event: FormEvent) => {
    event.preventDefault();
    const selectedCompanyId = companyId;

    if (selectedCompanyId === null) {
      setMsgBank({ type: 'error', text: 'Cadastre e selecione uma empresa antes de importar.' });
      return;
    }

    if (bankAccountId === null) {
      setMsgBank({ type: 'error', text: 'Cadastre e selecione uma conta bancaria antes de importar.' });
      return;
    }

    const file = bankFileRef.current?.files?.[0];
    if (!file) {
      setMsgBank({ type: 'error', text: 'Selecione um arquivo PDF, CSV ou XLSX.' });
      return;
    }

    setIsLoadingBank(true);
    setMsgBank(null);

    try {
      const response = await importBank(selectedCompanyId, bankAccountId, replacePeriod, file);
      setMsgBank({ type: 'success', text: `${response.detail} (${response.records_processed} registros)` });
      if (bankFileRef.current) {
        bankFileRef.current.value = '';
      }
      setReplacePeriod(false);
    } catch (err: any) {
      setMsgBank({
        type: 'error',
        text: err.response?.data?.detail || 'Erro ao importar extrato bancario.',
      });
    } finally {
      setIsLoadingBank(false);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Importacoes</h2>
          <p className={styles.subtitle}>
            Importe arquivos do ERP e extratos bancarios para atualizar o sistema.
          </p>
        </div>

        <div className={styles.selectorCard}>
          <div className={styles.selectorHeader}>
            <div>
              <div className={styles.selectorTitle}>Empresa atual</div>
              <div className={styles.selectorText}>
                Escolha a empresa cadastrada que recebera a importacao.
              </div>
            </div>
            <Link className={styles.linkButton} to="/empresas">
              Gerenciar empresas
            </Link>
          </div>

          {companyMessage && (
            <div className={`${styles.alert} ${companyMessage.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
              {companyMessage.text}
            </div>
          )}

          <select
            value={companyId ?? ''}
            onChange={(event) => setCompanyId(Number(event.target.value))}
            className={styles.select}
            disabled={isLoadingCompanies || companies.length === 0}
          >
            {companies.length === 0 ? (
              <option value="">Nenhuma empresa ativa cadastrada</option>
            ) : (
              companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))
            )}
          </select>

          {companies.length === 0 && !isLoadingCompanies && (
            <div className={styles.infoBox}>
              Cadastre pelo menos uma empresa no modulo de empresas antes de executar importacoes.
            </div>
          )}
        </div>

        <div className={styles.grid}>
          <form className={styles.cardSection} onSubmit={handleImportReceivable}>
            <h3 className={styles.cardTitle}>ERP - Contas a Receber</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Arquivo CSV ou XLSX (Recebimentos)</label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  ref={receivableFileRef}
                  className={styles.fileInput}
                />
              </div>
              <span className={styles.helpText}>
                Importe os titulos previstos para o contas a receber.
              </span>
            </div>

            {msgReceivable && (
              <div className={`${styles.alert} ${msgReceivable.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                {msgReceivable.text}
              </div>
            )}

            <div className={styles.actions}>
              <Button type="submit" disabled={isLoadingReceivable || selectedCompanyUnavailable}>
                {isLoadingReceivable ? 'Importando...' : 'Importar recebiveis'}
              </Button>
            </div>
          </form>

          <form className={styles.cardSection} onSubmit={handleImportPayable}>
            <h3 className={styles.cardTitle}>ERP - Contas a Pagar</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Arquivo CSV ou XLSX (Pagamentos)</label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  ref={payableFileRef}
                  className={styles.fileInput}
                />
              </div>
              <span className={styles.helpText}>
                Importe os titulos previstos para o contas a pagar.
              </span>
            </div>

            {msgPayable && (
              <div className={`${styles.alert} ${msgPayable.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                {msgPayable.text}
              </div>
            )}

            <div className={styles.actions}>
              <Button type="submit" disabled={isLoadingPayable || selectedCompanyUnavailable}>
                {isLoadingPayable ? 'Importando...' : 'Importar pagaveis'}
              </Button>
            </div>
          </form>

          <form className={styles.cardSection} onSubmit={handleImportBank}>
            <h3 className={styles.cardTitle}>Extrato Bancario</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Conta bancaria</label>
              <select
                value={bankAccountId ?? ''}
                onChange={(event) => setBankAccountId(Number(event.target.value))}
                className={styles.select}
                disabled={isLoadingBankAccounts || bankAccounts.length === 0}
              >
                {bankAccounts.length === 0 ? (
                  <option value="">Nenhuma conta bancaria cadastrada para esta empresa</option>
                ) : (
                  bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} - {account.agency} / {account.account_number}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Arquivo PDF, CSV ou XLSX</label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  accept=".pdf,.csv,.xlsx"
                  ref={bankFileRef}
                  className={styles.fileInput}
                />
              </div>
            </div>

            {user?.is_admin && (
              <div className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="replacePeriod"
                  checked={replacePeriod}
                  onChange={(event) => setReplacePeriod(event.target.checked)}
                />
                <label htmlFor="replacePeriod" className={styles.checkboxLabel}>
                  Forcar substituicao de periodo (Admin)
                </label>
              </div>
            )}

            {msgBank && (
              <div className={`${styles.alert} ${msgBank.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                {msgBank.text}
              </div>
            )}

            <div className={styles.actions}>
              <Button type="submit" disabled={isLoadingBank || selectedCompanyUnavailable || bankAccounts.length === 0}>
                {isLoadingBank ? 'Importando...' : 'Importar extrato'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
