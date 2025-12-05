
import { mockUsers, mockCompanies, mockClients, mockProjects, mockPartners, mockSites, mockSaaSProducts } from '../data/mockData';
import type { User } from '../types';

// URL do Google Apps Script Web App definida no arquivo .env
const API_URL = process.env.VITE_BACKEND_URL;

/**
 * Função helper para enviar requisições ao Google Apps Script
 * O GAS geralmente exige POST com Content-Type text/plain para evitar problemas de CORS em preflight
 */
const request = async (action: string, payload: any = {}) => {
    if (!API_URL) {
        throw new Error("VITE_BACKEND_URL não configurada no arquivo .env");
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            // 'text/plain' evita o preflight OPTIONS do CORS que o Google Apps Script não trata nativamente
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, ...payload })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }
        
        return data;
    } catch (error: any) {
        console.error(`Erro na requisição (${action}):`, error);
        throw new Error(error.message || "Erro de conexão com o servidor.");
    }
};

export const api = {
    // --- Autenticação via Planilha (GAS) ---
    
    login: async (email: string, pass: string): Promise<User | null> => {
        // Envia ação 'login' para o script.
        // O script deve procurar o email na aba 'Users' e verificar a senha.
        const result = await request('login', { email, password: pass });
        return result.user || null;
    },

    register: async (userData: any, companyName: string): Promise<any> => {
        // Prepara o payload conforme esperado pelo seu script 'handleRegisterUser'
        // Combina Nome e Sobrenome pois a planilha tem coluna 'name'
        const payload = {
            companyId: companyName, // Usando o nome da empresa como identificador inicial
            name: `${userData.firstName} ${userData.lastName}`.trim(),
            email: userData.email,
            password: userData.password,
            phone: userData.phone,
            cpf: userData.cpf,
            role: 'User' // Padrão
        };
        
        return await request('registerUser', payload);
    },

    // --- Dados do Dashboard ---

    fetchData: async () => {
        // Como o backend atual é focado apenas em Auth, retornamos 
        // dados locais/vazios para o restante do sistema funcionar visualmente.
        // Futuramente, você pode criar uma ação 'sync' no GAS.
        return {
            users: mockUsers || [],
            companies: mockCompanies || [],
            clients: mockClients || [],
            projects: mockProjects || [],
            sites: mockSites || [],
            partners: mockPartners || [],
            saasProducts: mockSaaSProducts || [],
            leads: []
        };
    },

    // Métodos Genéricos (Placeholder para futura implementação no GAS)
    saveItem: async (collection: string, item: any) => {
        console.log(`Salvando em ${collection} (Local):`, item);
        // Exemplo futuro: await request('saveItem', { sheet: collection, item });
    },

    updateItem: async (collection: string, item: any) => {
        console.log(`Atualizando em ${collection} (Local):`, item);
        // Exemplo futuro: await request('updateItem', { sheet: collection, item });
    }
};
