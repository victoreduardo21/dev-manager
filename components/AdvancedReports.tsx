
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { CURRENCY_SYMBOLS } from '../constants';
import { 
    ChartBarIcon, FunnelIcon, FolderIcon, CurrencyDollarIcon, 
    CheckBadgeIcon, UsersIcon, RocketLaunchIcon, BriefcaseIcon,
    ExclamationTriangleIcon
} from './Icons';

const ReportKPI: React.FC<{ title: string; value: string | number; subtext: string; icon: React.ReactNode; color: string }> = ({ title, value, subtext, icon, color }) => (
    <div className="bg-surface p-6 rounded-lg border border-white/10 shadow-lg flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-')}/20 ${color}`}>
                {icon}
            </div>
            <span className="text-2xl font-bold text-text-primary">{value}</span>
        </div>
        <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-xs text-text-secondary/60 mt-1">{subtext}</p>
        </div>
    </div>
);

const AdvancedReports: React.FC = () => {
    const { leads, projects, clients, saasProducts, partners } = useData();

    const stats = useMemo(() => {
        // CRM Stats
        const totalLeads = leads.length;
        const wonLeads = leads.filter(l => l.status === 'Ganho').length;
        const lostLeads = leads.filter(l => l.status === 'Perdido').length;
        const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";

        // Project Stats
        const totalProjectValue = projects.reduce((acc, p) => acc + p.value, 0);
        const avgTicket = projects.length > 0 ? (totalProjectValue / projects.length).toFixed(2) : "0.00";
        const completedProjects = projects.filter(p => p.status === 'Concluído').length;
        const efficiency = projects.length > 0 ? ((completedProjects / projects.length) * 100).toFixed(0) : "0";

        // Category Breakdown
        const categories = projects.reduce((acc: any, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});

        // Revenue Breakdown (Projects vs SaaS)
        const projectRevenue = projects.reduce((acc, p) => {
            const paid = p.payments.filter(pay => pay.status === 'Pago').reduce((sum, pay) => sum + pay.amount, 0);
            return acc + paid;
        }, 0);

        const saasMRR = saasProducts.reduce((acc, s) => {
            return acc + s.plans.reduce((planAcc, plan) => planAcc + (plan.price * plan.customerCount), 0);
        }, 0);

        // Top Clients
        const clientRevenueMap = projects.reduce((acc: any, p) => {
            const client = clients.find(c => c.id === p.clientId);
            const name = client ? client.companyName : 'Outros';
            acc[name] = (acc[name] || 0) + p.value;
            return acc;
        }, {});

        const topClients = Object.entries(clientRevenueMap)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 5);

        return {
            conversionRate,
            avgTicket,
            efficiency,
            categories,
            projectRevenue,
            saasMRR,
            topClients,
            totalLeads,
            lostLeads,
            totalProjects: projects.length
        };
    }, [leads, projects, clients, saasProducts]);

    const funnelStages = [
        { name: 'Novo', color: 'from-blue-600 to-blue-400', width: 'w-full' },
        { name: 'Contatado', color: 'from-blue-500 to-indigo-500', width: 'w-[90%]' },
        { name: 'Qualificado', color: 'from-indigo-500 to-violet-500', width: 'w-[80%]' },
        { name: 'Proposta', color: 'from-violet-500 to-purple-500', width: 'w-[70%]' },
        { name: 'Ganho', color: 'from-emerald-500 to-green-400', width: 'w-[60%]' }
    ];

    const formatBRL = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h2 className="text-3xl font-bold text-text-primary">Relatórios Avançados</h2>
                <p className="text-text-secondary">Indicadores estratégicos de performance e saúde do negócio.</p>
            </div>

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReportKPI 
                    title="Conversão Final" 
                    value={`${stats.conversionRate}%`} 
                    subtext="Total de ganhos sobre entrada" 
                    icon={<FunnelIcon className="w-6 h-6" />} 
                    color="text-blue-400"
                />
                <ReportKPI 
                    title="Ticket Médio" 
                    value={formatBRL(Number(stats.avgTicket))} 
                    subtext="Baseado em projetos" 
                    icon={<CurrencyDollarIcon className="w-6 h-6" />} 
                    color="text-emerald-400"
                />
                <ReportKPI 
                    title="Taxa de Perda" 
                    value={`${stats.totalLeads > 0 ? ((stats.lostLeads / stats.totalLeads) * 100).toFixed(1) : 0}%`} 
                    subtext="Leads marcados como Perdidos" 
                    icon={<ExclamationTriangleIcon className="w-6 h-6" />} 
                    color="text-red-400"
                />
                <ReportKPI 
                    title="MRR Consolidado" 
                    value={formatBRL(stats.saasMRR)} 
                    subtext="Receita de Recorrência" 
                    icon={<RocketLaunchIcon className="w-6 h-6" />} 
                    color="text-amber-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Funil de Vendas Realista */}
                <div className="bg-surface p-8 rounded-lg border border-white/10 shadow-lg">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <FunnelIcon className="w-5 h-5 text-blue-400" /> Funil de Conversão
                        </h3>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Base de Leads</p>
                            <p className="text-lg font-black text-primary">{stats.totalLeads}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                        {funnelStages.map((stage, idx) => {
                            const count = leads.filter(l => l.status === stage.name).length;
                            const prevStageCount = idx === 0 ? stats.totalLeads : leads.filter(l => l.status === funnelStages[idx-1].name).length;
                            const dropRate = prevStageCount > 0 ? ((count / prevStageCount) * 100).toFixed(0) : 0;
                            
                            return (
                                <div key={stage.name} className="w-full flex flex-col items-center">
                                    <div className={`relative ${stage.width} h-14 bg-gradient-to-r ${stage.color} rounded-lg shadow-lg flex items-center justify-between px-6 transition-all hover:scale-[1.02] cursor-default border border-white/10 group`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black bg-black/20 w-5 h-5 rounded-full flex items-center justify-center text-white/80">{idx + 1}</span>
                                            <span className="text-xs font-black text-white uppercase tracking-tighter">{stage.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-white">{count}</span>
                                            {idx > 0 && (
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded font-bold pointer-events-none whitespace-nowrap z-20">
                                                    Retenção: {dropRate}% da etapa anterior
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {idx < funnelStages.length - 1 && (
                                        <div className="h-4 w-px bg-white/10 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Categorias de Projetos */}
                <div className="bg-surface p-6 rounded-lg border border-white/10 shadow-lg">
                    <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                        <FolderIcon className="w-5 h-5 text-indigo-400" /> Mix de Projetos
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(stats.categories).map(([cat, count]: any) => (
                            <div key={cat} className="p-4 bg-background/50 rounded-lg border border-white/5 flex items-center justify-between group hover:border-primary/50 transition-colors">
                                <div>
                                    <p className="text-xs text-text-secondary uppercase font-bold tracking-wider">{cat}</p>
                                    <p className="text-2xl font-bold text-text-primary">{count}</p>
                                </div>
                                <div className={`w-2 h-10 rounded-full transition-all group-hover:h-12 ${cat === 'Site' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                            </div>
                        ))}
                        {Object.keys(stats.categories).length === 0 && (
                            <p className="col-span-2 text-center py-10 text-text-secondary opacity-50 italic">Sem projetos registrados.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Composição de Receita */}
                <div className="lg:col-span-1 bg-surface p-6 rounded-lg border border-white/10 shadow-lg">
                    <h3 className="text-xl font-bold text-text-primary mb-6">Origem do Faturamento</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-text-secondary">Projetos Atuais</span>
                                <span className="text-text-primary font-bold">{formatBRL(stats.projectRevenue)}</span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full">
                                <div className="bg-blue-500 h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-text-secondary">Recorrência SaaS</span>
                                <span className="text-text-primary font-bold">{formatBRL(stats.saasMRR)}</span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full">
                                <div className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: '40%' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-xs text-text-secondary leading-relaxed italic">
                            Dica: Para maior estabilidade financeira, seu objetivo deve ser manter a <span className="text-emerald-400 font-bold">Recorrência</span> acima de 50% do faturamento total.
                        </p>
                    </div>
                </div>

                {/* Top Clientes */}
                <div className="lg:col-span-2 bg-surface p-6 rounded-lg border border-white/10 shadow-lg">
                    <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-amber-400" /> Maiores Clientes (LTV)
                    </h3>
                    <div className="overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-black/20 text-xs font-bold text-text-secondary uppercase">
                                <tr>
                                    <th className="p-3">Cliente</th>
                                    <th className="p-3 text-right">Volume Total</th>
                                    <th className="p-3 text-right">Share</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-white/5">
                                {stats.topClients.map(([name, val]: any, idx) => {
                                    const totalValue = projects.reduce((acc, p) => acc + p.value, 1);
                                    const share = ((val / totalValue) * 100).toFixed(1);
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-3 text-text-primary font-medium">{name}</td>
                                            <td className="p-3 text-right text-text-primary font-mono">{formatBRL(val)}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="text-[10px] font-bold text-text-secondary">{share}%</span>
                                                    <div className="w-20 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-amber-500 h-full group-hover:bg-amber-400 transition-colors" style={{ width: `${share}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {stats.topClients.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-10 text-center text-text-secondary opacity-50">Sem dados financeiros suficientes para exibir o ranking.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedReports;
