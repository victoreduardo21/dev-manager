
import React from 'react';
import type { Project, Site } from '../types';
import { CURRENCY_SYMBOLS } from '../constants';
import { useData } from '../context/DataContext';
import { UsersIcon, FolderIcon, BriefcaseIcon, CurrencyDollarIcon, CheckBadgeIcon } from './Icons';

// Fix: Correctly type the icon prop to allow className to be passed via React.cloneElement.
const DashboardCard: React.FC<{ title: string; value: string | number; subtext?: string; icon: React.ReactElement<{ className?: string }>;}> = ({ title, value, subtext, icon }) => (
    <div className="bg-surface p-6 rounded-lg shadow-lg flex items-center border border-white/10">
        <div className="bg-primary/20 p-3 rounded-full mr-4 text-primary">
            {React.cloneElement(icon, { className: 'h-6 w-6' })}
        </div>
        <div>
            <p className="text-sm text-text-secondary font-medium">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            {subtext && <p className="text-xs text-text-secondary">{subtext}</p>}
        </div>
    </div>
);

const SubscriptionAlert: React.FC = () => {
    const { currentUser, companies, setActiveView } = useData();
    if (currentUser?.role === 'SuperAdmin') return null;

    const myCompany = companies.find(c => c.id === currentUser?.companyId);
    if (!myCompany) return null;

    const isOverdue = new Date(myCompany.subscriptionDueDate) < new Date() && myCompany.subscriptionStatus === 'Ativa';

    if (!isOverdue) return null;

    return (
        <div className="bg-red-500/20 border border-danger p-4 rounded-lg mb-6 flex items-center justify-between">
            <div>
                <h4 className="font-bold text-danger">Assinatura Vencida</h4>
                <p className="text-text-secondary text-sm">Sua assinatura venceu em {new Date(myCompany.subscriptionDueDate).toLocaleDateString('pt-BR')}. Por favor, regularize para não perder o acesso.</p>
            </div>
            <button
                onClick={() => setActiveView('Assinatura')}
                className="bg-danger text-white px-4 py-2 rounded-lg shadow-md hover:bg-danger/90 transition-colors"
            >
                Pagar Agora
            </button>
        </div>
    )
}

const Dashboard: React.FC = () => {
    const { projects, sites, clients, partners, saasProducts, setActiveView } = useData();
    
    const allProjects = [...projects, ...sites];
    const projectsInProgress = allProjects.filter(p => p.status === 'Em Andamento').length;
    const completedProjects = allProjects.filter(p => p.status === 'Concluído').length;
    const availablePartners = partners.filter(p => p.isAvailable).length;
    
    const monthlyRecurringRevenue = allProjects.reduce((acc, p) => {
        if (p.hasRetainer && p.retainerValue) {
            return acc + p.retainerValue;
        }
        return acc;
    }, 0) + saasProducts.reduce((acc, s) => {
        return acc + s.plans.reduce((planAcc, plan) => planAcc + (plan.price * plan.customerCount), 0);
    }, 0);

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
    <div>
        <SubscriptionAlert />
        
        <h2 className="text-3xl font-bold mb-6 text-text-primary">Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            <DashboardCard title="Total de Clientes" value={clients.length} icon={<UsersIcon />} />
            <DashboardCard title="Projetos em Andamento" value={projectsInProgress} icon={<FolderIcon />} />
            <DashboardCard title="Projetos Concluídos" value={completedProjects} icon={<CheckBadgeIcon />} />
            <DashboardCard title="Parceiros Disponíveis" value={`${availablePartners} / ${partners.length}`} icon={<BriefcaseIcon />} />
            <DashboardCard title="Faturamento Mensal" value={formatCurrency(monthlyRecurringRevenue)} subtext="Recorrência + SaaS" icon={<CurrencyDollarIcon />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface p-6 rounded-lg shadow-lg border border-white/10">
                <h3 className="text-xl font-semibold mb-4 text-text-primary">Projetos Próximos da Entrega</h3>
                {projectsNearingDeadline.length > 0 ? (
                    <ul className="divide-y divide-white/10">
                        {projectsNearingDeadline.map(p => (
                            <li key={p.id} className="flex justify-between items-center py-3">
                                <span className="text-text-primary">{p.name}</span>
                                <span className="text-sm font-medium text-yellow-400">{new Date(p.endDate).toLocaleDateString('pt-BR')}</span>
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
                                <span className="text-text-primary">{p.name}</span>
                                <span className="text-sm font-medium text-danger">{new Date(p.endDate).toLocaleDateString('pt-BR')}</span>
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
