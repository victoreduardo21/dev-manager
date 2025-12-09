
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


  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <nav className={`w-64 h-full bg-surface/50 backdrop-blur-sm border-r border-white/10 flex flex-col
        fixed lg:static inset-y-0 left-0 z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-white/10 text-center">
          <h1 className="text-2xl font-bold text-primary">Nexus Dash</h1>
        </div>
        <ul className="flex-1 p-2 overflow-y-auto">
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => handleLinkClick(item.name)}
                className={`w-full flex items-center p-3 my-1 rounded-lg text-left transition-colors duration-200 ${
                  activeView === item.name
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-text-secondary hover:bg-white/10'
                }`}
              >
                <span className="w-6 h-6 mr-3">{item.icon}</span>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center mb-4">
              <img src={`https://i.pravatar.cc/40?u=${currentUser.email}`} alt="User Avatar" className="w-10 h-10 rounded-full" />
              <div className="ml-3 overflow-hidden">
                  <p className="font-semibold text-text-primary truncate">{currentUser.name}</p>
                  <p className="text-sm text-text-secondary truncate">{currentUser.email}</p>
              </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center p-2 rounded-lg text-left transition-colors duration-200 bg-danger/20 text-danger hover:bg-danger/40"
          >
            <LogoutIcon />
            <span className="ml-2">Sair</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
