
import React, { useState, useMemo } from 'react';
import type { Project, Payment } from '../types';
import { CURRENCY_SYMBOLS } from '../constants';
import { useData } from '../context/DataContext';
import { CurrencyDollarIcon, CheckBadgeIcon, ExclamationTriangleIcon, CloudIcon, FunnelIcon, ChartBarIcon } from './Icons';

// Componente de Gráfico de Barras (CSS Puro)
const MonthlyRevenueChart: React.FC<{ 
    data: { month: string; value: number; projected: number; index: number }[], 
    currencySymbol: string,
    selectedMonth: number | 'all'
}> = ({ data, currencySymbol, selectedMonth }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.value, d.projected)), 1);

    return (
        <div className="bg-surface p-6 rounded-lg shadow-lg border border-white/10">
            <h3 className="text-xl font-bold mb-6 text-text-primary">
                Fluxo de Caixa {selectedMonth !== 'all' ? '(Foco no Mês)' : '(Visão Anual)'}
            </h3>
            
            <div className="flex items-end justify-between h-64 gap-2 sm:gap-4">
                {data.map((item, index) => {
                    const isFaded = selectedMonth !== 'all' && selectedMonth !== item.index;
                    const opacityClass = isFaded ? 'opacity-30 grayscale' : 'opacity-100';

                    return (
                        <div key={index} className={`flex-1 flex flex-col items-center group relative h-full justify-end transition-all duration-500 ${opacityClass}`}>
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs p-2 rounded pointer-events-none whitespace-nowrap z-10 border border-white/20 shadow-xl">
                                <p className="font-bold text-lg mb-1">{item.month}</p>
                                <div className="space-y-1">
                                    <p className="text-emerald-400 font-mono">Real: {currencySymbol} {item.value.toLocaleString('pt-BR')}</p>
                                    <p className="text-white/60 font-mono">Previsto: {currencySymbol} {item.projected.toLocaleString('pt-BR')}</p>
                                </div>
                            </div>

                            <div 
                                className="w-full bg-white/5 rounded-t-sm absolute bottom-0 border-t border-white/10"
                                style={{ height: `${(item.projected / maxValue) * 100}%` }}
                            ></div>

                            <div 
                                className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm z-0 relative transition-all duration-700 shadow-[0_0_10px_rgba(52,211,153,0.3)] group-hover:from-emerald-500 group-hover:to-emerald-300"
                                style={{ height: `${(item.value / maxValue) * 100}%` }}
                            >
                                {item.value > 0 && !isFaded && (
                                    <span className="hidden sm:block absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-emerald-400 font-bold bg-black/40 px-1 rounded">
                                        {(item.value / 1000).toFixed(1)}k
                                    </span>
                                )}
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

const Financials: React.FC = () => {
  const { projects, clients, updatePaymentStatus, saasProducts } = useData();
  
  // Agora usamos 'projects' diretamente pois ele contém Sites e Projetos unificados
  const allProjects = projects;

  // Filtros definidos como 'all' por padrão para mostrar TUDO inicialmente
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  const monthsList = [
      { value: 'all', label: 'Todos os Meses' },
      { value: 0, label: 'Janeiro' }, { value: 1, label: 'Fevereiro' }, { value: 2, label: 'Março' },
      { value: 3, label: 'Abril' }, { value: 4, label: 'Maio' }, { value: 5, label: 'Junho' },
      { value: 6, label: 'Julho' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Setembro' },
      { value: 9, label: 'Outubro' }, { value: 10, label: 'Novembro' }, { value: 11, label: 'Dezembro' }
  ];

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'N/A';
  }

  // Cálculos Financeiros
  const financialData = useMemo(() => {
      const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyStats = monthsLabels.map((m, idx) => ({ month: m, value: 0, projected: 0, index: idx }));
      
      let yearlyRevenue = 0;
      let filteredRevenue = 0;
      let filteredPending = 0;
      let filteredOverdue = 0;

      const filteredPaymentsList: { project: Project, payment: Payment }[] = [];

      // Itera sobre todos os projetos e sites para extrair pagamentos
      allProjects.forEach(parentItem => {
          if (!parentItem.payments || parentItem.payments.length === 0) return;

          parentItem.payments.forEach(payment => {
            const date = new Date(payment.dueDate);
            const monthIdx = date.getMonth();
            const year = date.getFullYear();

            // Lógica do Filtro de Ano
            const isYearMatch = selectedYear === 'all' || year === selectedYear;

            if (isYearMatch) {
                // Dados Globais do Período Selecionado
                monthlyStats[monthIdx].projected += payment.amount;
                if (payment.status === 'Pago') {
                    monthlyStats[monthIdx].value += payment.amount;
                    yearlyRevenue += payment.amount;
                }

                // Lógica do Filtro de Mês
                const isMonthMatch = selectedMonth === 'all' || monthIdx === selectedMonth;

                if (isMonthMatch) {
                    if (payment.status === 'Pago') filteredRevenue += payment.amount;
                    else if (payment.status === 'Pendente') filteredPending += payment.amount;
                    else if (payment.status === 'Atrasado') filteredOverdue += payment.amount;

                    filteredPaymentsList.push({ project: parentItem, payment });
                }
            }
          });
      });

      filteredPaymentsList.sort((a, b) => new Date(a.payment.dueDate).getTime() - new Date(b.payment.dueDate).getTime());

      // Cálculo de MRR (Receita Recorrente Mensal)
      const projectRetainers = allProjects.reduce((acc, p) => {
          if (p.hasRetainer && p.retainerValue) {
              return acc + Number(p.retainerValue);
          }
          return acc;
      }, 0);

      const saasMRR = saasProducts.reduce((acc, p) => {
          return acc + p.plans.reduce((sum, plan) => sum + (plan.price * plan.customerCount), 0);
      }, 0);
      
      const rawMRR = projectRetainers + saasMRR;
      const totalMRR = Math.round((rawMRR + Number.EPSILON) * 100) / 100;

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
  }, [allProjects, saasProducts, selectedYear, selectedMonth]);

  const mainCurrency = 'BRL';
  const symbol = CURRENCY_SYMBOLS[mainCurrency];
  const formatMoney = (val: number) => `${symbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-surface p-4 rounded-lg border border-white/10">
          <div>
            <h2 className="text-3xl font-bold text-text-primary">Gestão Financeira</h2>
            <p className="text-text-secondary">Visão geral de faturamento e fluxo de caixa.</p>
          </div>
          
          <div className="flex gap-2 bg-background/50 p-1 rounded-lg border border-white/10">
              <div className="flex items-center px-2">
                <span className="text-text-secondary text-xs mr-2 uppercase font-bold tracking-wider">Período:</span>
                
                <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-transparent text-text-primary font-medium focus:outline-none border-r border-white/10 pr-2 mr-2 cursor-pointer hover:text-primary"
                >
                    {monthsList.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>

                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
                >
                    <option value="all">Todos os Anos</option>
                    <option value={2023}>2023</option>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                </select>
              </div>
          </div>
      </div>
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KPICard 
            title={selectedYear === 'all' ? `Faturamento Total (Histórico)` : `Faturamento Total (${selectedYear})`} 
            value={formatMoney(financialData.yearlyRevenue)} 
            icon={<ChartBarIcon className="w-6 h-6"/>}
            colorClass="text-emerald-400"
            trend={selectedYear === 'all' ? "Todo o histórico" : "Acumulado do Ano"}
          />
          <KPICard 
            title={selectedMonth !== 'all' ? `Faturamento em ${monthsList.find(m => m.value === selectedMonth)?.label}` : 'Média Mensal'} 
            value={selectedMonth !== 'all' ? formatMoney(financialData.filteredRevenue) : formatMoney(financialData.monthlyAverage)} 
            icon={<CurrencyDollarIcon className="w-6 h-6"/>}
            colorClass="text-cyan-400"
            trend={selectedMonth !== 'all' ? "Receita neste mês" : "Baseado no período"}
          />
          <KPICard 
            title="Receita Recorrente (MRR)" 
            value={formatMoney(financialData.totalMRR)} 
            icon={<CloudIcon className="w-6 h-6"/>}
            colorClass="text-blue-400"
            trend="SaaS + Retainers (Sites/Projetos)"
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

      {/* Transactions List */}
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-white/10">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <FunnelIcon className="w-5 h-5 text-primary" />
                    Transações Detalhadas (Parcelas de Todos os Projetos)
                </h3>
                <span className="text-sm text-text-secondary bg-white/5 px-3 py-1 rounded-full">
                    {financialData.filteredPaymentsList.length} registros
                </span>
            </div>
            
            <div className="space-y-2 p-4 max-h-[800px] overflow-y-auto custom-scrollbar">
                {financialData.filteredPaymentsList.length > 0 ? (
                    financialData.filteredPaymentsList.map(({ project, payment }) => (
                        <div key={`${project.id}-${payment.id}`} className="border border-white/5 rounded-lg p-4 bg-background/20 hover:bg-background/40 transition-colors flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-10 rounded-full ${
                                        payment.status === 'Pago' ? 'bg-emerald-500' : 
                                        payment.status === 'Atrasado' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}></div>
                                    <div>
                                        <h4 className="font-bold text-text-primary flex items-center gap-2">
                                            {project.name}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                project.category === 'Site' 
                                                ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' 
                                                : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                            }`}>
                                                {project.category || 'Geral'}
                                            </span>
                                        </h4>
                                        <p className="text-sm text-text-secondary">{getClientName(project.clientId)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center w-full md:w-auto">
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-text-secondary uppercase font-bold">Vencimento</p>
                                    <p className="text-text-primary font-mono">{new Date(payment.dueDate).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="text-center md:text-right">
                                    <p className="text-xs text-text-secondary uppercase font-bold">Valor</p>
                                    <p className="text-text-primary font-bold text-lg">{formatMoney(payment.amount)}</p>
                                </div>
                                
                                <div className="min-w-[120px] text-right">
                                    {payment.status !== 'Pago' ? (
                                        <button 
                                            onClick={() => updatePaymentStatus(project.id, payment.id, 'Pago')}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-500 transition-colors text-sm font-bold shadow-lg shadow-emerald-900/20"
                                        >
                                            Receber
                                        </button>
                                    ) : (
                                        <span className="text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 rounded-md text-sm">
                                            Pago
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 flex flex-col items-center justify-center text-text-secondary">
                        <CurrencyDollarIcon className="w-12 h-12 mb-3 opacity-20" />
                        <p>Nenhuma transação encontrada.</p>
                        <p className="text-sm mt-2 opacity-50">Certifique-se de que os projetos possuem parcelas ou entrada cadastradas.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Financials;
