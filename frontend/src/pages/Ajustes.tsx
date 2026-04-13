import { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { Company, listCompanies } from '../services/companyService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { createAdjustment, AdjustmentCreate } from '../services/adjustmentService';
import { getTodayLocal } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { Card } from '../components/ui/Card';
import { AlertCircle, PlusCircle, Save, Wallet } from 'lucide-react';
import styles from './Ajustes.module.css';

export default function Ajustes() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [companyId, setCompanyId] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  useEffect(() => {
    const loadComps = async () => {
      try {
        const data = await listCompanies(true);
        setCompanies(data);
        if (data.length > 0) setCompanyId(data[0].id);
      } catch (e) { console.error(e); }
      finally { setIsLoadingCompanies(false); }
    };
    loadComps();
  }, []);

  const [adjustmentDate, setAdjustmentDate] = useState(getTodayLocal());
  const [kind, setKind] = useState<'IN' | 'OUT'>('OUT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [reason, setReason] = useState('');

  const [saldoInicialDate, setSaldoInicialDate] = useState(getTodayLocal());
  const [saldoInicialAmount, setSaldoInicialAmount] = useState('');
  const [isSavingSaldo, setIsSavingSaldo] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setMessage({ type: 'error', text: 'Informe um valor válido maior que zero.' });
      return;
    }
    if (!description.trim() || !reason.trim()) {
      setMessage({ type: 'error', text: 'Descrição e motivo (justificativa) são obrigatórios.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    const payload: AdjustmentCreate = {
      company_id: companyId,
      adjustment_date: adjustmentDate,
      kind,
      amount: Number(amount),
      description,
      category_id: categoryId || undefined,
      reason
    };
    try {
      const response = await createAdjustment(payload);
      setMessage({ type: 'success', text: `${response.detail} (ID: ${response.id})` });
      setAmount('');
      setDescription('');
      setCategoryId('');
      setReason('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erro ao criar ajuste manual.' });
    } finally { setIsLoading(false); }
  };

  const handleSaveSaldoInicial = async (e: FormEvent) => {
    e.preventDefault();
    if (!saldoInicialAmount || isNaN(Number(saldoInicialAmount))) {
      setMessage({ type: 'error', text: 'Informe um valor numérico válido para o saldo inicial.' });
      return;
    }
    if (!window.confirm(`Confirma a definição de ${formatCurrency(Number(saldoInicialAmount))} como saldo inicial?`)) return;
    setIsSavingSaldo(true);
    setMessage(null);
    try {
      const response = await createAdjustment({
        company_id: companyId,
        adjustment_date: saldoInicialDate,
        kind: 'IN',
        amount: Number(saldoInicialAmount),
        description: 'Saldo Inicial Lançado',
        reason: 'Registro de Saldo Inicial'
      });
      setMessage({ type: 'success', text: `Saldo inicial salvo com sucesso (ID: ${response.id})` });
      setSaldoInicialAmount('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erro ao salvar o saldo inicial.' });
    } finally { setIsSavingSaldo(false); }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Ajustes Manuais & Saldo</h2>
          <p className={styles.subtitle}>Inclusão de lançamentos financeiros não previstos e definição de saldo inicial.</p>
        </div>

        {message && (
          <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
            <AlertCircle size={16} />
            <span>{message.text}</span>
          </div>
        )}

        <div className={styles.companySelector}>
          <label className={styles.label}>Empresa de Referência</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(Number(e.target.value))}
            disabled={isLoadingCompanies || companies.length === 0}
            className={styles.select}
          >
            {companies.length === 0 ? (
              <option value="">Carregando...</option>
            ) : (
              companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
            )}
          </select>
        </div>

        <div className={styles.sections}>
          {/* Saldo Inicial */}
          <Card title="Definição de Saldo Inicial" headerAction={<Wallet size={18} className={styles.sectionIcon} />}>
            <div className={styles.infoBox}>
              <AlertCircle size={16} />
              <div><strong>Primeiro Lançamento:</strong> Utilize este quadro para registrar o saldo real no momento de implantação do sistema.</div>
            </div>
            <form onSubmit={handleSaveSaldoInicial}>
              <div className={styles.formRow}>
                <Input type="date" label="Data de Referência" value={saldoInicialDate} onChange={(e) => setSaldoInicialDate(e.target.value)} required variant="date" />
                <Input type="number" label="Saldo Inicial (R$)" step="0.01" value={saldoInicialAmount} onChange={(e) => setSaldoInicialAmount(e.target.value)} placeholder="Ex: 50000.00" required />
                <Button type="submit" variant="secondary" disabled={isSavingSaldo || isLoading} icon={<Save size={16} />}>
                  {isSavingSaldo ? 'Salvando...' : 'Salvar Saldo'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Ajustes Manuais */}
          <Card title="Novo Ajuste Avulso" headerAction={<PlusCircle size={18} className={styles.sectionIcon} />}>
            <div className={styles.infoBox}>
              <AlertCircle size={16} />
              <div><strong>Atenção:</strong> Todo ajuste manual gera um registro de auditoria inalterável. Seja claro na justificativa.</div>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <Input type="date" label="Data do Ajuste" value={adjustmentDate} onChange={(e) => setAdjustmentDate(e.target.value)} required variant="date" />
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de Lançamento</label>
                  <select value={kind} onChange={(e) => setKind(e.target.value as 'IN' | 'OUT')} className={styles.select}>
                    <option value="IN">Entrada (Crédito)</option>
                    <option value="OUT">Saída (Débito)</option>
                  </select>
                </div>
                <Input type="number" label="Valor (R$)" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Descrição do Lançamento</label>
                <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Pagamento extra fornecedor X" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Justificativa (Auditoria)</label>
                <textarea className={styles.textarea} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo detalhado para este lançamento manual..." required />
              </div>
              <div className={styles.actions}>
                <Button type="submit" variant="primary" disabled={isLoading || isSavingSaldo} icon={<PlusCircle size={16} />}>
                  {isLoading ? 'Registrando...' : 'Registrar Ajuste Manual'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
