
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Partners from './components/Partners';
import ProjectManager from './components/ProjectManager';
import SaaS from './components/SaaS';
import Financials from './components/Financials';
import Users from './components/Users';
import Settings from './components/Settings';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import CRM from './components/CRM';
import Companies from './components/Companies';
import Subscription from './components/Subscription';
import AdminSubscriptionManager from './components/AdminSubscriptionManager';
import LeadGen from './components/LeadGen';
import LandingPage from './components/LandingPage';
import { DataProvider } from './context/DataContext';
import type { View, User, Company, BillingCycle } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('Dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonatedCompany, setImpersonatedCompany] = useState<Company | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para controlar a exibição da Landing Page vs Login
  const [showLanding, setShowLanding] = useState(true);
  
  // Novo estado para armazenar o plano selecionado e o ciclo de cobrança na Landing Page
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('monthly');

  // Tentar restaurar sessão
  useEffect(() => {
    const storedUser = localStorage.getItem('nexus_current_user');
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
        setShowLanding(false); // Se já estiver logado, pula a landing
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
        const user = await api.login(email, pass);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('nexus_current_user', JSON.stringify(user));
            setShowLanding(false); // Garante que a landing não volte após login
            return true;
        }
        return false;
    } catch (error) {
        console.error(error);
        return false;
    }
  };

  const handleRegister = async (userData: { companyName: string; name: string; email: string; phone: string; cpf: string; password: string, plan?: string, billingCycle?: BillingCycle }): Promise<void> => {
      // Chama o backend para criar empresa e usuário
      // Nota: Incluímos o plano e ciclo nos dados
      await api.register(userData, userData.companyName);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setImpersonatedCompany(null);
    setActiveView('Dashboard');
    localStorage.removeItem('nexus_current_user');
    setShowLanding(true); // Volta para a landing page ao sair
    setSelectedPlan(null);
  };

  const handleImpersonate = (company: Company) => {
    setImpersonatedCompany(company);
    setActiveView('Dashboard');
  };

  const handleStopImpersonating = () => {
    setImpersonatedCompany(null);
    setActiveView('Dashboard');
  };
  
  // Função chamada quando o usuário clica em "Começar" ou escolhe um plano na Landing Page
  const handleEnterApp = (plan?: string, cycle: BillingCycle = 'monthly') => {
      if (plan) {
          setSelectedPlan(plan);
          setSelectedBillingCycle(cycle);
      } else {
          setSelectedPlan(null); // Login normal sem plano selecionado
      }
      setShowLanding(false);
  };
  
  const renderView = () => {
    switch (activeView) {
      case 'Dashboard': return <Dashboard />;
      case 'CRM': return <CRM />;
      case 'Captação': return <LeadGen />;
      case 'Clientes': return <Clients />;
      case 'Parceiros': return <Partners />;
      case 'Projetos': return <ProjectManager />;
      // Case 'Sites' removed
      case 'SaaS': return <SaaS />;
      case 'Financeiro': return <Financials />;
      case 'Empresas': return <Companies onImpersonate={handleImpersonate} />;
      case 'Usuários': return <Users />;
      case 'Configuração': return <Settings />;
      case 'Assinatura': return <Subscription />;
      case 'Gerenciar Assinaturas': return <AdminSubscriptionManager />;
      default: return <Dashboard />;
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>;

  if (!currentUser) {
    if (showLanding) {
        return <LandingPage onEnterApp={handleEnterApp} />;
    }
    return (
        <Login 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
            onBack={() => setShowLanding(true)} 
            selectedPlan={selectedPlan} // Passa o plano selecionado para o Login
            selectedBillingCycle={selectedBillingCycle}
        />
    );
  }

  return (
    <DataProvider
        currentUser={currentUser}
        impersonatedCompany={impersonatedCompany}
        setActiveView={setActiveView}
    >
      <div className="flex h-[100dvh] bg-slate-100 text-text-primary overflow-hidden">
        <Sidebar 
            currentUser={currentUser} 
            activeView={activeView} 
            setActiveView={setActiveView} 
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
            {/* Header com Menu Hamburger - Visível em telas < XL (Tablets e Mobile) */}
            <header className="xl:hidden bg-[#020617] border-b border-white/10 flex items-center justify-between p-4 sticky top-0 z-30 shadow-md shrink-0">
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="text-white p-1 hover:bg-white/10 rounded focus:outline-none"
                    aria-label="Abrir Menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white truncate px-2">{activeView}</h1>
                <div className="w-8">
                     {/* Espaço reservado para balancear o layout do header */}
                </div>
            </header>

            {impersonatedCompany && (
                <div className="bg-yellow-500 text-black text-center p-2 font-bold flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 shadow-sm z-20 shrink-0">
                    <span className="text-sm">Visualizando como {impersonatedCompany.name}</span>
                    <button onClick={handleStopImpersonating} className="bg-black/20 text-white px-3 py-1 rounded-md text-xs hover:bg-black/40 whitespace-nowrap">
                        Voltar para Visão SuperAdmin
                    </button>
                </div>
            )}
            
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 w-full custom-scrollbar">
                <div className="max-w-7xl mx-auto w-full">
                    <ErrorBoundary key={activeView}>
                        {renderView()}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
      </div>
    </DataProvider>
  );
};

export default App;
