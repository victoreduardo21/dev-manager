
import React, { useMemo, useState } from 'react';
import { CURRENCY_SYMBOLS } from '../constants';
import { useData } from '../context/DataContext';
import { UsersIcon, BriefcaseIcon, CurrencyDollarIcon, RocketLaunchIcon, ExclamationTriangleIcon } from './Icons';
import type { Currency } from '../types';

const DashboardCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtext?: string; 
  icon: React.ReactElement<{ className?: string }>; 
  color?: string; 
}> = ({ title, value, subtext, icon, color = "bg-blue-600/10 text-blue-600" }) => (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center transition-all hover:shadow-xl hover:shadow-blue-900/5 group">
        <div className={`w-16 h-16 ${color} rounded-full mr-5 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110`}>
            {React.cloneElement(icon, { className: 'h-8 w-8' })}
        </div>
        <div className="overflow-hidden">
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter truncate">{value}</p>
            {subtext && <p className="text-[10px] text-slate-500 font-bold mt-1 opacity-70 truncate">{subtext}</p>}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { projects, clients, partners, saasProducts, transactions, currentUser, companies, setActiveView } = useData();
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('BRL');
    
    const myCompany = companies.find(c => c.id === currentUser?.companyId);
    const currentPlan = myCompany?.plan || 'Starter';

    // Filtra projetos pela moeda selecionada para os indicadores operacionais
    const filteredProjects = useMemo(() => projects.filter(p => p.currency === selectedCurrency), [projects, selectedCurrency]);
    
    const projectsInProgress = useMemo(() => filteredProjects.filter(p => p.status === 'Em Andamento').length, [filteredProjects]);
    const completedProjects = useMemo(() => filteredProjects.filter(p => p.status === 'Concluído').length, [filteredProjects]);
    const overdueProjectsCount = useMemo(() => filteredProjects.filter(p => p.status === 'Atrasado').length, [filteredProjects]);
    
    const availablePartners = useMemo(() => partners.filter(p => p.isAvailable).length, [partners]);
    
    // Novo cálculo de faturamento filtrado por moeda: Somente Mensalidades de Projetos + Mensalidades SaaS (MRR)
    const monthlyRecurringRevenue = useMemo(() => {
        // 1. Soma mensalidades (retainers) apenas dos projetos na moeda selecionada
        const projectRetainers = filteredProjects.reduce((acc, p) => {
            if (p.hasRetainer && p.retainerValue) {
                return acc + Number(p.retainerValue);
            }
            return acc;
        }, 0);

        // 2. Soma faturamento mensal do SaaS apenas na moeda selecionada
        const saasMRR = saasProducts
            .filter(s => s.currency === selectedCurrency)
            .reduce((acc, s) => {
                return acc + s.plans.reduce((planAcc, plan) => planAcc + (Number(plan.price) * Number(plan.customerCount)), 0);
            }, 0);

        return Number((projectRetainers + saasMRR).toFixed(2));
    }, [filteredProjects, saasProducts, selectedCurrency]);

    const formatCurrency = (value: number) => {
        return `${CURRENCY_SYMBOLS[selectedCurrency]} ${value.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    };
    
    const projectsNearingDeadline = useMemo(() => filteredProjects.filter(p => {
        if (p.status === 'Concluído') return false;
        const deadline = new Date(p.endDate);
        const today = new Date();
        const diff = deadline.getTime() - today.getTime();
        return diff > 0 && Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 15;
    }), [filteredProjects]);

  return (
    <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Visão do Negócio</h2>
                <p className="text-[11px] text-slate-400 font-black mt-1 uppercase tracking-[0.3em]">Performance em <span className="text-blue-600">{selectedCurrency}</span></p>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Seletor de Moeda Estilo Pill */}
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
                <div className="hidden sm:block">
                    <span className="text-[10px] font-black bg-slate-900 text-white px-4 py-3 rounded-full uppercase tracking-widest">PLANO {currentPlan}</span>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard title="Clientes Ativos" value={clients.length} subtext="Base total de parceiros" icon={<UsersIcon />} />
            <DashboardCard title={`Recorrência (${selectedCurrency})`} value={formatCurrency(monthlyRecurringRevenue)} subtext="Mensalidades + SaaS" icon={<CurrencyDollarIcon />} color="bg-emerald-50 text-emerald-600" />
            <DashboardCard title="Time de Devs" value={`${availablePartners}/${partners.length}`} subtext="Capacidade de entrega" icon={<BriefcaseIcon />} color="bg-purple-50 text-purple-600" />
            <DashboardCard title="Projetos Atrasados" value={overdueProjectsCount} subtext={`Exige atenção (${selectedCurrency})`} icon={<ExclamationTriangleIcon />} color="bg-red-50 text-red-600" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col h-full min-h-[350px]">
                <h3 className="text-xl font-black mb-6 text-slate-900 uppercase tracking-tighter">Próximas Entregas {selectedCurrency} (15 dias)</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {projectsNearingDeadline.length > 0 ? (
                        <div className="space-y-4">
                            {projectsNearingDeadline.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                                    <span className="text-xs font-black text-slate-700 truncate pr-4">{p.name}</span>
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-widest">ENTREGA EM {new Date(p.endDate).toLocaleDateString('pt-BR')}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 grayscale py-10">
                             <RocketLaunchIcon className="w-12 h-12 mb-4 text-slate-400" />
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum prazo crítico em {selectedCurrency}.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl relative overflow-hidden text-white min-h-[350px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <RocketLaunchIcon className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">Controle de Escala ({selectedCurrency})</h3>
                    <p className="text-slate-400 text-xs mb-8 leading-relaxed max-w-md">
                        Projetos Ativos: <span className="text-white font-bold">{projectsInProgress}</span><br/>
                        Projetos Finalizados: <span className="text-emerald-400 font-bold">{completedProjects}</span><br/>
                        Taxa de conclusão em {selectedCurrency}: <span className="text-blue-400 font-bold">{filteredProjects.length > 0 ? ((completedProjects / filteredProjects.length) * 100).toFixed(0) : 0}%</span>.
                    </p>
                </div>
                <div className="flex flex-wrap gap-4 relative z-10">
                    <button 
                        onClick={() => setActiveView('Projetos')}
                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        Ver Projetos
                    </button>
                    <button 
                        onClick={() => setActiveView('Relatórios')}
                        className="bg-white/10 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                    >
                        Métricas de Saúde
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
