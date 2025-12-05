
import type { User, Company, Client, Project, Partner, Site, SaaSProduct, Lead } from '../types';
import { mockUsers, mockCompanies, mockClients, mockProjects, mockPartners, mockSites, mockSaaSProducts } from '../data/mockData';

// Helper to safely get env vars
const getEnvVar = () => {
    try {
        // First try process.env because it is defined in vite.config.ts
        if (typeof process !== 'undefined' && process.env && process.env.VITE_BACKEND_URL) {
            return process.env.VITE_BACKEND_URL;
        }
    } catch (e) {}

    try {
        // Then try import.meta.env safely
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
            // @ts-ignore
            return import.meta.env.VITE_BACKEND_URL;
        }
    } catch (e) {}
    
    return '';
};

// URL do Google Apps Script Web App
const API_URL = getEnvVar();

// Interface do Banco de Dados Local (Fallback)
interface Database {
    users: User[];
    companies: Company[];
    clients: Client[];
    projects: Project[];
    partners: Partner[];
    sites: Site[];
    saasProducts: SaaSProduct[];
    leads: Lead[];
}

// --- Funções de Ajuda ---

// Função genérica para chamar o Google Script
const callBackend = async (action: string, payload: any = {}) => {
    if (!API_URL) {
        console.warn("VITE_BACKEND_URL não configurada. Usando modo offline/mock.");
        return null; 
    }

    try {
        // Log para debug
        console.log(`Calling API: ${action}`);

        // Google Apps Script Web App Tricks:
        // 1. method: POST
        // 2. redirect: 'follow' (GAS returns 302)
        // 3. Content-Type: 'text/plain;charset=utf-8' prevents CORS preflight (OPTIONS request) which GAS often fails to handle.
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow', 
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action, ...payload })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Verifica se a resposta é HTML (Erro do Google) em vez de JSON
        if (text.trim().startsWith('<')) {
            console.error("Recebido HTML em vez de JSON. Provável erro no script do Google:", text);
            throw new Error("Erro no servidor Google Apps Script. Verifique os logs do script.");
        }

        try {
            const data = JSON.parse(text);
            if (data.error) throw new Error(data.error);
            return data;
        } catch (jsonError) {
            console.error("Erro ao fazer parse do JSON:", text);
            throw new Error("Resposta inválida do servidor.");
        }

    } catch (error) {
        console.error("Erro na API Google Sheets:", error);
        throw error;
    }
};

export const api = {
    // Autenticação
    login: async (email: string, pass: string): Promise<User | null> => {
        if (!API_URL) return mockLogin(email, pass);
        // Tenta backend, se falhar (ex: rede), não cai no mock para não confundir o usuário.
        // O usuário deve saber que a conexão falhou.
        const result = await callBackend('login', { email, password: pass });
        return result || null;
    },

    register: async (userData: any, companyName: string): Promise<{ user: User, company: Company }> => {
        if (!API_URL) return mockRegister(userData, companyName);
        const result = await callBackend('register', { userData, companyName });
        return result;
    },

    // Métodos Genéricos de Dados
    fetchData: async (): Promise<Database> => {
        if (!API_URL) return mockFetchData();
        
        try {
            const data = await callBackend('fetchData');
            
            // Se retornar vazio, retorna estrutura vazia segura
            if (!data) return mockFetchData();

            // Garante que arrays existam mesmo se vier null do backend
            return {
                users: data.users || [],
                companies: data.companies || [],
                clients: data.clients || [],
                projects: data.projects || [],
                sites: data.sites || [],
                partners: data.partners || [],
                saasProducts: data.saasProducts || [],
                leads: data.leads || []
            };
        } catch (e) {
            console.error("Falha ao buscar dados, usando fallback local temporário para não quebrar UI", e);
            // Em caso de erro no fetch inicial, retornamos o mock APENAS para a UI renderizar, 
            // mas logamos o erro. Isso evita tela branca.
            return {
                users: [], companies: [], clients: [], projects: [], 
                sites: [], partners: [], saasProducts: [], leads: []
            };
        }
    },

    saveItem: async (collection: keyof Database, item: any): Promise<void> => {
        if (!API_URL) return mockSaveItem(collection, item);
        await callBackend('saveItem', { collection, item });
    },

    updateItem: async (collection: keyof Database, item: any): Promise<void> => {
        if (!API_URL) return mockUpdateItem(collection, item);
        await callBackend('updateItem', { collection, item });
    }
};

// --- MOCK FALLBACKS (Para caso a URL não esteja configurada ainda) ---

const DB_KEY = 'nexus_manager_db';
const getLocalDB = (): Database => {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) return JSON.parse(stored);
    return {
        users: mockUsers, companies: mockCompanies, clients: mockClients,
        projects: mockProjects, partners: mockPartners, sites: mockSites,
        saasProducts: mockSaaSProducts, leads: []
    };
};
const saveLocalDB = (db: Database) => localStorage.setItem(DB_KEY, JSON.stringify(db));

const mockLogin = async (email: string, pass: string) => {
    const db = getLocalDB();
    return db.users.find(u => u.email === email && u.password === pass) || null;
};
const mockRegister = async (userData: any, companyName: string) => {
    const db = getLocalDB();
    const newCompanyId = `comp-${Date.now()}`;
    const newCompany: Company = {
        id: newCompanyId, name: companyName, cnpj_cpf: userData.cpf || '',
        subscriptionValue: 0, currency: 'BRL', subscriptionStatus: 'Ativa',
        contactName: userData.name, contactEmail: userData.email, contactPhone: userData.phone,
        subscriptionDueDate: new Date().toISOString(), paymentHistory: []
    };
    const newUser: User = {
        id: `user-${Date.now()}`, companyId: newCompanyId, name: userData.name,
        email: userData.email, password: userData.password, role: 'Admin'
    };
    db.companies.push(newCompany);
    db.users.push(newUser);
    saveLocalDB(db);
    return { user: newUser, company: newCompany };
};
const mockFetchData = async () => getLocalDB();
const mockSaveItem = async (col: keyof Database, item: any) => {
    const db = getLocalDB();
    // @ts-ignore
    db[col].push(item);
    saveLocalDB(db);
};
const mockUpdateItem = async (col: keyof Database, item: any) => {
    const db = getLocalDB();
    // @ts-ignore
    const index = db[col].findIndex((i: any) => i.id === item.id);
    // @ts-ignore
    if (index !== -1) db[col][index] = item;
    saveLocalDB(db);
};
