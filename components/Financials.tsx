
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Project, Payment, Transaction, TransactionStatus, Currency } from '../types';
import { CURRENCY_SYMBOLS, CURRENCIES } from '../constants';
import { useData } from '../context/DataContext';
import { CurrencyDollarIcon, CheckBadgeIcon, ExclamationTriangleIcon, CloudIcon, FunnelIcon, ChartBarIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, PlusIcon } from './Icons';

// Helper to format compact numbers
const formatCompactNumber = (number: number) => {
  if (number === 0) return '0';
  if (number < 1000) {
    return Math.floor(number) === number ? number.toString() : number.toFixed(1).replace('.0', '');
  }
  return (number / 1000).toFixed(1) + 'k';
};

interface ChartData {
    month: string;
    value: number;
    projected: number;
    index: number;
}

interface ChartProps {
    data: ChartData[];
    currencySymbol: string;
    selectedMonth: number | 'all';
}

const MonthlyRevenueChart: React.FC<ChartProps> = ({ data, currencySymbol, selectedMonth }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.value, d.projected)), 1);

    return (
        <div className="bg-surface p-6 rounded-lg shadow-lg border border-white/10">
            <h3 className="text-xl font-bold mb-6 text-text-primary">
                Fluxo de Caixa {selectedMonth !== 'all' ? '(Foco no Mês)' : '(Visão Anual)'}
            </h3>
            
            <div className="flex items-end justify-between h-64 gap-2 sm:gap-4 pb-2">
                {data.map((item, index) => {
                    const isFaded = selectedMonth !== 'all' && selectedMonth !== item.index;
                    const opacityClass = isFaded ? 'opacity-30 grayscale' : 'opacity-100';
                    
                    return (
                        <div key={index} className={`flex-1 flex flex-col items-center group relative h-full justify-end transition-all duration-500 ${opacityClass}`}>
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/95 text-white text-xs p-2 rounded pointer-events-none whitespace-nowrap z-50 border border-white/20 shadow-xl left-1/2 -translate-x-1/2">
                                <p className="font-bold text-lg mb-1 border-b border-white/20 pb-1">{item.month}</p>
                                <div className="space-y-1 text-left">
                                    <p className="text-emerald-400 font-mono">Real: {currencySymbol} {item.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                    <p className="text-white/60 font-mono">Previsto: {currencySymbol} {item.projected.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                </div>
                            </div>

                            {/* Bar Container */}
                            <div className="relative w-full h-full flex items-end">
                                {/* Projected Bar (Background) */}
                                <div 
                                    className="w-full bg-white/5 rounded-t-sm absolute bottom-0 border-t border-white/10 left-0 right-0 mx-auto max-w-[40px]"
                                    style={{ height: `${(item.projected / maxValue) * 100}%` }}
                                ></div>

                                {/* Actual Value Bar (Foreground) */}
                                <div 
                                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm z-10 relative transition-all duration-700 shadow-[0_0_10px_rgba(52,211,153,0.3)] group-hover:from-emerald-500 group-hover:to-emerald-300 left-0 right-0 mx-auto max-w-[40px]"
                                    style={{ height: `${(item.value / maxValue) * 100}%` }}
                                >
                                     {item.value > 0 && !isFaded && (
                                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] text-emerald-400 font-bold bg-black/80 px-1.5 py-0.5 rounded shadow-sm border border-emerald-500/30 z-20 whitespace-nowrap">
                                            {formatCompactNumber(item.value)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <span className={`text-xs mt-3 font-medium ${selectedMonth === item.index ? 'text-emerald-400 font-bold scale-110' : 'text-text-secondary'}`}>
                                {item.month}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex justify-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-sm shadow-[0_0_5px_rgba(52,211,153,0.5)]"></div>
                    <span className="text-text-secondary">Recebido (Pago)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/10 rounded-sm border border-white/20"></div>
                    <span className="text-text-secondary">Projetado (Total)</span>
                </div>
            </div>
        </div>
    );
};

const KPICard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    trend?: string; 
    colorClass?: string 
}> = ({ title, value, icon, trend, colorClass = "text-primary" }) => (
    <div className="bg-surface p-5 rounded-lg shadow-lg border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors h-full">
        <div>
            <p className="text-sm text-text-secondary font-medium mb-1">{title}</p>
            <h4 className="text-2xl font-bold text-text-primary">{value}</h4>
            {trend && <p className="text-xs text-text-secondary mt-1 opacity-80">{trend}</p>}
        </div>
        <div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
            <span className={colorClass}>{icon}</span>
        </div>
    </div>
);

// --- Componente Form de Transação Manual ---
const TransactionForm: React.FC<{
    onSave: (transaction: Omit<Transaction, 'id' | 'companyId'>) => Promise<void>;
}> = ({ onSave }) => {
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<TransactionStatus>('Pendente');
    const [type, setType] = useState<'Receita' | 'Despesa'>('Receita');
    const [currency, setCurrency] = useState<Currency>('BRL');
    const [category, setCategory] = useState('Atualização');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc || !amount || !date) return;
        
        setIsSaving(true);
        await onSave({
            description: desc,
            amount: parseFloat(amount),
            date: date,
            status: status,
            type: type,
            currency: currency,
            category: category
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                <input 
                    type="text" 
                    placeholder="Ex: Consultoria Internacional, Servidor..." 
                    value={desc} 
                    onChange={e => setDesc(e.target.value)} 
                    className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-text-primary"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="block text-sm font-medium text-text-secondary mb-1">Valor</label>
                     <input 
                        type="number" 
                        placeholder="0,00" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Moeda</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary">
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="block text-sm font-medium text-text-secondary mb-1">Data</label>
                     <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary">
                        <option value="Receita">Receita</option>
                        <option value="Despesa">Despesa</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as TransactionStatus)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary">
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Categoria</label>
                <input 
                    type="text" 
                    placeholder="Ex: Exportação de Software" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary"
                />
            </div>
            <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 font-bold"
            >
                {isSaving ? 'Salvando...' : 'Adicionar Transação'}
            </button>
        </form>
    );
};

// --- Componente de Seletor de Mês/Ano ---
interface MonthYearPickerProps {
    selectedMonth: number | 'all';
    selectedYear: number | 'all';
    onChange: (month: number | 'all', year: number | 'all') => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ selectedMonth, selectedYear, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(selectedYear === 'all' ? new Date().getFullYear() : selectedYear);
    const containerRef = useRef<HTMLDivElement>(null);

    const months = [
        { abbr: 'jan', full: 'Janeiro' }, { abbr: 'fev', full: 'Fevereiro' }, { abbr: 'mar', full: 'Março' },
        { abbr: 'abr', full: 'Abril' }, { abbr: 'mai', full: 'Maio' }, { abbr: 'jun', full: 'Junho' },
        { abbr: 'jul', full: 'Julho' }, { abbr: 'ago', full: 'Agosto' }, { abbr: 'set', full: 'Setembro' },
        { abbr: 'out', full: 'Outubro' }, { abbr: 'nov', full: 'Novembro' }, { abbr: 'dez', full: 'Dezembro' }
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMonthClick = (index: number) => {
        onChange(index, viewYear);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange('all', 'all');
        setIsOpen(false);
    };

    const handleThisMonth = () => {
        const now = new Date();
        const currentM = now.getMonth();
        const currentY = now.getFullYear();
        setViewYear(currentY);
        onChange(currentM, currentY);
        setIsOpen(false);
    };

    const getDisplayLabel = () => {
        if (selectedYear === 'all') return 'Todo o período';
        if (selectedMonth === 'all') return `Todo o ano de ${selectedYear}`;
        return `${months[selectedMonth].full} de ${selectedYear}`;
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between gap-3 bg-surface border border-white/20 hover:border-primary/50 rounded-lg px-4 py-2 text-sm font-medium text-text-primary shadow-sm min-w-[160px] transition-all"
                >
                    <span className="capitalize truncate">{getDisplayLabel()}</span>
                    <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-surface border border-white/10 rounded-lg shadow-2xl z-50 w-72 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                        <button onClick={() => setViewYear(prev => prev - 1)} className="p-1 hover:bg-white/10 rounded-full text-text-secondary hover:text-white">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-lg text-text-primary">{viewYear}</span>
                        <button onClick={() => setViewYear(prev => prev + 1)} className="p-1 hover:bg-white/10 rounded-full text-text-secondary hover:text-white">
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {months.map((m, index) => {
                            const isSelected = selectedMonth === index && selectedYear === viewYear;
                            return (
                                <button
                                    key={m.abbr}
                                    onClick={() => handleMonthClick(index)}
                                    className={`py-2 text-sm rounded-md transition-colors capitalize ${isSelected ? 'bg-primary text-white font-bold shadow-md' : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'}`}
                                >
                                    {m.abbr}
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <button onClick={handleClear} className="text-xs font-medium text-text-secondary hover:text-primary transition-colors">Limpar</button>
                        <button onClick={handleThisMonth} className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">Este mês</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --------------------------------------------------------

export default function Financials() {
  const { projects, clients, updatePaymentStatus, saasProducts, transactions, addTransaction, updateTransaction, deleteTransaction, openModal } = useData();
  
  // Ajuste: Financeiro agora inicia puxando o Mês e Ano atuais
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth());
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('BRL');

  const monthsList = [
      { value: 'all', label: 'Ano Inteiro' },
      { value: 0, label: 'Janeiro' }, { value: 1, label: 'Fevereiro' }, { value: 2, label: 'Março' },
      { value: 3, label: 'Abril' }, { value: 4, label: 'Maio' }, { value: 5, label: 'Junho' },
      { value: 6, label: 'Julho' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Setembro' },
      { value: 9, label: 'Outubro' }, { value: 10, label: 'Novembro' }, { value: 11, label: 'Dezembro' }
  ];

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'N/A';
  }

  const handleAddTransaction = () => {
      openModal('Adicionar Pagamento / Atualização', <TransactionForm onSave={addTransaction} />);
  };

  const handleUpdateTransaction = (t: Transaction, newStatus: TransactionStatus) => {
      updateTransaction({...t, status: newStatus});
  };

  const handleDeleteTransaction = (id: string) => {
      if(confirm('Excluir esta transação?')) {
          deleteTransaction(id);
      }
  };

  const financialData = useMemo(() => {
      const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyStats = monthsLabels.map((m, idx) => ({ month: m, value: 0, projected: 0, index: idx }));
      
      let yearlyRevenue = 0;
      let filteredRevenue = 0;
      let filteredPending = 0;
      let filteredOverdue = 0;

      // Lista unificada de pagamentos
      const unifiedPayments: Array<{
          id: string;
          type: 'Project' | 'Manual';
          name: string;
          clientOrDesc: string;
          date: string;
          amount: number;
          status: TransactionStatus;
          currency: Currency;
          paidDate?: string;
          category?: string;
          originalItem: any;
      }> = [];

      // 1. Processar Projetos
      projects.forEach(project => {
          if (!project.payments) return;
          project.payments.forEach(payment => {
            const dateString = payment.status === 'Pago' && payment.paidDate ? payment.paidDate : payment.dueDate;
            if (!dateString) return;

            unifiedPayments.push({
                id: payment.id,
                type: 'Project',
                name: project.name,
                clientOrDesc: getClientName(project.clientId),
                date: dateString,
                amount: payment.amount,
                status: payment.status,
                currency: project.currency,
                paidDate: payment.paidDate,
                category: project.category,
                originalItem: { project: project, payment }
            });
          });
      });

      // 2. Processar Transações Manuais
      transactions.forEach(t => {
          unifiedPayments.push({
              id: t.id,
              type: 'Manual',
              name: t.description,
              clientOrDesc: 'Transação Avulsa',
              date: t.date,
              amount: t.amount,
              status: t.status,
              currency: t.currency || 'BRL',
              category: t.category,
              originalItem: t
          });
      });

      // 3. Filtrar por Moeda e Período
      const filteredPaymentsList: typeof unifiedPayments = [];

      unifiedPayments.forEach(item => {
            if (item.currency !== selectedCurrency) return;

            const [yStr, mStr, dStr] = item.date.split('T')[0].split('-');
            const year = parseInt(yStr);
            const monthIdx = parseInt(mStr) - 1;

            const isYearMatch = selectedYear === 'all' || year === selectedYear;

            if (isYearMatch) {
                if (item.status === 'Pago') {
                    monthlyStats[monthIdx].value += item.amount;
                    yearlyRevenue += item.amount;
                }
                monthlyStats[monthIdx].projected += item.amount;

                const isMonthMatch = selectedMonth === 'all' || monthIdx === selectedMonth;

                if (isMonthMatch) {
                    if (item.status === 'Pago') filteredRevenue += item.amount;
                    else if (item.status === 'Pendente') filteredPending += item.amount;
                    else if (item.status === 'Atrasado') filteredOverdue += item.amount;

                    filteredPaymentsList.push(item);
                }
            }
      });

      filteredPaymentsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const saasMRR = saasProducts
          .filter(s => s.currency === selectedCurrency)
          .reduce((acc, p) => {
              return acc + p.plans.reduce((sum, plan) => sum + (plan.price * plan.customerCount), 0);
          }, 0);
      
      const totalMRR = Math.round((saasMRR + Number.EPSILON) * 100) / 100;

      const currentMonth = new Date().getMonth();
      const monthsElapsed = selectedYear === new Date().getFullYear() ? currentMonth + 1 : 12;
      const monthlyAverage = yearlyRevenue / (selectedYear === 'all' ? 12 : monthsElapsed || 1);

      return {
          monthlyStats,
          yearlyRevenue,
          filteredRevenue,
          monthlyAverage,
          filteredPending,
          filteredOverdue,
          totalMRR,
          filteredPaymentsList
      };
  }, [projects, transactions, saasProducts, selectedYear, selectedMonth, selectedCurrency, clients]);

  const symbol = CURRENCY_SYMBOLS[selectedCurrency];
  const formatMoney = (val: number) => `${symbol} ${val.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
  })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-surface p-4 rounded-lg border border-white/10">
          <div>
            <h2 className="text-3xl font-bold text-text-primary">Gestão Financeira</h2>
            <p className="text-text-secondary">Visão geral de faturamento em <span className="text-primary font-bold">{selectedCurrency}</span>.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full md:w-auto">
              <div className="bg-white p-1 rounded-full border border-slate-200 flex items-center shadow-sm shrink-0">
                  <button 
                    onClick={() => setSelectedCurrency('BRL')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${selectedCurrency === 'BRL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    BRL
                  </button>
                  <button 
                    onClick={() => setSelectedCurrency('USD')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${selectedCurrency === 'USD' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    USD
                  </button>
              </div>

              <MonthYearPicker 
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onChange={(m, y) => {
                    setSelectedMonth(m);
                    setSelectedYear(y);
                }}
              />
              <button 
                  onClick={handleAddTransaction}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto font-bold transition-all transform hover:scale-105"
              >
                  <PlusIcon className="w-5 h-5" />
                  Adicionar Pagamento
              </button>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KPICard 
            title={selectedYear === 'all' ? `Faturamento Total` : `Faturamento (${selectedYear})`} 
            value={formatMoney(financialData.yearlyRevenue)} 
            icon={<ChartBarIcon className="w-6 h-6"/>}
            colorClass="text-emerald-400"
            trend={selectedYear === 'all' ? "Histórico Completo" : "Acumulado no Ano"}
          />
          <KPICard 
            title={selectedMonth !== 'all' ? `Faturado em ${monthsList.find(m => m.value === selectedMonth)?.label}` : 'Média Mensal'} 
            value={formatMoney(financialData.filteredRevenue)} 
            icon={<CurrencyDollarIcon className="w-6 h-6"/>}
            colorClass="text-cyan-400"
            trend={selectedMonth !== 'all' ? "Receita neste mês" : "Baseado no período"}
          />
          <KPICard 
            title="Receita Recorrente (MRR)" 
            value={formatMoney(financialData.totalMRR)} 
            icon={<CloudIcon className="w-6 h-6"/>}
            colorClass="text-blue-400"
            trend={`Apenas SaaS em ${selectedCurrency}`}
          />
          <KPICard 
            title="A Receber (Pendente)" 
            value={formatMoney(financialData.filteredPending)} 
            icon={<CheckBadgeIcon className="w-6 h-6"/>}
            colorClass="text-yellow-400"
            trend={selectedMonth !== 'all' ? "Pendente no mês" : "Total pendente no período"}
          />
          <KPICard 
            title="Em Atraso" 
            value={formatMoney(financialData.filteredOverdue)} 
            icon={<ExclamationTriangleIcon className="w-6 h-6"/>}
            colorClass="text-red-400"
            trend="Necessita atenção"
          />
      </div>

      <MonthlyRevenueChart 
        data={financialData.monthlyStats} 
        currencySymbol={symbol} 
        selectedMonth={selectedMonth}
      />

      <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-white/10">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <FunnelIcon className="w-5 h-5 text-primary" />
                    Transações Detalhadas ({selectedCurrency})
                </h3>
                <span className="text-sm text-text-secondary bg-white/5 px-3 py-1 rounded-full">
                    {financialData.filteredPaymentsList.length} registros
                </span>
            </div>
            
            <div className="space-y-2 p-4 max-h-[800px] overflow-y-auto custom-scrollbar">
                {financialData.filteredPaymentsList.length > 0 ? (
                    financialData.filteredPaymentsList.map((item) => (
                        <div key={item.id} className="border border-white/5 rounded-lg p-4 bg-background/20 hover:bg-background/40 transition-colors flex flex-col md:flex-row justify-between items-center gap-4 group">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-10 rounded-full ${
                                        item.status === 'Pago' ? 'bg-emerald-500' : 
                                        item.status === 'Atrasado' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}></div>
                                    <div>
                                        <h4 className="font-bold text-text-primary flex items-center gap-2">
                                            {item.name}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                item.type === 'Manual' 
                                                ? 'border-gray-500/30 bg-gray-500/10 text-gray-400'
                                                : item.category === 'Site' 
                                                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' 
                                                    : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                            }`}>
                                                {item.type === 'Manual' ? item.category : (item.category || 'Geral')}
                                            </span>
                                        </h4>
                                        <p className="text-sm text-text-secondary">{item.clientOrDesc}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center w-full md:w-auto">
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-text-secondary uppercase font-bold">Vencimento</p>
                                    <p className="text-text-primary font-mono">{new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                </div>
                                <div className="text-center md:text-right">
                                    <p className="text-xs text-text-secondary uppercase font-bold">Valor</p>
                                    <p className="text-text-primary font-bold text-lg">{formatMoney(item.amount)}</p>
                                </div>
                                
                                <div className="min-w-[120px] text-right flex items-center gap-2">
                                    {item.status !== 'Pago' ? (
                                        <button 
                                            onClick={() => {
                                                if (item.type === 'Project') {
                                                    updatePaymentStatus(item.originalItem.project.id, item.originalItem.payment.id, 'Pago');
                                                } else {
                                                    handleUpdateTransaction(item.originalItem, 'Pago');
                                                }
                                            }}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-500 transition-colors text-sm font-bold shadow-lg shadow-emerald-900/20"
                                        >
                                            Receber
                                        </button>
                                    ) : (
                                        <span className="text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 rounded-md text-sm">
                                            Pago
                                        </span>
                                    )}

                                    {item.type === 'Manual' && (
                                        <button 
                                            onClick={() => handleDeleteTransaction(item.id)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Excluir Transação"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 flex flex-col items-center justify-center text-text-secondary">
                        <CurrencyDollarIcon className="w-12 h-12 mb-3 opacity-20" />
                        <p>Nenhuma transação encontrada em {selectedCurrency} para este período.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
