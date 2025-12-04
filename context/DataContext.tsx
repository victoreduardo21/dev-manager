
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import Modal from '../components/Modal';
import type { Client, Partner, Project, Site, SaaSProduct, User, Company, Payment, DataContextType, View, SubscriptionPayment, Lead, ChatMessage, WhatsAppConfig } from '../types';
import { mockClients, mockCompanies, mockPartners, mockProjects, mockSaaSProducts, mockSites, mockUsers } from '../data/mockData';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

interface DataProviderProps {
    children: React.ReactNode;
    currentUser: User | null;
    impersonatedCompany: Company | null;
    setActiveView: (view: View) => void;
}

const PasswordDisplay: React.FC<{ user: User }> = ({ user }) => (
    <div className="text-center">
        <p className="text-text-primary mb-2">O administrador da empresa foi criado.</p>
        <p className="text-text-secondary text-sm">Por favor, compartilhe estas credenciais com eles:</p>
        <div className="bg-background/50 border border-white/20 rounded-md p-4 my-4 text-left">
            <p><strong className="text-text-secondary">Email:</strong> {user.email}</p>
            <p><strong className="text-text-secondary">Senha Temporária:</strong> <span className="font-mono bg-black/30 px-2 py-1 rounded">{user.password}</span></p>
        </div>
        <p className="text-xs text-text-secondary">Eles devem alterar a senha no primeiro login.</p>
    </div>
);

export const DataProvider: React.FC<DataProviderProps> = ({ currentUser, impersonatedCompany, children, setActiveView }) => {
    // Centralized state management
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [companies, setCompanies] = useState<Company[]>(mockCompanies);
    const [clients, setClients] = useState<Client[]>(mockClients);
    const [partners, setPartners] = useState<Partner[]>(mockPartners);
    const [projects, setProjects] = useState<Project[]>(mockProjects);
    const [sites, setSites] = useState<Site[]>(mockSites);
    const [saasProducts, setSaaSProducts] = useState<SaaSProduct[]>(mockSaaSProducts);
    
    // WhatsApp Configuration State
    const [whatsappConfig, setWhatsappConfigState] = useState<WhatsAppConfig>({
        apiUrl: '',
        apiToken: '',
        instanceName: '',
        isConnected: false
    });

    // Load WhatsApp config from local storage
    useEffect(() => {
        const storedConfig = localStorage.getItem('nexus_whatsapp_config');
        if (storedConfig) {
            setWhatsappConfigState(JSON.parse(storedConfig));
        }
    }, []);

    const setWhatsappConfig = (config: WhatsAppConfig) => {
        setWhatsappConfigState(config);
        localStorage.setItem('nexus_whatsapp_config', JSON.stringify(config));
    };

    // Inicializa leads vazio
    const [leads, setLeads] = useState<Lead[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
    const [modalTitle, setModalTitle] = useState('');

    const openModal = (title: string, content: React.ReactNode) => {
        setModalTitle(title);
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
        setModalTitle('');
    };
    
    const activeCompanyId = impersonatedCompany?.id || currentUser?.companyId;

    const activeCompanyName = useMemo(() => {
        return companies.find(c => c.id === activeCompanyId)?.name || 'Empresa';
    }, [companies, activeCompanyId]);

    const filterByCompany = <T extends { companyId: string }>(data: T[]): T[] => {
        if (!currentUser) return [];
        // SuperAdmin not impersonating sees everything except their own company's users
        if (currentUser.role === 'SuperAdmin' && !impersonatedCompany) {
            // Type guard to check if the data is an array of Users.
            // Partner also has a 'role', so we add 'email' check to be specific.
             if (data.length > 0 && 'role' in data[0] && 'email' in data[0]) {
                 // This filters the global `users` array to only show the SuperAdmin's own user account.
                 return (data as unknown as User[]).filter(item => item.companyId === currentUser.companyId) as unknown as T[];
             }
             // For all other data types (clients, projects etc.), the SuperAdmin sees everything.
             return data;
        }
        // All other users (or impersonating admin) see only their company's data
        return data.filter(item => item.companyId === activeCompanyId);
    };

    const filteredClients = useMemo(() => filterByCompany(clients), [clients, currentUser, impersonatedCompany]);
    const filteredPartners = useMemo(() => filterByCompany(partners), [partners, currentUser, impersonatedCompany]);
    const filteredProjects = useMemo(() => filterByCompany(projects), [projects, currentUser, impersonatedCompany]);
    const filteredSites = useMemo(() => filterByCompany(sites), [sites, currentUser, impersonatedCompany]);
    const filteredSaaSProducts = useMemo(() => filterByCompany(saasProducts), [saasProducts, currentUser, impersonatedCompany]);
    const filteredUsers = useMemo(() => filterByCompany(users), [users, currentUser, impersonatedCompany]);
    const filteredLeads = useMemo(() => filterByCompany(leads), [leads, currentUser, impersonatedCompany]);
    
    const generatePayments = (totalValue: number, installments: number, startDate: string): Payment[] => {
        if (installments <= 0) return [];
        const installmentAmount = totalValue / installments;
        const start = new Date(startDate);
        return Array.from({ length: installments }, (_, i) => {
            const dueDate = new Date(start);
            dueDate.setMonth(start.getMonth() + i + 1);
            return {
                id: `payment_${Date.now()}_${i + 1}`,
                amount: parseFloat(installmentAmount.toFixed(2)),
                dueDate: dueDate.toISOString().split('T')[0],
                status: 'Pendente'
            };
        });
    };

    const createAsyncHandler = <T, U extends { id: string; companyId: string }>(
        setter: React.Dispatch<React.SetStateAction<U[]>>,
        creator: (data: T, companyId: string) => U
    ) => {
        return (data: T): Promise<void> => {
            return new Promise(resolve => {
                setTimeout(() => {
                    if (!activeCompanyId) {
                        console.error("No active company ID to create item.");
                        resolve();
                        return;
                    }
                    const newItem = creator(data, activeCompanyId);
                    setter(prev => [...prev, newItem]);
                    closeModal();
                    resolve();
                }, 500);
            });
        };
    };
    
    const createUpdateHandler = <T extends { id: string }>(
        setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        return (itemToUpdate: T): Promise<void> => {
            return new Promise(resolve => {
                setTimeout(() => {
                    setter(prev => prev.map(item => item.id === itemToUpdate.id ? itemToUpdate : item));
                    // Don't close modal automatically here to allow chat updates to persist while open
                    resolve();
                }, 200);
            });
        };
    };
    
    const addCompany = (data: Omit<Company, 'id' | 'subscriptionDueDate' | 'paymentHistory'> & { adminUser: { name: string; email: string; phone: string } }): Promise<void> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const newCompanyId = `comp-${Date.now()}`;
                const nextDueDate = new Date();
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);

                const newCompany: Company = {
                    id: newCompanyId,
                    name: data.name,
                    cnpj_cpf: data.cnpj_cpf,
                    subscriptionValue: data.subscriptionValue,
                    currency: data.currency,
                    subscriptionStatus: data.subscriptionStatus,
                    contactName: data.adminUser.name,
                    contactEmail: data.adminUser.email,
                    contactPhone: data.adminUser.phone,
                    subscriptionDueDate: nextDueDate.toISOString().split('T')[0],
                    paymentHistory: [],
                };
                setCompanies(prev => [...prev, newCompany]);

                const tempPassword = Math.random().toString(36).slice(-8);
                const newUser: User = {
                    id: `user-${Date.now()}`,
                    companyId: newCompanyId,
                    name: data.adminUser.name,
                    email: data.adminUser.email,
                    password: tempPassword,
                    role: 'Admin',
                };
                setUsers(prev => [...prev, newUser]);
                
                openModal('Empresa Criada com Sucesso!', <PasswordDisplay user={newUser} />);
                resolve();
            }, 1000);
        });
    };

    const addProject = createAsyncHandler(setProjects, (data: Omit<Project, 'id' | 'type' | 'payments' | 'status' | 'progress' | 'activities' | 'companyId'>, companyId) => {
        const remainingValue = data.value - data.downPayment;
        return { 
            ...data, 
            id: `proj${Date.now()}`,
            companyId,
            type: 'Project',
            status: 'Pendente',
            progress: 0, 
            activities: [],
            payments: generatePayments(remainingValue, data.installments, data.startDate)
        };
    });

    const addSite = createAsyncHandler(setSites, (data: Omit<Site, 'id' | 'type' | 'payments' | 'status' | 'progress' | 'activities' | 'companyId'>, companyId) => {
        const remainingValue = data.value - data.downPayment;
        return { 
            ...data, 
            id: `site${Date.now()}`,
            companyId,
            type: 'Site',
            status: 'Pendente',
            progress: 0,
            activities: [],
            payments: generatePayments(remainingValue, data.installments, data.startDate)
        };
    });
    
    const addClient = createAsyncHandler(setClients, (data: Omit<Client, 'id' | 'companyId'>, companyId) => ({ ...data, id: `cli${Date.now()}`, companyId }));
    const addPartner = createAsyncHandler(setPartners, (data: Omit<Partner, 'id' | 'isAvailable' | 'companyId'>, companyId) => ({ ...data, id: `par${Date.now()}`, companyId, isAvailable: true }));
    const addSaaSProduct = createAsyncHandler(setSaaSProducts, (data: Omit<SaaSProduct, 'id' | 'companyId'>, companyId) => ({ ...data, id: `saas${Date.now()}`, companyId }));
    const addUser = createAsyncHandler(setUsers, (data: Omit<User, 'id' | 'companyId' | 'password'>, companyId) => ({ ...data, id: `user${Date.now()}`, companyId, role: data.role || 'User'}));
    // Updated addLead to handle initial messages
    const addLead = createAsyncHandler(setLeads, (data: Omit<Lead, 'id' | 'companyId' | 'createdAt' | 'messages'> & { messages?: ChatMessage[] }, companyId) => ({ 
        ...data, 
        id: `lead${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
        companyId, 
        createdAt: new Date().toISOString(),
        messages: data.messages || []
    }));

    const updateClient = createUpdateHandler(setClients);
    const updatePartner = createUpdateHandler(setPartners);
    const updateProject = createUpdateHandler(setProjects);
    const updateSite = createUpdateHandler(setSites);
    const updateSaaSProduct = createUpdateHandler(setSaaSProducts);
    const updateCompany = createUpdateHandler(setCompanies);
    const updateUser = createUpdateHandler(setUsers);
    const updateLead = createUpdateHandler(setLeads);

    const updatePaymentStatus = (projectId: string, paymentId: string, newStatus: 'Pago' | 'Pendente' | 'Atrasado'): Promise<void> => {
        return new Promise(resolve => {
            const updater = (list: any[]) => list.map(p => 
                p.id === projectId ? { ...p, payments: p.payments.map((pm: Payment) => pm.id === paymentId ? { ...pm, status: newStatus } : pm) } : p
            );
            setProjects(prev => updater(prev));
            setSites(prev => updater(prev));
            resolve();
        });
    };

    const recordSubscriptionPayment = (companyId: string): Promise<void> => {
        return new Promise(resolve => {
            setTimeout(() => {
                setCompanies(prev => prev.map(c => {
                    if (c.id === companyId) {
                        const newDueDate = new Date(c.subscriptionDueDate);
                        newDueDate.setMonth(newDueDate.getMonth() + 1);
                        
                        const newPayment: SubscriptionPayment = {
                            id: `subpay-admin-${Date.now()}`,
                            date: new Date().toISOString().split('T')[0],
                            amount: c.subscriptionValue,
                        };

                        return {
                            ...c,
                            subscriptionStatus: 'Ativa',
                            subscriptionDueDate: newDueDate.toISOString().split('T')[0],
                            paymentHistory: [newPayment, ...c.paymentHistory],
                        };
                    }
                    return c;
                }));
                openModal('Pagamento Registrado!', <p className="text-center text-text-primary">A assinatura do cliente foi renovada com sucesso.</p>);
                resolve();
            }, 500);
        });
    };

    const paySubscription = (companyId: string, cardDetails?: { last4: string; expiry: string; }): Promise<void> => {
        return new Promise(resolve => {
            setTimeout(() => {
                setCompanies(prev => prev.map(c => {
                    if (c.id === companyId) {
                        // If paying early, extend from current due date. If paying late, extend from today.
                        const baseDate = new Date(c.subscriptionDueDate) > new Date() ? new Date(c.subscriptionDueDate) : new Date();
                        baseDate.setMonth(baseDate.getMonth() + 1);
                        
                        const newPayment: SubscriptionPayment = {
                            id: `subpay-${Date.now()}`,
                            date: new Date().toISOString().split('T')[0],
                            amount: c.subscriptionValue,
                        };

                        const updatedCompany: Company = {
                            ...c,
                            subscriptionStatus: 'Ativa',
                            subscriptionDueDate: baseDate.toISOString().split('T')[0],
                            paymentHistory: [newPayment, ...c.paymentHistory],
                        };

                        if (cardDetails) {
                            updatedCompany.savedCard = cardDetails;
                        }

                        return updatedCompany;
                    }
                    return c;
                }));
                closeModal();
                resolve();
            }, 1000);
        });
    };

    // REAL WHATSAPP SENDING LOGIC (GLOBAL SUPPORT)
    const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
        if (!whatsappConfig.isConnected || !whatsappConfig.apiUrl) {
            // Se não tiver API configurada, simula sucesso (para demo) mas loga aviso
            console.log("Simulating send to", phone, ":", message);
            return new Promise(r => setTimeout(() => r(true), 500));
        }

        try {
            // Limpa caracteres não numéricos, mas preserva o sinal de + se houver
            let cleanPhone = phone.replace(/[^0-9+]/g, '');
            let finalPhone = cleanPhone.replace('+', ''); // Remove + para envio na API, mas usa para lógica

            // Lógica Internacional Inteligente:
            // 1. Se o telefone original tinha '+', confiamos que o DDI já está lá.
            // 2. Se não tinha '+', mas tem mais de 12 dígitos, provavelmente tem DDI.
            // 3. Se tem <= 11 dígitos E não começa com DDI óbvio, assumimos Brasil (Legado/Manual).
            
            if (!phone.includes('+') && finalPhone.length <= 11) {
                // Fallback para leads manuais antigos do Brasil
                finalPhone = `55${finalPhone}`;
            }
            
            // Example payload for Evolution API / Z-API structure (common standard)
            const payload = {
                number: finalPhone,
                text: message,
                message: message // some APIs use text, some message
            };

            const response = await fetch(`${whatsappConfig.apiUrl}/message/sendText/${whatsappConfig.instanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': whatsappConfig.apiToken,
                    'Authorization': `Bearer ${whatsappConfig.apiToken}` // Try both common auth headers
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('API Request Failed');
            return true;
        } catch (error) {
            console.error("Failed to send WhatsApp via API", error);
            // Fallback to simulation success to not break the flow for the user UI, but ideally show error
            return false;
        }
    };

    const value: DataContextType = {
        currentUser,
        activeCompanyName,
        clients: filteredClients, partners: filteredPartners, projects: filteredProjects, sites: filteredSites, saasProducts: filteredSaaSProducts, users: filteredUsers, companies: companies, leads: filteredLeads,
        addClient, addPartner, addProject, addSite, addSaaSProduct, addCompany, addUser, addLead,
        updateClient, updatePartner, updateProject, updateSite, updateSaaSProduct, updateCompany, updateUser, updateLead,
        updatePaymentStatus,
        paySubscription,
        recordSubscriptionPayment,
        openModal,
        setActiveView,
        whatsappConfig,
        setWhatsappConfig,
        sendWhatsAppMessage
    };

    return (
        <DataContext.Provider value={value}>
            {children}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
                {modalContent}
            </Modal>
        </DataContext.Provider>
    )
}
