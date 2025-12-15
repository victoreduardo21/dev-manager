
import React from 'react';
import { CURRENCY_SYMBOLS } from '../constants';
import { useData } from '../context/DataContext';
import { UsersIcon, FolderIcon, BriefcaseIcon, CurrencyDollarIcon, CheckBadgeIcon, RocketLaunchIcon } from './Icons';
import UpgradeModal from './UpgradeModal';
import type { Company } from '../types';

// Fix: Correctly type the icon prop to allow className to be passed via React.cloneElement.
const DashboardCard: React.FC<{ title: string; value: string | number; subtext?: string; icon: React.ReactElement<{ className?: string }>;}> = ({ title, value, subtext, icon }) => (
    <div className="bg-surface p-6 rounded-lg shadow-lg flex items-center border border-white/10 w-full">
        <div className="bg-primary/20 p-3 rounded-full mr-4 text-primary shrink-0">
            {React.cloneElement(icon, { className: 'h-6 w-6' })}
        </div>
        <div className="overflow-hidden">
            <p className="text-sm text-text-secondary font-medium truncate">{title}</p>
            <p className="text-2xl font-bold text-text-primary truncate">{value}</p>
            {subtext && <p className="text-xs text-text-secondary truncate">{subtext}</p>}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { projects, clients, partners, saasProducts, currentUser, companies, setActiveView, openModal, closeModal, updateCompany } = useData();
    
    // Find User's Company Plan
    const myCompany = companies.find(c => c.id === currentUser?.companyId);
    const currentPlan = myCompany?.plan || 'PRO';

    // projects now contains both Sites and Projects
    const allProjects = projects;
    
    const projectsInProgress = allProjects.filter(p => p.status === 'Em Andamento').length;
    const completedProjects = allProjects.filter(p => p.status === 'Concluído').length;
    const availablePartners = partners.filter(p => p.isAvailable).length;
    
    // Fix: Ensure correct summation of float numbers
    const monthlyRecurringRevenue = Number((
        allProjects.reduce((acc, p) => {
            if (p.hasRetainer && p.retainerValue) {
                return acc + Number(p.retainerValue);
            }
            return acc;
        }, 0) + 
        saasProducts.reduce((acc, s) => {
            return acc + s.plans.reduce((planAcc, plan) => planAcc + (plan.price * plan.customerCount), 0);
        }, 0)
    ).toFixed(2));

    const formatCurrency = (value: number) => {
        return `${CURRENCY_SYMBOLS.BRL} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    
    const isNearingDeadline = (endDate: string) => {
        const deadline = new Date(endDate);
        const today = new Date();
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 15;
    };
    
    const projectsNearingDeadline = allProjects.filter(p => isNearingDeadline(p.endDate));
    const overdueProjects = allProjects.filter(p => p.status === 'Atrasado');

  return (
    <div className="space-y-8">
        <h2 className="text-3xl font-bold text-text-primary">Visão Geral</h2>
        
        {/* Adjusted Grid for better mobile wrapping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <DashboardCard title="Total de Clientes" value={clients.length} icon={<UsersIcon />} />
            <DashboardCard title="Em Andamento" value={projectsInProgress} icon={<FolderIcon />} />
            <DashboardCard title="Concluídos" value={completedProjects} icon={<CheckBadgeIcon />} />
            <DashboardCard title="Parceiros Disp." value={`${availablePartners} / ${partners.length}`} icon={<BriefcaseIcon />} />
            <DashboardCard title="Faturamento Mensal" value={formatCurrency(monthlyRecurringRevenue)} subtext="Recorrência + SaaS" icon={<CurrencyDollarIcon />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-surface p-6 rounded-lg shadow-lg border border-white/10">
                <h3 className="text-xl font-semibold mb-4 text-text-primary">Prazos Próximos</h3>
                {projectsNearingDeadline.length > 0 ? (
                    <ul className="divide-y divide-white/10">
                        {projectsNearingDeadline.map(p => (
                            <li key={p.id} className="flex justify-between items-center py-3">
                                <span className="text-text-primary truncate pr-4">{p.name}</span>
                                <span className="text-sm font-medium text-yellow-400 whitespace-nowrap">{new Date(p.endDate).toLocaleDateString('pt-BR')}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-text-secondary">Nenhum projeto próximo do prazo.</p>
                )}
            </div>
            <div className="bg-surface p-6 rounded-lg shadow-lg border border-white/10">
                <h3 className="text-xl font-semibold mb-4 text-text-primary">Projetos Atrasados</h3>
                {overdueProjects.length > 0 ? (
                     <ul className="divide-y divide-white/10">
                        {overdueProjects.map(p => (
                            <li key={p.id} className="flex justify-between items-center py-3">
                                <span className="text-text-primary truncate pr-4">{p.name}</span>
                                <span className="text-sm font-medium text-danger whitespace-nowrap">{new Date(p.endDate).toLocaleDateString('pt-BR')}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                     <p className="text-text-secondary">Nenhum projeto atrasado.</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
