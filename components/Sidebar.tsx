
import React from 'react';
import type { View, User } from '../types';
import { useData } from '../context/DataContext';
import { 
  HomeIcon, UsersIcon, BriefcaseIcon, FolderIcon, GlobeAltIcon, 
  CloudIcon, CurrencyDollarIcon, CreditCardIcon, BuildingOfficeIcon, 
  UserPlusIcon, Cog6ToothIcon, LogoutIcon, FunnelIcon, MapPinIcon 
} from './Icons';

interface SidebarProps {
  currentUser: User; 
  activeView: View;
  setActiveView: (view: View) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser: propUser, activeView, setActiveView, onLogout, isOpen, onClose }) => {
  const { currentUser: contextUser } = useData();
  const currentUser = contextUser || propUser;

  const allNavItems: { name: View; icon: React.ReactElement; adminOnly?: boolean; superAdminHidden?: boolean }[] = [
    { name: 'Dashboard', icon: <HomeIcon /> },
    { name: 'CRM', icon: <FunnelIcon /> },
    { name: 'Captação', icon: <MapPinIcon /> },
    { name: 'Clientes', icon: <UsersIcon /> },
    { name: 'Parceiros', icon: <BriefcaseIcon /> },
    { name: 'Projetos', icon: <FolderIcon /> },
    { name: 'Sites', icon: <GlobeAltIcon /> },
    { name: 'SaaS', icon: <CloudIcon /> },
    { name: 'Financeiro', icon: <CurrencyDollarIcon /> },
    { name: 'Assinatura', icon: <CreditCardIcon />, superAdminHidden: true },
    { name: 'Empresas', icon: <BuildingOfficeIcon />, adminOnly: true },
    { name: 'Gerenciar Assinaturas', icon: <CreditCardIcon />, adminOnly: true },
    { name: 'Usuários', icon: <UserPlusIcon /> },
    { name: 'Configuração', icon: <Cog6ToothIcon /> },
  ];

  const navItems = allNavItems.filter(item => 
    (!item.adminOnly || currentUser.role === 'SuperAdmin') &&
    (!item.superAdminHidden || currentUser.role !== 'SuperAdmin')
  );

  const handleLinkClick = (view: View) => {
    setActiveView(view);
    onClose(); // Close sidebar on mobile after navigation
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* Backdrop for mobile - Visible on screens smaller than XL */}
      <div 
        className={`xl:hidden fixed inset-0 bg-black/80 z-40 transition-opacity duration-300 backdrop-blur-sm ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar - Fixed on mobile, Static on XL+ */}
      <nav className={`w-72 h-full bg-[#020617] border-r border-white/10 flex flex-col text-white
        fixed xl:static inset-y-0 left-0 z-50
        transition-transform duration-300 ease-in-out shadow-2xl overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
      `}>
         {/* Efeito de Luz Sutil no Topo */}
         <div className="absolute top-0 left-0 w-full h-32 bg-blue-600/10 blur-[50px] pointer-events-none"></div>

        <div className="p-6 border-b border-white/10 bg-black/10 flex items-center justify-between h-20 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 min-w-[32px] bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide whitespace-nowrap">Nexus <span className="text-blue-400">Manager</span></h1>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="xl:hidden p-1 text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="flex-1 p-3 overflow-y-auto space-y-1 custom-scrollbar relative z-10">
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => handleLinkClick(item.name)}
                className={`w-full flex items-center p-3 rounded-lg text-left transition-all duration-200 font-medium ${
                  activeView === item.name
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`w-5 h-5 mr-3 ${activeView === item.name ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>{item.icon}</span>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-white/10 bg-black/20 space-y-4 relative z-10">
          
          <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border border-white/20 text-white font-bold text-sm shadow-lg shrink-0">
                {getInitials(currentUser.name)}
              </div>
              <div className="ml-3 overflow-hidden">
                  <p className="font-semibold text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
              </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center p-2 rounded-lg text-left transition-colors duration-200 bg-red-500/10 text-red-200 hover:bg-red-500/20 border border-red-500/10"
          >
            <LogoutIcon />
            <span className="ml-2 text-sm font-medium">Sair do Sistema</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
