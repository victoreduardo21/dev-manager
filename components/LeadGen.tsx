import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { MapPinIcon, CheckBadgeIcon, PaperAirplaneIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface ScrapedLead {
    id: string;
    name: string;
    address: string;
    phone: string;
    selected: boolean;
}

const LeadGen: React.FC = () => {
    const { addLead, openModal, sendWhatsAppMessage } = useData();
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<ScrapedLead[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    
    // Estados de Automação
    const [automationStatus, setAutomationStatus] = useState<'idle' | 'configuring' | 'sending' | 'sent'>('idle');
    const [messageTemplate, setMessageTemplate] = useState('Olá {nome}, vi sua empresa no Google e gostaria de apresentar uma oportunidade.');
    const [sendingProgress, setSendingProgress] = useState(0);

    const callGeminiDirect = async (prompt: string): Promise<string> => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "";
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword || !location) return;

        setIsSearching(true);
        setResults([]);
        setStatusMessage('Iniciando busca inteligente...');
        
        try {
            // Estratégia: Pedir 3 variações para aumentar a chance de sucesso
            const variations = [
                `Businesses: "${keyword}" in "${location}"`,
                `Top rated "${keyword}" near "${location}"`,
                `Companies for "${keyword}" in "${location}"`
            ];

            let accumulatedLeads: ScrapedLead[] = [];
            const uniquePhones = new Set();

            // Fazemos um loop limitado para não estourar cota
            for (let i = 0; i < 2; i++) { 
                setStatusMessage(`Varredura ${i + 1}/2 em andamento...`);
                
                // PROMPT FORÇA BRUTA (Texto Plano com Separador Pipe |)
                const prompt = `
                    Act as a data scraper. I need real business leads for: ${variations[i]}.
                    List 10 results.
                    
                    Format: NAME | PHONE (with DDI) | ADDRESS
                    
                    Example:
                    Pizzaria Top | +55 11 99999-9999 | Rua Augusta, SP
                    Consultório Dr. Silva | +55 21 98888-8888 | Copacabana, RJ
                    
                    Rules:
                    1. NO Markdown. NO Tables. NO numbering.
                    2. PHONE IS MANDATORY. Skip if no phone.
                    3. If country is Brazil, add +55. If USA, add +1.
                `;

                try {
                    const textResponse = await callGeminiDirect(prompt);
                    const lines = textResponse.split('\n');
                    
                    for (const line of lines) {
                        // Verifica se a linha tem o separador |
                        if (line.includes('|')) {
                            const parts = line.split('|').map(p => p.trim());
                            if (parts.length >= 2) {
                                const name = parts[0].replace(/[*#-]/g, ''); 
                                const phone = parts[1];
                                const address = parts[2] || location;

                                // Limpa telefone para verificar duplicidade
                                const cleanPhone = phone.replace(/[^0-9]/g, '');

                                if (cleanPhone.length > 6 && !uniquePhones.has(cleanPhone)) {
                                    uniquePhones.add(cleanPhone);
                                    accumulatedLeads.push({
                                        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                        name: name,
                                        phone: phone,
                                        address: address,
                                        selected: true
                                    });
                                }
                            }
                        }
                    }
                    
                    // Atualiza resultados parciais
                    setResults([...accumulatedLeads]);
                    // Pequena pausa para a API respirar
                    await new Promise(r => setTimeout(r, 1000)); 

                } catch (err: any) {
                    console.warn("Erro parcial:", err);
                }
            }
            
            if (accumulatedLeads.length === 0) {
                setStatusMessage('Nenhum resultado encontrado. Tente outra região.');
            } else {
                setStatusMessage(`Busca concluída! ${accumulatedLeads.length} leads encontrados.`);
            }

        } catch (error) {
            console.error("Critical Search Error:", error);
            setStatusMessage('Erro ao conectar com o Google.');
        } finally {
            setIsSearching(false);
        }
    };

    const toggleSelection = (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
    };

    const handleStartAutomation = async () => {
        const selectedLeads = results.filter(r => r.selected);
        if (selectedLeads.length === 0) return;

        setAutomationStatus('sending');
        setSendingProgress(0);

        try {
            for (let i = 0; i < selectedLeads.length; i++) {
                const lead = selectedLeads[i];
                const personalizedMsg = messageTemplate.replace('{nome}', lead.name);
                
                // Simula envio (ou envia real se configurado Z-API)
                await sendWhatsAppMessage(lead.phone, personalizedMsg);
                
                // Salva no CRM
                await addLead({
                    name: lead.name,
                    phone: lead.phone,
                    address: lead.address,
                    status: 'Novo',
                    source: `Deep Search (${keyword})`,
                    notes: `Local: ${location}`,
                    messages: [{
                        id: `msg-${Date.now()}-${i}`,
                        sender: 'user',
                        text: personalizedMsg,
                        timestamp: new Date().toISOString()
                    }]
                });

                setSendingProgress(Math.round(((i + 1) / selectedLeads.length) * 100));
                // Delay visual
                await new Promise(resolve => setTimeout(resolve, 800));
            }
    
            setResults(prev => prev.filter(r => !r.selected));
            setAutomationStatus('sent');
            
            openModal('Sucesso', (
                <div className="text-center">
                    <CheckBadgeIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p>Leads importados e processados com sucesso!</p>
                    <button onClick={() => { setAutomationStatus('idle'); openModal('', null); }} className="bg-primary text-white px-6 py-2 rounded w-full mt-4">Fechar</button>
                </div>
            ));
        } catch (err) {
            setAutomationStatus('idle');
            console.error(err);
        }
    };

    const selectedCount = results.filter(r => r.selected).length;

    return (
        <div className="h-full flex flex-col relative">
            {/* Modal de Configuração de Mensagem */}
            {automationStatus === 'configuring' && (
                <div className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="bg-surface border border-white/10 p-6 rounded-lg shadow-2xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-text-primary">
                            <PaperAirplaneIcon className="w-6 h-6 text-primary" /> Configurar Disparo
                        </h3>
                        <p className="text-sm text-text-secondary mb-2">Escreva sua mensagem. Use <b>{'{nome}'}</b> para substituir pelo nome da empresa.</p>
                        <textarea 
                            value={messageTemplate}
                            onChange={e => setMessageTemplate(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 bg-background border border-white/20 rounded-md text-text-primary mb-2 focus:border-primary outline-none"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setAutomationStatus('idle')} className="px-4 py-2 text-text-secondary hover:text-text-primary">Cancelar</button>
                            <button onClick={handleStartAutomation} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium">Iniciar Automação</button>
                        </div>
                    </div>
                </div>
            )}

             {/* Barra de Progresso */}
             {automationStatus === 'sending' && (
                <div className="absolute inset-0 z-20 bg-black/90 flex items-center justify-center p-6 flex-col backdrop-blur-md">
                    <div className="w-64 bg-white/10 rounded-full h-4 mb-4">
                        <div className="bg-primary h-4 rounded-full transition-all duration-300" style={{width: `${sendingProgress}%`}}></div>
                    </div>
                    <p className="text-white font-bold">Importando... {sendingProgress}%</p>
                </div>
             )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                    <MapPinIcon className="w-8 h-8 text-primary" /> Captação Inteligente
                </h2>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-lg border border-white/10 mb-6">
                
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Nicho / Setor</label>
                        <input 
                            type="text" 
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            className="w-full px-4 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary focus:border-primary outline-none"
                            placeholder="Ex: Pizzaria, Advogados"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Cidade / Região</label>
                        <input 
                            type="text" 
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="w-full px-4 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary focus:border-primary outline-none"
                            placeholder="Ex: São Paulo, SP ou Miami, FL"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!keyword || !location || isSearching}
                        className="bg-primary text-white px-8 py-2.5 rounded-md shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium min-w-[140px]"
                    >
                        {isSearching ? 'Buscando...' : 'Buscar Leads'}
                    </button>
                </form>
                
                {isSearching && (
                    <div className="mt-4 text-sm text-text-primary animate-pulse flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        {statusMessage}
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="flex-1 flex flex-col bg-surface rounded-lg border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <h3 className="font-bold text-text-primary">Resultados Encontrados ({results.length})</h3>
                        <button 
                            onClick={() => setAutomationStatus('configuring')}
                            disabled={selectedCount === 0}
                            className="bg-green-600 text-white px-6 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 shadow-lg font-medium flex items-center gap-2"
                        >
                            <PaperAirplaneIcon className="w-4 h-4" />
                            Importar para CRM ({selectedCount})
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start custom-scrollbar">
                        {results.map((lead) => (
                            <div 
                                key={lead.id} 
                                className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${lead.selected ? 'bg-primary/10 border-primary' : 'bg-background/50 border-white/10 hover:border-white/30'}`}
                                onClick={() => toggleSelection(lead.id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-text-primary truncate w-48">{lead.name}</h4>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${lead.selected ? 'bg-primary border-primary' : 'border-text-secondary'}`}>
                                        {lead.selected && <CheckBadgeIcon className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-text-secondary flex items-center gap-2 font-mono">
                                        📞 {lead.phone}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-1 truncate flex items-center gap-2">
                                        📍 {lead.address}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadGen;