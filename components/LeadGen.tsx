
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
    
    // Templates de mensagem
    const MSG_TEMPLATE_PT = 'Olá {nome}, vi sua empresa no Google e gostaria de apresentar uma oportunidade.';
    const MSG_TEMPLATE_EN = 'Hello {nome}, I found your business on Google and would like to present an opportunity.';

    const [messageTemplate, setMessageTemplate] = useState(MSG_TEMPLATE_PT);
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
        setStatusMessage('Iniciando varredura profunda...');
        
        try {
            const letterBatches = [
                "A, B, C, D, E",
                "F, G, H, I, J",
                "K, L, M, N, O",
                "P, Q, R, S, T",
                "U, V, W, X, Y, Z"
            ];

            let accumulatedLeads: ScrapedLead[] = [];
            const uniquePhones = new Set();
            let languageDetected = false;

            for (let i = 0; i < letterBatches.length; i++) { 
                setStatusMessage(`Buscando empresas de ${letterBatches[i].split(',')[0]} a ${letterBatches[i].split(',').pop()}... (${accumulatedLeads.length} encontrados)`);
                
                const prompt = `
                    Act as a data scraper. I need real business leads for: "${keyword}" in "${location}".
                    
                    CRITICAL INSTRUCTION:
                    List ONLY businesses where the name starts with one of these letters: ${letterBatches[i]}.
                    I need exactly 30 unique results for this batch.
                    
                    Format: NAME | PHONE (with DDI) | ADDRESS
                    
                    Example:
                    ${letterBatches[i].split(',')[0]} Company | +55 11 99999-9999 | Rua Exemplo, SP
                    
                    Rules:
                    1. NO Markdown. NO Tables. NO numbering.
                    2. PHONE IS MANDATORY. Skip if no phone.
                    3. ALWAYS include the correct country code (DDI) in the phone number (e.g., +55 for Brazil, +1 for USA, +44 for UK, etc).
                    4. Focus on local businesses.
                `;

                try {
                    const textResponse = await callGeminiDirect(prompt);
                    const lines = textResponse.split('\n');
                    
                    for (const line of lines) {
                        if (line.includes('|')) {
                            const parts = line.split('|').map(p => p.trim());
                            if (parts.length >= 2) {
                                const name = parts[0].replace(/[*#-]/g, ''); 
                                const phone = parts[1];
                                const address = parts[2] || location;
                                const cleanPhone = phone.replace(/[^0-9]/g, '');

                                if (cleanPhone.length > 7 && !uniquePhones.has(cleanPhone)) {
                                    if (!languageDetected) {
                                        if (phone.includes('+55')) {
                                            setMessageTemplate(MSG_TEMPLATE_PT);
                                        } else {
                                            setMessageTemplate(MSG_TEMPLATE_EN);
                                        }
                                        languageDetected = true;
                                    }

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
                    
                    setResults([...accumulatedLeads]);
                    await new Promise(r => setTimeout(r, 1000)); 

                } catch (err: any) {
                    console.warn(`Erro no lote ${i}:`, err);
                }
            }
            
            if (accumulatedLeads.length === 0) {
                setStatusMessage('Nenhum resultado encontrado. Tente outra região ou termo.');
            } else {
                setStatusMessage(`Busca concluída! ${accumulatedLeads.length} leads únicos encontrados.`);
            }

        } catch (error) {
            console.error("Critical Search Error:", error);
            setStatusMessage('Erro ao conectar com o Google AI.');
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
                
                await sendWhatsAppMessage(lead.phone, personalizedMsg);
                
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
        <div className="flex flex-col relative h-full">
            {/* Modal de Configuração de Mensagem */}
            {automationStatus === 'configuring' && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
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
                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                            <button onClick={() => setAutomationStatus('idle')} className="px-4 py-2 text-text-secondary hover:text-text-primary">Cancelar</button>
                            <button onClick={handleStartAutomation} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium">Iniciar Automação</button>
                        </div>
                    </div>
                </div>
            )}

             {/* Barra de Progresso */}
             {automationStatus === 'sending' && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 flex-col backdrop-blur-md">
                    <div className="w-64 bg-white/10 rounded-full h-4 mb-4">
                        <div className="bg-primary h-4 rounded-full transition-all duration-300" style={{width: `${sendingProgress}%`}}></div>
                    </div>
                    <p className="text-white font-bold">Importando... {sendingProgress}%</p>
                </div>
             )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 shrink-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2">
                    <MapPinIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> 
                    <span className="truncate">Captação Inteligente</span>
                </h2>
            </div>

            <div className="bg-surface p-4 sm:p-6 rounded-lg shadow-lg border border-white/10 mb-6 shrink-0">
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
                            placeholder="Ex: São Paulo, SP"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!keyword || !location || isSearching}
                        className="w-full md:w-auto bg-primary text-white px-8 py-2.5 rounded-md shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium min-w-[140px]"
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
                    <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/20 gap-3 shrink-0">
                        <h3 className="font-bold text-text-primary">Resultados ({results.length})</h3>
                        <div className="flex gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <button 
                                onClick={() => setResults(prev => prev.map(r => ({ ...r, selected: true })))}
                                className="text-xs text-text-secondary hover:text-primary underline"
                            >
                                Selecionar Todos
                            </button>
                            <button 
                                onClick={() => setAutomationStatus('configuring')}
                                disabled={selectedCount === 0}
                                className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 shadow-lg font-medium flex items-center gap-2"
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Importar para CRM</span>
                                <span className="sm:hidden">Importar</span>
                                ({selectedCount})
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start custom-scrollbar">
                        {results.map((lead) => (
                            <div 
                                key={lead.id} 
                                className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${lead.selected ? 'bg-primary/10 border-primary' : 'bg-background/50 border-white/10 hover:border-white/30'}`}
                                onClick={() => toggleSelection(lead.id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-text-primary truncate w-full pr-8">{lead.name}</h4>
                                    <div className={`absolute top-4 right-4 w-5 h-5 rounded border flex items-center justify-center ${lead.selected ? 'bg-primary border-primary' : 'border-text-secondary'}`}>
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
