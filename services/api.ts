
import { mockUsers, mockCompanies, mockClients, mockProjects, mockPartners, mockSites, mockSaaSProducts } from '../data/mockData';
import type { User } from '../types';

// URL do Google Apps Script Web App (Backend)
// Substituída diretamente para garantir conexão
const API_URL = "https://script.google.com/macros/s/AKfycbyGEPpqT9EZGcq0TUACUA71YnNkS-e4AAi0-QA7QsxgfHGUuRq_3rRGzYyCxS_swyh_/exec";

/**
 * Função helper para enviar requisições ao Google Apps Script
 * O GAS geralmente exige POST com Content-Type text/plain para evitar problemas de CORS em preflight
 */
const request = async (action: string, payload: any = {}) => {
    if (!API_URL) {
        throw new Error("URL da API não configurada.");
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
        const result = await request('login', { email, password: pass });
        return result.user || null;
    },

    register: async (userData: any, companyName: string): Promise<any> => {
        // Prepara o payload conforme esperado pelo seu script
        const payload = {
            companyId: companyName, 
            name: `${userData.firstName} ${userData.lastName}`.trim(),
            email: userData.email,
            password: userData.password,
            phone: userData.phone,
            cpf: userData.cpf,
            role: 'User'
        };
        
        return await request('registerUser', payload);
    },

    // --- Dados do Dashboard ---

    fetchData: async () => {
        // Retorna dados mocados para o dashboard visual enquanto o backend foca em Auth
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

    // Métodos Genéricos (Placeholder)
    saveItem: async (collection: string, item: any) => {
        console.log(`Salvando em ${collection} (Local):`, item);
    },

    updateItem: async (collection: string, item: any) => {
        console.log(`Atualizando em ${collection} (Local):`, item);
    }
};
