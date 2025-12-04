
// Serviço de comunicação com o Google Sheets (Banco de Dados)

// URL padrão (Fallback) ou Variável de Ambiente da Netlify (VITE_BACKEND_URL)
const BACKEND_URL = process.env.VITE_BACKEND_URL || "https://script.google.com/macros/s/AKfycbwXiqUSv_RBgXpbw4SWhzcvCl4PqIJNHGv-SZahKwckSB_F-l-Hk7wzz6eCItOI916Z/exec";

export interface ApiResponse<T> {
    users: any[];
    clients: any[];
    leads: any[];
    projects: any[];
    data?: T;
    status?: string;
    message?: string;
}

export const api = {
    // Busca todos os dados iniciais do Google Sheets
    fetchAllData: async (): Promise<ApiResponse<any>> => {
        try {
            const response = await fetch(`${BACKEND_URL}?action=getAll`);
            if (!response.ok) throw new Error('Failed to fetch data');
            return await response.json();
        } catch (error) {
            console.error("API Error (Google Sheets):", error);
            // Retorna arrays vazios em caso de erro para o sistema abrir offline/vazio
            return { users: [], clients: [], leads: [], projects: [] };
        }
    },

    // Salva itens individuais na planilha
    saveItem: async (type: 'Lead' | 'Client' | 'Project' | 'User', data: any) => {
        try {
            // O modo 'no-cors' é necessário para POST simples no Google Apps Script via navegador
            await fetch(BACKEND_URL, {
                method: 'POST',
                mode: 'no-cors', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: `save${type}`,
                    data: data
                })
            });
            console.log(`${type} salvo com sucesso na nuvem.`);
        } catch (error) {
            console.error(`Falha ao salvar ${type}:`, error);
        }
    }
};
