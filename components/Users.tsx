

import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { useData } from '../context/DataContext';

const UserForm: React.FC<{ 
    onSave: (user: Omit<User, 'id'> | User) => Promise<void>; 
    initialData?: User;
}> = ({ onSave, initialData }) => {
    const { activeCompanyName, activeCompanyId, currentUser, companies } = useData();
    const [name, setName] = useState(initialData?.name || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [password, setPassword] = useState(''); // Senha vazia por padrão
    const [role, setRole] = useState<'Admin' | 'User'>(initialData?.role === 'Admin' ? 'Admin' : 'User');
    
    // Logic for company selection (SuperAdmin only)
    const [selectedCompanyId, setSelectedCompanyId] = useState(initialData?.companyId || (currentUser?.role === 'SuperAdmin' && !initialData ? '' : ''));
    
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Initial value for SuperAdmin when creating new user (default to first available or none)
    useEffect(() => {
        if (!initialData && currentUser?.role === 'SuperAdmin' && !selectedCompanyId && companies.length > 0) {
             // Optional: Default to first company or keep empty to force selection
             setSelectedCompanyId(companies[0].id);
        }
    }, [initialData, currentUser, companies]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            setError('Nome e Email são obrigatórios.');
            return;
        }
        
        // Validation for SuperAdmin
        let finalCompanyId = selectedCompanyId;
        if (currentUser?.role === 'SuperAdmin' && !finalCompanyId && !initialData) {
            setError('Por favor, selecione uma empresa para este usuário.');
            return;
        }
        
        // If not SuperAdmin, or if editing and locked, use existing context/data
        if (currentUser?.role !== 'SuperAdmin') {
            finalCompanyId = initialData?.companyId || (activeCompanyId as string);
        }

        setIsSaving(true);
        
        const userData: any = { name, email, role, companyId: finalCompanyId };
        
        // Só adiciona a senha se ela foi preenchida
        if (password.trim()) {
            userData.password = password;
        }

        if (initialData) {
            await onSave({ ...initialData, ...userData });
        } else {
            await onSave(userData);
        }
    };

    // Determine displayed company name
    const getCompanyName = (id?: string) => {
        if (!id) return '';
        const found = companies.find(c => c.id === id);
        if (found) return found.name;
        // Se não encontrar pelo ID, assume que o ID pode ser o próprio nome (caso de registros simples)
        return id;
    };

    const displayCompanyName = initialData 
        ? getCompanyName(initialData.companyId)
        : activeCompanyName;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            {/* Campo de referência da empresa */}
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Empresa Vinculada</label>
                {currentUser?.role === 'SuperAdmin' ? (
                    <select 
                        value={selectedCompanyId} 
                        onChange={e => setSelectedCompanyId(e.target.value)}
                        className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-text-primary"
                        disabled={!!initialData} // Lock company change on edit if preferred, or remove disabled to allow move
                    >
                         <option value="" disabled>Selecione uma empresa</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                ) : (
                    <input 
                        type="text" 
                        value={displayCompanyName} 
                        disabled 
                        className="w-full px-3 py-2 bg-background/30 border border-white/10 rounded-md text-text-secondary cursor-not-allowed italic" 
                    />
                )}
                {currentUser?.role === 'SuperAdmin' && initialData && <p className="text-xs text-text-secondary mt-1">A empresa não pode ser alterada após a criação.</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo</label>
                <input type="text" placeholder="Ex: João Silva" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email Corporativo</label>
                <input type="email" placeholder="nome@empresa.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Senha de Acesso</label>
                <input 
                    type="text" 
                    placeholder={initialData ? "Deixe vazio para manter a senha atual" : "Digite uma senha ou deixe vazio para gerar auto"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" 
                />
                {!password && !initialData && <p className="text-xs text-text-secondary mt-1">Uma senha aleatória será gerada se este campo ficar vazio.</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Permissão de Acesso</label>
                <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary focus:border-primary">
                    <option value="User">Membro da Equipe (Acesso Padrão)</option>
                    <option value="Admin">Administrador (Gestão Total)</option>
                </select>
            </div>

            <div className="text-right pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Salvando...' : (initialData ? 'Atualizar Membro' : 'Salvar Membro')}
                </button>
            </div>
        </form>
    );
};

const UserCard: React.FC<{ user: User; onEdit: (user: User) => void; }> = ({ user, onEdit }) => {
    const { companies } = useData();
    // Tenta encontrar o nome pelo ID, se não encontrar, usa o ID como nome (fallback para registros simples)
    const userCompany = companies.find(c => c.id === user.companyId)?.name || user.companyId;

    const getInitials = (name: string) => {
        return name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
    };

    return (
      <div className="bg-surface rounded-lg shadow-lg border border-white/10 p-5">
        <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg border border-white/10">
                {getInitials(user.name)}
             </div>
             <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-text-primary truncate">{user.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${user.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-500/20 text-gray-300'}`}>
                        {user.role === 'Admin' ? 'Admin' : 'Membro'}
                    </span>
                </div>
                <p className="text-sm text-text-secondary truncate">{user.email}</p>
                {userCompany && <p className="text-xs text-primary/70 mt-1 truncate">{userCompany}</p>}
             </div>
        </div>
         <div className="mt-4 pt-4 border-t border-white/10 text-right">
            <button onClick={() => onEdit(user)} className="text-sm font-medium text-primary hover:underline">Editar</button>
        </div>
      </div>
    );
};

const Users: React.FC = () => {
  const { users, addUser, updateUser, openModal, activeCompanyName } = useData();
  
  const handleAddClick = () => {
    openModal(`Adicionar Membro`, <UserForm onSave={addUser} />);
  };

  const handleEditClick = (user: User) => {
    openModal(`Editar Membro`, <UserForm onSave={updateUser} initialData={user} />);
  };
    
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-primary">
            Usuários: <span className="text-primary">{activeCompanyName}</span>
        </h2>
        <button onClick={handleAddClick} className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors">
          Adicionar Membro
        </button>
      </div>
      {users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.filter(u => u.role !== 'SuperAdmin').map((user) => (
            <UserCard key={user.id} user={user} onEdit={handleEditClick} />
            ))}
        </div>
       ) : (
         <div className="text-center py-10 bg-surface rounded-lg border border-dashed border-white/20">
            <p className="text-text-secondary">Nenhum membro na equipe de {activeCompanyName}.</p>
            <p className="text-sm text-text-secondary/80 mt-1">Clique em "Adicionar Membro" para começar.</p>
        </div>
       )}
    </div>
  );
};

export default Users;