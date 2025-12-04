
import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const ToggleSwitch: React.FC<{ enabled: boolean, setEnabled: (enabled: boolean) => void }> = ({ enabled, setEnabled }) => (
    <button
        type="button"
        className={`${
        enabled ? 'bg-primary' : 'bg-gray-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface`}
        onClick={() => setEnabled(!enabled)}
    >
        <span
        className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

const Settings: React.FC = () => {
    const { currentUser, updateUser } = useData();
    const [emailNotifications, setEmailNotifications] = useState(true);
    
    // State for user profile fields
    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        cpf: currentUser?.cpf || ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    
    if (!currentUser) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSuccessMsg('');
        
        try {
            await updateUser({
                ...currentUser,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                cpf: formData.cpf
            });
            setSuccessMsg('Dados atualizados com sucesso!');
        } catch (error) {
            console.error("Failed to update user", error);
        } finally {
            setIsSaving(false);
        }
    };

  return (
    <div>
      <h2 className="text-3xl font-bold text-text-primary mb-6">Configurações</h2>
      <div className="max-w-3xl">
        <div className="bg-surface p-8 rounded-lg shadow-lg border border-white/10">
          
          {/* Profile Header */}
          <div className="flex items-center mb-8">
            <img src={`https://i.pravatar.cc/80?u=${currentUser.email}`} alt="User Avatar" className="w-20 h-20 rounded-full border-2 border-primary/50" />
            <div className="ml-6">
                <h3 className="text-2xl font-bold text-text-primary">{currentUser.name}</h3>
                <p className="text-text-secondary">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                     <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/20 text-primary uppercase">{currentUser.role}</span>
                     <button className="text-sm text-primary hover:underline">Alterar foto</button>
                </div>
            </div>
          </div>
          
          <div className="space-y-6">
             <h4 className="text-lg font-semibold text-text-primary border-b border-white/10 pb-2">Dados Cadastrais</h4>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-text-primary" 
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-text-primary" 
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    className="block w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-text-primary" 
                  />
                </div>
                <div>
                  <label htmlFor="cpf" className="block text-sm font-medium text-text-secondary mb-1">CPF</label>
                  <input 
                    type="text" 
                    id="cpf" 
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00"
                    className="block w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-text-primary" 
                  />
                </div>
             </div>

            <hr className="border-white/10 my-8"/>
            
            {/* Notifications Section */}
            <div>
                <h4 className="text-lg font-semibold text-text-primary">Preferências</h4>
                <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block font-medium text-text-primary">Notificações por Email</label>
                            <p className="text-sm text-text-secondary">Receba emails sobre atividades importantes e prazos.</p>
                        </div>
                        <ToggleSwitch enabled={emailNotifications} setEnabled={setEmailNotifications} />
                    </div>
                </div>
            </div>

            <hr className="border-white/10 my-8"/>
            
            <div className="flex items-center justify-between pt-4">
              {successMsg && <span className="text-green-500 text-sm font-medium animate-pulse">{successMsg}</span>}
              {!successMsg && <span></span>} {/* Spacer */}
              <button 
                type="button" 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
