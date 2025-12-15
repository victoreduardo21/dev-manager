
import type { User } from '../types';

// URL do Google Apps Script Web App (Backend)
// ATENÇÃO: Substitua esta URL pela sua nova implantação se necessário
const API_URL = "https://script.google.com/macros/s/AKfycbyGEPpqT9EZGcq0TUACUA71YnNkS-e4AAi0-QA7QsxgfHGUuRq_3rRGzYyCxS_swyh_/exec";

const COLLECTION_MAP: Record<string, string> = {
    users: 'Users',
    companies: 'Companies',
    clients: 'Clients',
    projects: 'Projects',
    sites: 'Sites',
    partners: 'Partners',
    saasProducts: 'SaaSProducts',
    leads: 'Leads'
};

const request = async (action: string, payload: any = {}) => {
    if (!API_URL) {
        console.error("URL da API não configurada.");
        throw new Error("Sistema offline: URL da API ausente.");
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action, ...payload })
        });

        const text = await response.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Erro ao processar resposta do servidor:", text);
            throw new Error("Erro de comunicação: O servidor retornou uma resposta inválida (HTML em vez de JSON). Verifique o deploy do Apps Script.");
        }

        if (data.error) {
            throw new Error(data.error);
        }
        
        return data;
    } catch (error: any) {
        console.error(`Erro na requisição (${action}):`, error);
        throw error;
    }
};

export const api = {
    login: async (email: string, pass: string): Promise<User | null> => {
        try {
            const result = await request('login', { email, password: pass });
            return result.user || null;
        } catch (e) {
            console.error("Login falhou:", e);
            throw e;
        }
    },

    register: async (userData: any, companyName: string): Promise<any> => {
        const payload = {
            companyId: companyName, 
            name: `${userData.firstName} ${userData.lastName}`.trim(),
            email: userData.email,
            password: userData.password,
            phone: userData.phone,
            cpf: userData.cpf,
            plan: userData.plan, // Envia o plano selecionado
            billingCycle: userData.billingCycle, // Envia o ciclo de pagamento (monthly/yearly)
            role: 'User'
        };
        return await request('registerUser', payload);
    },

    fetchData: async () => {
        try {
            const data = await request('fetchData');
            
            // Retorna arrays vazios por segurança se alguma chave faltar
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
        } catch (error) {
            console.error("Falha crítica ao buscar dados. O sistema funcionará offline/vazio.", error);
            // Retorna estrutura vazia para não quebrar a tela branca
            return {
                users: [], companies: [], clients: [], projects: [], sites: [], partners: [], saasProducts: [], leads: []
            };
        }
    },

    saveItem: async (collection: string, item: any) => {
        const sheetName = COLLECTION_MAP[collection] || collection;
        return await request('saveItem', { collection: sheetName, item });
    },

    updateItem: async (collection: string, item: any) => {
        const sheetName = COLLECTION_MAP[collection] || collection;
        return await request('updateItem', { collection: sheetName, item });
    },

    deleteItem: async (collection: string, id: string) => {
        const sheetName = COLLECTION_MAP[collection] || collection;
        return await request('deleteItem', { collection: sheetName, id });
    }
};
