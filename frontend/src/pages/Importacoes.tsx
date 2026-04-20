import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { Company, listCompanies } from '../services/companyService';
import { importBank, importErpPayable, importErpReceivable, getImportHistory, ImportHistoryRow } from '../services/importService';
import { BankAccount, bankAccountService } from '../services/bankAccountService';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { formatDateBR } from '../utils/date';
import { Upload, FileSpreadsheet, Building2, ChevronRight } from 'lucide-react';
import styles from './Importacoes.module.css';

export default function Importacoes() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(null);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankAccountId, setBankAccountId] = useState<number | null>(null);

  const [replacePeriod, setReplacePeriod] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);

  const payableFileRef = useRef<HTMLInputElement>(null);
  const receivableFileRef = useRef<HTMLInputElement>(null);
  const bankFileRef = useRef<HTMLInputElement>(null);

  const [isLoadingPayable, setIsLoadingPayable] = useState(false);
  const [isLoadingReceivable, setIsLoadingReceivable] = useState(false);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const [payableFileName, setPayableFileName] = useState('');
  const [receivableFileName, setReceivableFileName] = useState('');
  const [bankFileName, setBankFileName] = useState('');

  const [importHistory, setImportHistory] = useState<ImportHistoryRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => { void loadCompanies(); }, []);

  useEffect(() => {
    if (companyId) {
      void loadBankAccounts(companyId);
      void loadHistory(companyId, 1);
    } else {
      setBankAccounts([]);
      setBankAccountId(null);
      setImportHistory([]);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) { void loadHistory(companyId, historyPage); }
  }, [historyPage]);

  const loadHistory = async (compId: number, page: number) => {
    setIsLoadingHistory(true);
    try {
      const resp = await getImportHistory(compId, page);
      setImportHistory(resp.data);
      setHistoryTotalPages(resp.totalPages);
    } catch (err) { console.error(err); }
    finally { setIsLoadingHistory(false); }
  };

  const loadCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const data = await listCompanies(true);
      setCompanies(data);
      setCompanyId((current) => current ?? data[0]?.id ?? null);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? 'Erro de validação.' : detail || 'Não foi possível carregar as empresas.';
      showError(msg);
    } finally { setIsLoadingCompanies(false); }
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
    } finally { setIsLoadingBankAccounts(false); }
  };

  const selectedCompanyUnavailable = companyId === null;

  const handleFileSelection = (
    event: ChangeEvent<HTMLInputElement>,
    setFileName: Dispatch<SetStateAction<string>>
  ) => {
    setFileName(event.target.files?.[0]?.name ?? '');
  };

  const handleImportPayable = async (event: FormEvent) => {
    event.preventDefault();
    const selectedCompanyId = companyId;
    if (selectedCompanyId === null) {
      showError('Cadastre e selecione uma empresa antes de importar.');
      return;
    }
    const file = payableFileRef.current?.files?.[0];
    if (!file) {
      showError('Selecione um arquivo CSV ou XLSX.');
      return;
    }
    setIsLoadingPayable(true);
    try {
      const response = await importErpPayable(selectedCompanyId, file);
      success(`${response.detail} (${response.records_processed} registros)`);
      if (payableFileRef.current) payableFileRef.current.value = '';
      setPayableFileName('');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? 'Erro de validação nos dados enviados.' : detail || 'Erro ao importar contas a pagar.';
      showError(msg);
    } finally { setIsLoadingPayable(false); }
  };

  const handleImportReceivable = async (event: FormEvent) => {
    event.preventDefault();
    const selectedCompanyId = companyId;
    if (selectedCompanyId === null) {
      showError('Cadastre e selecione uma empresa antes de importar.');
      return;
    }
    const file = receivableFileRef.current?.files?.[0];
    if (!file) {
      showError('Selecione um arquivo CSV ou XLSX.');
      return;
    }
    setIsLoadingReceivable(true);
    try {
      const response = await importErpReceivable(selectedCompanyId, file);
      success(`${response.detail} (${response.records_processed} registros)`);
      if (receivableFileRef.current) receivableFileRef.current.value = '';
      setReceivableFileName('');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? 'Erro de validação nos dados enviados.' : detail || 'Erro ao importar contas a receber.';
      showError(msg);
    } finally { setIsLoadingReceivable(false); }
  };

  const handleImportBank = async (event: FormEvent) => {
    event.preventDefault();
    const selectedCompanyId = companyId;
    if (selectedCompanyId === null) {
      showError('Cadastre e selecione uma empresa antes de importar.');
      return;
    }
    if (bankAccountId === null) {
      showError('Cadastre e selecione uma conta bancária antes de importar.');
      return;
    }
    const file = bankFileRef.current?.files?.[0];
    if (!file) {
      showError('Selecione um arquivo PDF, CSV ou XLSX.');
      return;
    }
    setIsLoadingBank(true);
    try {
      const response = await importBank(selectedCompanyId, bankAccountId, replacePeriod, file);
      success(`${response.detail} (${response.records_processed} registros)`);
      if (bankFileRef.current) bankFileRef.current.value = '';
      setBankFileName('');
      setReplacePeriod(false);
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Erro ao importar extrato bancário.');
    } finally { setIsLoadingBank(false); }
  };

  const historyColumns = [
    { header: 'DATA', accessor: (row: ImportHistoryRow) => row.date ? formatDateBR(row.date) : '--' },
    { header: 'TIPO', accessor: 'type' as keyof ImportHistoryRow },
    {
      header: 'STATUS',
      accessor: (row: ImportHistoryRow) => (
        <Badge variant={row.status === 'Sucesso' ? 'success' : row.status.includes('Erro') ? 'error' : 'warning'} size="small" withDot>
          {row.status}
        </Badge>
      )
    },
    { header: 'REGISTROS', accessor: 'records' as keyof ImportHistoryRow, align: 'center' as const },
    { header: 'USUÁRIO', accessor: 'user' as keyof ImportHistoryRow },
  ];

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Importações</h2>
            <p className={styles.subtitle}>Importe arquivos do ERP e extratos bancários para atualizar o sistema.</p>
          </div>
        </div>

        <Card
          title="Empresa Atual"
          subtitle="Escolha a empresa que receberá a importação"
          headerAction={
            <Link to="/empresas" className={styles.linkButton}>
              <Building2 size={14} />
              Gerenciar empresas
            </Link>
          }
        >
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
                <option key={company.id} value={company.id}>{company.name}</option>
              ))
            )}
          </select>
          {companies.length === 0 && !isLoadingCompanies && (
            <div className={styles.infoBox}>
              Cadastre pelo menos uma empresa no módulo de empresas antes de executar importações.
            </div>
          )}
        </Card>

        <div className={styles.importsGrid}>
          {/* ERP - Contas a Receber */}
          <Card title="ERP - Contas a Receber" subtitle="Importe os títulos previstos para o contas a receber">
            <form onSubmit={handleImportReceivable} className={styles.importForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Arquivo CSV ou XLSX</label>
                <div className={styles.fileUpload}>
                  <FileSpreadsheet size={24} className={styles.uploadIcon} />
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    ref={receivableFileRef}
                    className={styles.fileInput}
                    onChange={(event) => handleFileSelection(event, setReceivableFileName)}
                  />
                  <span className={styles.fileText}>{receivableFileName || 'Clique para selecionar'}</span>
                </div>
              </div>
              <div className={styles.actions}>
                <Button type="submit" variant="primary" disabled={isLoadingReceivable || selectedCompanyUnavailable} icon={<Upload size={16} />}>
                  {isLoadingReceivable ? 'Importando...' : 'Importar recebíveis'}
                </Button>
              </div>
            </form>
          </Card>

          {/* ERP - Contas a Pagar */}
          <Card title="ERP - Contas a Pagar" subtitle="Importe os títulos previstos para o contas a pagar">
            <form onSubmit={handleImportPayable} className={styles.importForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Arquivo CSV ou XLSX</label>
                <div className={styles.fileUpload}>
                  <FileSpreadsheet size={24} className={styles.uploadIcon} />
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    ref={payableFileRef}
                    className={styles.fileInput}
                    onChange={(event) => handleFileSelection(event, setPayableFileName)}
                  />
                  <span className={styles.fileText}>{payableFileName || 'Clique para selecionar'}</span>
                </div>
              </div>
              <div className={styles.actions}>
                <Button type="submit" variant="primary" disabled={isLoadingPayable || selectedCompanyUnavailable} icon={<Upload size={16} />}>
                  {isLoadingPayable ? 'Importando...' : 'Importar pagáveis'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Extrato Bancário */}
          <Card title="Extrato Bancário" subtitle="Importe extratos bancários para conciliação">
            <form onSubmit={handleImportBank} className={styles.importForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Conta Bancária</label>
                <select
                  value={bankAccountId ?? ''}
                  onChange={(event) => setBankAccountId(Number(event.target.value))}
                  className={styles.select}
                  disabled={isLoadingBankAccounts || bankAccounts.length === 0}
                >
                  {bankAccounts.length === 0 ? (
                    <option value="">Nenhuma conta bancária cadastrada</option>
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
                <div className={styles.fileUpload}>
                  <FileSpreadsheet size={24} className={styles.uploadIcon} />
                  <input
                    type="file"
                    accept=".pdf,.csv,.xlsx"
                    ref={bankFileRef}
                    className={styles.fileInput}
                    onChange={(event) => handleFileSelection(event, setBankFileName)}
                  />
                  <span className={styles.fileText}>{bankFileName || 'Clique para selecionar'}</span>
                </div>
              </div>
              {user?.is_admin && (
                <div className={styles.checkboxContainer}>
                  <input type="checkbox" id="replacePeriod" checked={replacePeriod} onChange={(event) => setReplacePeriod(event.target.checked)} />
                  <label htmlFor="replacePeriod" className={styles.checkboxLabel}>Forçar substituição de período (Admin)</label>
                </div>
              )}
              <div className={styles.actions}>
                <Button type="submit" variant="primary" disabled={isLoadingBank || selectedCompanyUnavailable || bankAccounts.length === 0} icon={<Upload size={16} />}>
                  {isLoadingBank ? 'Importando...' : 'Importar extrato'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Histórico */}
        <Card title="Histórico de Importações" subtitle="Acompanhe o status dos últimos arquivos processados">
          <Table columns={historyColumns} data={importHistory} keyExtractor={(row) => row.id} compact />
          {historyTotalPages > 1 && (
            <div className={styles.pagination}>
              <Button variant="secondary" size="sm" disabled={historyPage === 1 || isLoadingHistory} onClick={() => setHistoryPage(p => p - 1)}>
                Anterior
              </Button>
              <span className={styles.pageInfo}>Página {historyPage} de {historyTotalPages}</span>
              <Button variant="secondary" size="sm" disabled={historyPage === historyTotalPages || isLoadingHistory} onClick={() => setHistoryPage(p => p + 1)}>
                Próxima <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
