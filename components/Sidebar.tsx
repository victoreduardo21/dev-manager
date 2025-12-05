
import React from 'react';
import type { View, User } from '../types';
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

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeView, setActiveView, onLogout, isOpen, onClose }) => {
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

  // Usa o avatar do usuário ou um placeholder padrão
  const userAvatar = currentUser.avatar || `https://i.pravatar.cc/100?u=${currentUser.email}`;

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <nav className={`w-64 h-full bg-primary-dark border-r border-white/10 flex flex-col text-white
        fixed lg:static inset-y-0 left-0 z-40
        transition-transform duration-300 ease-in-out shadow-2xl relative overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
         {/* Efeito de Luz Sutil no Topo */}
         <div className="absolute top-0 left-0 w-full h-32 bg-blue-600/10 blur-[50px] pointer-events-none"></div>

        <div className="p-6 border-b border-white/10 bg-black/10 flex justify-center items-center h-20 relative z-10">
          <h1 className="text-xl font-bold text-white tracking-wide">Nexus <span className="text-blue-400">Manager</span></h1>
        </div>

        <ul className="flex-1 p-3 overflow-y-auto space-y-1 custom-scrollbar relative z-10">
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => handleLinkClick(item.name)}
                className={`w-full flex items-center p-3 rounded-lg text-left transition-all duration-200 font-medium ${
                  activeView === item.name
                    ? 'bg-white text-primary-dark shadow-lg'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`w-5 h-5 mr-3 ${activeView === item.name ? 'text-primary-dark' : 'text-slate-500 group-hover:text-white'}`}>{item.icon}</span>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-white/10 bg-black/20 space-y-4 relative z-10">
          
          <div className="flex items-center">
              <img src={userAvatar} alt="User Avatar" className="w-10 h-10 rounded-full border border-white/20 object-cover" />
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
