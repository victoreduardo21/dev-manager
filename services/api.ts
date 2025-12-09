

import type { User } from '../types';

// URL do Google Apps Script Web App (Backend)
// Certifique-se de que esta URL está atualizada com a versão mais recente do seu Deploy
const API_URL = "https://script.google.com/macros/s/AKfycbyGEPpqT9EZGcq0TUACUA71YnNkS-e4AAi0-QA7QsxgfHGUuRq_3rRGzYyCxS_swyh_/exec";

// Mapeamento entre nomes das coleções no Frontend e nomes das Abas no Google Sheets
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

/**
 * Função helper para enviar requisições ao Google Apps Script
 * O GAS exige POST com Content-Type text/plain para evitar problemas de CORS
 */
const request = async (action: string, payload: any = {}) => {
    if (!API_URL) {
        throw new Error("URL da API não configurada.");
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
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
    // --- Autenticação ---
    
    login: async (email: string, pass: string): Promise<User | null> => {
        const result = await request('login', { email, password: pass });
        return result.user || null;
    },

    register: async (userData: any, companyName: string): Promise<any> => {
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

    // --- Dados Globais ---

    fetchData: async () => {
        try {
            // Busca todos os dados de todas as abas de uma vez
            const data = await request('fetchData');
            
            // Retorna os dados formatados. Se alguma aba estiver vazia, retorna array vazio.
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
            console.error("Falha ao buscar dados:", error);
            return null;
        }
    },

    // --- Operações de Escrita (CRUD) ---

    saveItem: async (collection: string, item: any) => {
        const sheetName = COLLECTION_MAP[collection] || collection;
        // Envia para o backend salvar na aba correta
        await request('saveItem', { collection: sheetName, item });
    },

    updateItem: async (collection: string, item: any) => {
        const sheetName = COLLECTION_MAP[collection] || collection;
        // Envia para o backend atualizar na aba correta (baseado no ID)
        await request('updateItem', { collection: sheetName, item });
    },

    deleteItem: async (collection: string, id: string) => {
        const sheetName = COLLECTION_MAP[collection] || collection;
        // Envia para o backend excluir
        await request('deleteItem', { collection: sheetName, id });
    }
};