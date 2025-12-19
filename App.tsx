
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
import LeadGen from './components/LeadGen';
import AdminSubscriptionManager from './components/AdminSubscriptionManager';
import LandingPage from './components/LandingPage';
import AdvancedReports from './components/AdvancedReports';
import { DataProvider } from './context/DataContext';
import { RocketLaunchIcon } from './components/Icons';
import type { View, User, Company, BillingCycle } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('Dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonatedCompany, setImpersonatedCompany] = useState<Company | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [showLogin, setShowLogin] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('Starter');
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const storedUser = localStorage.getItem('nexus_current_user');
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
        const user = await api.login(email, pass);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('nexus_current_user', JSON.stringify(user));
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
  };

  const handleRegister = async (userData: any): Promise<void> => {
      await api.register({ 
          ...userData, 
          plan: selectedPlan,
          billingCycle: selectedCycle
      }, userData.companyName);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setImpersonatedCompany(null);
    setActiveView('Dashboard');
    setShowLogin(false);
    localStorage.removeItem('nexus_current_user');
  };

  const handleImpersonate = (company: Company) => {
    setImpersonatedCompany(company);
    setActiveView('Dashboard');
  };

  const handleStopImpersonating = () => {
    setImpersonatedCompany(null);
    setActiveView('Dashboard');
  };
  
  const renderView = () => {
    switch (activeView) {
      case 'Dashboard': return <Dashboard />;
      case 'CRM': return <CRM />;
      case 'Captação': return <LeadGen />;
      case 'Relatórios': return <AdvancedReports />;
      case 'Clientes': return <Clients />;
      case 'Parceiros': return <Partners />;
      case 'Projetos': return <ProjectManager />;
      case 'SaaS': return <SaaS />;
      case 'Financeiro': return <Financials />;
      case 'Empresas': return <Companies onImpersonate={handleImpersonate} />;
      case 'Usuários': return <Users />;
      case 'Configuração': return <Settings />;
      case 'Gerenciar Assinaturas': return <AdminSubscriptionManager />;
      default: return <Dashboard />;
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>;

  if (!currentUser) {
    if (showLogin) {
        return (
            <Login 
                onLogin={handleLogin} 
                onRegister={handleRegister} 
                onBack={() => setShowLogin(false)}
                initialView={authMode}
                selectedPlan={selectedPlan}
                billingCycle={selectedCycle}
            />
        );
    }
    return (
        <LandingPage 
            onEnterApp={(plan, cycle) => {
                if (plan) {
                    setSelectedPlan(plan);
                    if (cycle) setSelectedCycle(cycle);
                    setAuthMode('register');
                } else {
                    setAuthMode('login');
                }
                setShowLogin(true);
            }} 
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
            <header className="xl:hidden bg-[#020617] border-b border-white/10 flex items-center justify-between p-4 sticky top-0 z-30 shadow-md shrink-0">
                <button onClick={() => setIsSidebarOpen(true)} className="text-white p-1 hover:bg-white/10 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <RocketLaunchIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-black text-white uppercase tracking-tighter">NEXUS<span className="text-blue-600">MANAGER</span></span>
                </div>
                <div className="w-8"></div>
            </header>

            {impersonatedCompany && (
                <div className="bg-yellow-500 text-black text-center p-2 font-bold flex justify-center items-center gap-4 shadow-sm z-20 shrink-0">
                    <span className="text-sm">Visualizando como {impersonatedCompany.name}</span>
                    <button onClick={handleStopImpersonating} className="bg-black/20 text-white px-3 py-1 rounded-md text-xs hover:bg-black/40">
                        Voltar para Visão SuperAdmin
                    </button>
                </div>
            )}
            
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 w-full custom-scrollbar">
                <div className="max-w-7xl mx-auto w-full">
                    <div key={activeView}>
                        <ErrorBoundary>
                            {renderView()}
                        </ErrorBoundary>
                    </div>
                </div>
            </main>
        </div>
      </div>
    </DataProvider>
  );
};

export default App;
