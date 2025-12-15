
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
      {/* Backdrop for mobile */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <nav className={`w-64 h-full bg-[#020617] border-r border-white/10 flex flex-col
        fixed lg:static inset-y-0 left-0 z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-white/10 text-center">
          <h1 className="text-2xl font-bold text-white">Nexus Dash</h1>
        </div>
        <ul className="flex-1 p-2 overflow-y-auto">
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => handleLinkClick(item.name)}
                className={`w-full flex items-center p-3 my-1 rounded-lg text-left transition-colors duration-200 ${
                  activeView === item.name
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border border-white/10 shadow-sm shrink-0">
                  {getInitials(currentUser.name)}
              </div>
              <div className="ml-3 overflow-hidden">
                  <p className="font-semibold text-white truncate">{currentUser.name}</p>
                  <p className="text-sm text-slate-400 truncate">{currentUser.email}</p>
              </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center p-2 rounded-lg text-left transition-colors duration-200 bg-red-500/10 text-red-400 hover:bg-red-500/20"
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
