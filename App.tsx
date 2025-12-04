import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Partners from './components/Partners';
import ProjectManager from './components/ProjectManager'; // Using the new unified component
import SaaS from './components/SaaS';
import Financials from './components/Financials';
import Users from './components/Users';
import Settings from './components/Settings';
import Login from './components/Login';
import Subscription from './components/Subscription';
import ErrorBoundary from './components/ErrorBoundary';
import CRM from './components/CRM';
import LeadGen from './components/LeadGen';
import Companies from './components/Companies';
import AdminSubscriptionManager from './components/AdminSubscriptionManager';
import { DataProvider } from './context/DataContext';
import type { View, User, Company } from './types';
import { mockUsers } from './data/mockData';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('Dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonatedCompany, setImpersonatedCompany] = useState<Company | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localUsers, setLocalUsers] = useState<User[]>(mockUsers);

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    // Check against localUsers which includes both mock and newly registered
    const user = localUsers.find(u => u.email === email && u.password === pass);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const handleRegister = async (userData: { name: string; email: string; phone: string; cpf: string; password: string }): Promise<void> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const newUser: User = {
          id: `user-${Date.now()}`,
          companyId: `comp-self-${Date.now()}`, // Auto-create a company ID for the new user
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: 'Admin', // Default role for new signups
          phone: userData.phone,
          cpf: userData.cpf
      };

      setLocalUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setImpersonatedCompany(null);
    setActiveView('Dashboard');
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
      case 'Clientes': return <Clients />;
      case 'Parceiros': return <Partners />;
      case 'Projetos': return <ProjectManager projectType="Project" />;
      case 'Sites': return <ProjectManager projectType="Site" />;
      case 'SaaS': return <SaaS />;
      case 'Financeiro': return <Financials />;
      case 'Assinatura': return <Subscription />;
      case 'Empresas': return <Companies onImpersonate={handleImpersonate} />;
      case 'Gerenciar Assinaturas': return <AdminSubscriptionManager />;
      case 'Usuários': return <Users />;
      case 'Configuração': return <Settings />;
      default: return <Dashboard />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <DataProvider
        currentUser={currentUser}
        impersonatedCompany={impersonatedCompany}
        setActiveView={setActiveView}
    >
      <div className="flex h-screen bg-slate-100 text-text-primary">
        <Sidebar 
            currentUser={currentUser} 
            activeView={activeView} 
            setActiveView={setActiveView} 
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="lg:hidden bg-slate-900 border-b border-white/10 flex items-center justify-between p-4 sticky top-0 z-20 shadow-md">
                <button onClick={() => setIsSidebarOpen(true)} className="text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h1 className="text-xl font-bold text-white">{activeView}</h1>
                <div className="w-6"></div>
            </header>

            {impersonatedCompany && (
                <div className="bg-yellow-500 text-black text-center p-2 font-bold flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 shadow-sm z-10">
                    <span>Visualizando como {impersonatedCompany.name}</span>
                    <button onClick={handleStopImpersonating} className="bg-black/20 text-white px-3 py-1 rounded-md text-sm hover:bg-black/40">
                        Voltar para Visão SuperAdmin
                    </button>
                </div>
            )}
            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-50">
                <ErrorBoundary key={activeView}>
                    {renderView()}
                </ErrorBoundary>
            </main>
        </div>
      </div>
    </DataProvider>
  );
};

export default App;