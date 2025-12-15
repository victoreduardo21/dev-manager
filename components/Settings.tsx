
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { PhoneIcon, CheckBadgeIcon, CloudIcon } from './Icons';

// ==================================================================================
// 🔧 CONFIGURAÇÃO DO WHATSAPP (Preencha seus dados aqui diretamente no código)
// ==================================================================================
const WA_CONFIG = {
    apiUrl: "https://api.seudominio.com", // Coloque a URL da sua API aqui
    apiToken: "SEU_TOKEN_GLOBAL_AQUI",    // Coloque seu Token/API Key aqui
    instanceName: "MinhaInstancia"        // Nome da instância
};
// ==================================================================================


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
    const { currentUser, updateUser, whatsappConfig, setWhatsappConfig } = useData();
    const [emailNotifications, setEmailNotifications] = useState(true);
    
    // State for user profile fields
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: ''
    });

    const [qrCode, setQrCode] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'qrcode'>('disconnected');
    const [waLoading, setWaLoading] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    
    // Atualiza o form data quando o currentUser muda e carrega config do WhatsApp
    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                cpf: currentUser.cpf || ''
            });
        }
        if (whatsappConfig && whatsappConfig.isConnected) {
            setConnectionStatus('connected');
        }
    }, [currentUser, whatsappConfig]);

    if (!currentUser) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveUserProfile = async () => {
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
            setSuccessMsg('Erro ao atualizar. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- WhatsApp Connection Logic ---

    // Atualiza o contexto global com as credenciais Hardcoded quando tenta conectar
    const updateGlobalConfig = (isConnected: boolean) => {
        setWhatsappConfig({
            apiUrl: WA_CONFIG.apiUrl,
            apiToken: WA_CONFIG.apiToken,
            instanceName: WA_CONFIG.instanceName,
            isConnected: isConnected
        });
    };

    const connectWhatsApp = async () => {
        setWaLoading(true);
        setQrCode(null);
        setSuccessMsg('');

        try {
            updateGlobalConfig(false);

            // 1. Tenta conectar/buscar QR Code (Exemplo baseado na Evolution API v1/v2)
            const response = await fetch(`${WA_CONFIG.apiUrl}/instance/connect/${WA_CONFIG.instanceName}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': WA_CONFIG.apiToken,
                    'Authorization': `Bearer ${WA_CONFIG.apiToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Falha na API. Verifique as constantes no código.');
            }

            const data = await response.json();

            // Lógica adaptativa para diferentes respostas de API
            if (data.base64 || (data.qrcode && data.qrcode.base64)) {
                // QR Code recebido
                const base64 = data.base64 || data.qrcode.base64;
                setQrCode(base64);
                setConnectionStatus('qrcode');
                setSuccessMsg('Escaneie o QR Code.');
            } else if (data.instance && data.instance.status === 'open') {
                // Já conectado
                setConnectionStatus('connected');
                updateGlobalConfig(true);
                setSuccessMsg('Instância já está conectada!');
            } else {
                 // Fallback genérico
                 setSuccessMsg('Comando enviado. Verifique o status.');
            }

        } catch (error: any) {
            console.error(error);
            setSuccessMsg(`Erro: ${error.message}`);
            setConnectionStatus('disconnected');
        } finally {
            setWaLoading(false);
        }
    };

    const checkConnectionStatus = async () => {
        if (!WA_CONFIG.apiUrl) return;
        setWaLoading(true);
        try {
             const response = await fetch(`${WA_CONFIG.apiUrl}/instance/connectionState/${WA_CONFIG.instanceName}`, {
                method: 'GET',
                headers: {
                    'apikey': WA_CONFIG.apiToken,
                    'Authorization': `Bearer ${WA_CONFIG.apiToken}`
                }
            });
            const data = await response.json();
            
            if (data.instance && data.instance.state === 'open') {
                setConnectionStatus('connected');
                setQrCode(null);
                updateGlobalConfig(true);
                setSuccessMsg('Conectado com sucesso!');
            } else {
                setConnectionStatus('disconnected');
                updateGlobalConfig(false);
                setSuccessMsg('Instância desconectada.');
            }
        } catch (e) {
            setSuccessMsg('Erro ao verificar status.');
        } finally {
            setWaLoading(false);
        }
    };

    const disconnectWhatsApp = async () => {
        if (!confirm('Tem certeza que deseja desconectar?')) return;
        setWaLoading(true);
        try {
             await fetch(`${WA_CONFIG.apiUrl}/instance/logout/${WA_CONFIG.instanceName}`, {
                method: 'DELETE',
                headers: {
                    'apikey': WA_CONFIG.apiToken,
                    'Authorization': `Bearer ${WA_CONFIG.apiToken}`
                }
            });
            setConnectionStatus('disconnected');
            setQrCode(null);
            updateGlobalConfig(false);
            setSuccessMsg('Desconectado.');
        } catch (e) {
            setSuccessMsg('Erro ao desconectar (pode já estar offline).');
            setConnectionStatus('disconnected');
        } finally {
            setWaLoading(false);
        }
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
    <div>
      <h2 className="text-3xl font-bold text-text-primary mb-6">Configurações</h2>
      <div className="max-w-4xl space-y-8">
        
        {/* === CARD WHATSAPP === */}
        <div className="bg-surface p-8 rounded-lg shadow-lg border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <PhoneIcon className="w-6 h-6 text-green-500" />
                    Integração WhatsApp
                </h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
                    connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
                    connectionStatus === 'qrcode' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                        connectionStatus === 'qrcode' ? 'bg-yellow-500' :
                        'bg-red-500'
                    }`}></div>
                    {connectionStatus === 'connected' ? 'CONECTADO' : 
                     connectionStatus === 'qrcode' ? 'AGUARDANDO LEITURA' : 'DESCONECTADO'}
                </div>
            </div>

            <p className="text-sm text-text-secondary mb-6 bg-background/50 p-3 rounded border border-white/10">
                Gerencie a conexão da sua instância do WhatsApp. As credenciais de API estão configuradas internamente no sistema.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
                    <p className="text-text-primary font-medium">Controle de Conexão</p>
                    <p className="text-sm text-text-secondary">
                        Clique abaixo para iniciar a sessão e gerar o QR Code se estiver desconectado.
                    </p>
                    
                    <div className="flex gap-2 pt-2 flex-wrap justify-center md:justify-start">
                        {connectionStatus === 'connected' ? (
                            <button 
                                onClick={disconnectWhatsApp}
                                disabled={waLoading}
                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors disabled:opacity-50 font-medium"
                            >
                                {waLoading ? '...' : 'Desconectar Sessão'}
                            </button>
                        ) : (
                            <button 
                                onClick={connectWhatsApp}
                                disabled={waLoading}
                                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors disabled:opacity-50 shadow-lg shadow-green-900/20 font-medium flex items-center gap-2"
                            >
                                {waLoading ? 'Carregando...' : 'Gerar QR Code'}
                            </button>
                        )}
                         <button 
                            onClick={checkConnectionStatus}
                            className="p-2 text-text-secondary hover:text-primary border border-white/10 rounded hover:bg-white/5"
                            title="Verificar Status da API"
                        >
                            <CloudIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Área do QR Code / Status Visual */}
                <div className="flex items-center justify-center bg-black/20 rounded-lg border border-white/5 min-h-[250px] relative overflow-hidden w-full">
                    {waLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    )}
                    
                    {connectionStatus === 'connected' ? (
                        <div className="text-center p-6">
                            <CheckBadgeIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                            <p className="text-green-400 font-bold text-lg">WhatsApp Sincronizado</p>
                            <p className="text-sm text-text-secondary mt-1">O sistema está pronto para enviar mensagens automáticas.</p>
                        </div>
                    ) : qrCode ? (
                        <div className="text-center p-4">
                            <div className="bg-white p-2 rounded-lg inline-block mb-3 shadow-xl">
                                <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 object-contain" />
                            </div>
                            <p className="text-sm text-text-secondary animate-pulse font-medium">Abra o WhatsApp > Aparelhos Conectados > Conectar</p>
                        </div>
                    ) : (
                        <div className="text-center text-text-secondary opacity-50 p-6">
                            <PhoneIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-medium">Aguardando solicitação de conexão...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* === CARD PERFIL === */}
        <div className="bg-surface p-8 rounded-lg shadow-lg border border-white/10">
          <div className="flex items-center mb-8">
            <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center border-2 border-primary/50 text-white font-bold text-3xl shadow-xl">
                    {getInitials(formData.name || currentUser.name)}
                </div>
            </div>
            <div className="ml-6">
                <h3 className="text-2xl font-bold text-text-primary">{formData.name || currentUser.name}</h3>
                <p className="text-text-secondary">{formData.email || currentUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                     <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/20 text-primary uppercase">{currentUser.role}</span>
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
                  <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Telefone</label>
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
              {successMsg && <span className={`text-sm font-medium animate-pulse ${successMsg.includes('Erro') || successMsg.includes('Falha') ? 'text-red-500' : 'text-green-500'}`}>{successMsg}</span>}
              {!successMsg && <span></span>} {/* Spacer */}
              <button 
                type="button" 
                onClick={handleSaveUserProfile}
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
