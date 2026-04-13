import { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { Company, listCompanies } from '../services/companyService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { createAdjustment, AdjustmentCreate } from '../services/adjustmentService';
import { getTodayLocal } from '../utils/date';
import styles from './Ajustes.module.css';

export default function Ajustes() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [companyId, setCompanyId] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  useEffect(() => {
    const loadComps = async () => {
      try {
        const data = await listCompanies(true);
        setCompanies(data);
        if (data.length > 0) setCompanyId(data[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadComps();
  }, []);

  const [adjustmentDate, setAdjustmentDate] = useState(getTodayLocal());
  const [kind, setKind] = useState<'IN' | 'OUT'>('OUT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [reason, setReason] = useState('');

  // Saldo Inicial State
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
      
      // Limpa os campos após sucesso
      setAmount('');
      setDescription('');
      setCategoryId('');
      setReason('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erro ao criar ajuste manual.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSaldoInicial = async (e: FormEvent) => {
    e.preventDefault();
    if (!saldoInicialAmount || isNaN(Number(saldoInicialAmount))) {
      setMessage({ type: 'error', text: 'Informe um valor numérico válido para o saldo inicial.' });
      return;
    }
    
    if (!window.confirm(`Confirma a definição de R$ ${Number(saldoInicialAmount).toFixed(2)} como saldo inicial para a data selecionada?`)) return;

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
    } finally {
      setIsSavingSaldo(false);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2>Ajustes Manuais & Saldo</h2>
            <p>Inclusão de lançamentos financeiros não previstos e definição de saldo inicial de caixa.</p>
          </div>
        </div>

        {message && (
          <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label className={styles.label} style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>EMPRESA DE REFERÊNCIA</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(Number(e.target.value))}
            disabled={isLoadingCompanies || companies.length === 0}
            className={styles.select}
            style={{ maxWidth: '400px' }}
          >
              {companies.length === 0 ? (
                <option value="">Carregando...</option>
              ) : (
                companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              )}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 'var(--spacing-xl)' }}>
          {/* Sessão: Saldo Inicial */}
          <section style={{ background: 'var(--bg-panel)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-md)', paddingBottom: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-strong)' }}>
              DEFINIÇÃO DE SALDO INICIAL
            </h3>
            <form onSubmit={handleSaveSaldoInicial}>
              <div className={styles.infoBox} style={{ marginBottom: 'var(--spacing-md)' }}>
                <span className={styles.infoIcon}>💡</span>
                <div>
                  <strong>Primeiro Lançamento:</strong> Utilize este quadro exclusivamente para registrar o saldo real em conta no momento de implantação do sistema.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <Input
                    type="date"
                    label="DATA DE REFERÊNCIA"
                    value={saldoInicialDate}
                    onChange={(e) => setSaldoInicialDate(e.target.value)}
                    required
                    variant="date"
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <Input
                    type="number"
                    label="SALDO INICIAL (R$)"
                    step="0.01"
                    value={saldoInicialAmount}
                    onChange={(e) => setSaldoInicialAmount(e.target.value)}
                    placeholder="Ex: 50000.00"
                    required
                  />
                </div>
                <div>
                  <Button type="submit" variant="secondary" disabled={isSavingSaldo || isLoading}>
                    {isSavingSaldo ? 'SALVANDO...' : 'SALVAR SALDO INICIAL'}
                  </Button>
                </div>
              </div>
            </form>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', margin: '0' }} />

          {/* Sessão: Ajustes Manuais */}
          <section>
            <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>NOVO AJUSTE AVULSO</h3>
            <form className={styles.content} onSubmit={handleSubmit} style={{ margin: 0 }}>
              <div className={styles.infoBox}>
                <span className={styles.infoIcon}>ℹ️</span>
                <div>
                  <strong>Atenção:</strong> Todo ajuste manual gera um registro de auditoria inalterável.
                  Por favor, seja claro na justificativa. Não é possível lançar em dias já fechados.
                </div>
              </div>

              <div className={styles.formGrid}>
                <Input
                  type="date"
                  label="DATA DO AJUSTE"
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  required
                  variant="date"
                />

                <div className={styles.formGroup}>
                  <label className={styles.label}>TIPO DE LANÇAMENTO</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as 'IN' | 'OUT')}
                    className={styles.select}
                  >
                    <option value="IN">ENTRADA (CRÉDITO)</option>
                    <option value="OUT">SAÍDA (DÉBITO)</option>
                  </select>
                </div>

                <Input
                  type="number"
                  label="VALOR (R$)"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className={styles.formGroup} style={{ marginTop: 'var(--spacing-md)' }}>
                <label className={styles.label}>DESCRIÇÃO DO LANÇAMENTO</label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Pagamento extra fornecedor X"
                  required
                />
              </div>

              <div className={styles.formGroup} style={{ marginTop: 'var(--spacing-md)' }}>
                <label className={styles.label}>JUSTIFICATIVA (AUDITORIA)</label>
                <textarea
                  className={styles.textarea}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo detalhado para este lançamento manual não vir do ERP..."
                  required
                />
              </div>

              <div className={styles.actions}>
                <Button type="submit" variant="primary" disabled={isLoading || isSavingSaldo}>
                  {isLoading ? 'REGISTRANDO...' : 'REGISTRAR AJUSTE MANUAL'}
                </Button>
              </div>
            </form>
          </section>

        </div>
      </div>
    </Layout>
  );
}
