import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { MapPinIcon, CheckBadgeIcon, PaperAirplaneIcon, ExclamationTriangleIcon } from './Icons';
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
    const [errors, setErrors] = useState<string[]>([]);

    const callGeminiDirect = async (prompt: string): Promise<string> => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text || "";
        } catch (error) {
            console.error("Gemini API Error:", error);
            return "";
        }
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
                    
                    Format: NAME | PHONE | ADDRESS
                    
                    Example:
                    ${letterBatches[i].split(',')[0]} Company | 11 99999-9999 | Rua Exemplo, SP
                    
                    Rules:
                    1. NO Markdown. NO Tables. NO numbering.
                    2. PHONE IS MANDATORY. Skip if no phone.
                    3. DO NOT INCLUDE COUNTRY CODE. Return ONLY the Area Code (DDD) + Number. Example: "11 99999-9999". Do NOT put "+55".
                    4. Focus on local businesses.
                    5. RETURN ONLY THE NUMBER. Do NOT include text labels like "Tel:", "Phone:", "Cel:", "Zap:", "WhatsApp:", "Contato:".
                    6. If the phone has an extension (ramal), REMOVE IT. Keep only the main number.
                `;

                try {
                    const textResponse = await callGeminiDirect(prompt);
                    const lines = textResponse.split('\n');
                    
                    for (const line of lines) {
                        if (line.includes('|')) {
                            const parts = line.split('|').map(p => p.trim());
                            if (parts.length >= 2) {
                                const name = parts[0].replace(/[*#-]/g, '').trim(); 
                                let phone = parts[1].trim();
                                const address = parts[2] || location;
                                
                                // --- LIMPEZA AVANÇADA DE TELEFONE (CORREÇÃO DE ERRO E FORMATO) ---
                                
                                // 1. Remove rótulos de texto
                                phone = phone.replace(/^((Tel|Phone|Cel|Zap|WhatsApp|Contato|Comercial|Fixo)(\s?:|.)?)\s*/i, "");

                                // 2. Remove código do país (+55 ou 55) se estiver no início
                                // Remove "+55"
                                phone = phone.replace(/^\+55\s?/, "");
                                // Remove "55 " (com espaço, para não remover DDD 55)
                                if (phone.startsWith("55") && phone.length > 11) {
                                    phone = phone.substring(2).trim();
                                }

                                // 3. Remove QUALQUER sinal de '+' restante (causa erro #ERROR! no Sheets)
                                phone = phone.replace(/\+/g, "");

                                // 4. Limpeza final: remove tudo que não for dígito, espaço ou traço/parenteses
                                phone = phone.replace(/[^\d\-\(\)\s]/g, "").trim();

                                // Verifica validade mínima (pelo menos 8 dígitos)
                                const digitsOnly = phone.replace(/\D/g, "");
                                
                                if (digitsOnly.length >= 8 && !uniquePhones.has(digitsOnly)) {
                                    if (!languageDetected) {
                                        if (location.toLowerCase().includes('brasil') || location.toLowerCase().includes('brazil')) {
                                            setMessageTemplate(MSG_TEMPLATE_PT);
                                        } else {
                                            setMessageTemplate(MSG_TEMPLATE_EN);
                                        }
                                        languageDetected = true;
                                    }

                                    uniquePhones.add(digitsOnly);
                                    accumulatedLeads.push({
                                        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                        name: name,
                                        phone: phone, // Agora limpo: ex "13 3219-5915"
                                        address: address,
                                        selected: true
                                    });
                                }
                            }
                        }
                    }
                    
                    setResults([...accumulatedLeads]);
                    // Pequeno delay para evitar rate limit
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
        setErrors([]);

        const processedIds: string[] = [];
        const currentErrors: string[] = [];

        for (let i = 0; i < selectedLeads.length; i++) {
            const lead = selectedLeads[i];
            let whatsappSent = false;
            let whatsappError = null;

            // 1. Tentar enviar WhatsApp
            try {
                const personalizedMsg = messageTemplate.replace('{nome}', lead.name);
                whatsappSent = await sendWhatsAppMessage(lead.phone, personalizedMsg);
                if (!whatsappSent) {
                    whatsappError = "Falha no envio do Zap";
                }
            } catch (wsErr: any) {
                whatsappError = wsErr.message || "Erro no envio";
                console.warn(`Erro WhatsApp para ${lead.name}:`, wsErr);
            }

            // 2. Salvar no CRM (Independente do WhatsApp falhar, queremos salvar o lead)
            try {
                const personalizedMsg = messageTemplate.replace('{nome}', lead.name);
                
                // IMPORTANTE: Garantir que o telefone enviado não tenha '+' para não quebrar o Sheets
                const safePhone = lead.phone.replace(/\+/g, '');

                await addLead({
                    name: lead.name,
                    phone: safePhone,
                    address: lead.address,
                    status: 'Novo',
                    source: `Deep Search (${keyword})`,
                    notes: `Local: ${location}. ${whatsappError ? `Erro Zap: ${whatsappError}` : 'Zap Enviado.'}`,
                    messages: [{
                        id: `msg-${Date.now()}-${i}`,
                        sender: 'user',
                        text: personalizedMsg,
                        timestamp: new Date().toISOString()
                    }]
                });
                
                processedIds.push(lead.id);

            } catch (crmErr: any) {
                console.error(`Falha ao salvar lead ${lead.name} no CRM:`, crmErr);
                currentErrors.push(`${lead.name}: Erro ao salvar no banco de dados.`);
            }

            if (whatsappError) {
                // Não adicionamos ao currentErrors principal para não assustar o usuário se o lead foi salvo
            }

            setSendingProgress(Math.round(((i + 1) / selectedLeads.length) * 100));
            // Delay para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Remove os leads que foram processados com sucesso da lista de resultados
        setResults(prev => prev.filter(r => !processedIds.includes(r.id)));
        
        if (currentErrors.length > 0) {
            setErrors(currentErrors);
        }
        
        setAutomationStatus('sent');
        
        openModal('Processamento Concluído', (
            <div className="text-center">
                {currentErrors.length > 0 ? (
                    <>
                        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <p className="font-bold text-text-primary mb-2">Processo finalizado com alguns erros.</p>
                        <p className="text-sm text-text-secondary mb-4">{processedIds.length} leads salvos com sucesso.</p>
                        <div className="bg-background/50 p-3 rounded text-left max-h-32 overflow-y-auto text-xs text-red-400 mb-4 border border-red-500/20">
                            {currentErrors.map((err, idx) => <div key={idx} className="mb-1 border-b border-red-500/10 pb-1">{err}</div>)}
                        </div>
                    </>
                ) : (
                    <>
                        <CheckBadgeIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="font-bold text-text-primary">Sucesso!</p>
                        <p className="text-text-secondary">Todos os {processedIds.length} leads foram importados.</p>
                    </>
                )}
                <button onClick={() => { setAutomationStatus('idle'); openModal('', null); }} className="bg-primary text-white px-6 py-2 rounded w-full mt-4 hover:bg-primary/90 transition-colors">Fechar</button>
            </div>
        ));
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
                            className="w-full px-3 py-2 bg-background border border-white/20 rounded-md text-text-primary mb-2 focus:border-primary outline-none resize-none"
                        />
                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                            <button onClick={() => setAutomationStatus('idle')} className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                            <button onClick={handleStartAutomation} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium shadow-lg shadow-green-900/20 transition-all">Iniciar Automação</button>
                        </div>
                    </div>
                </div>
            )}

             {/* Barra de Progresso */}
             {automationStatus === 'sending' && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 flex-col backdrop-blur-md">
                    <div className="w-64 bg-white/10 rounded-full h-4 mb-4 overflow-hidden border border-white/5">
                        <div className="bg-primary h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{width: `${sendingProgress}%`}}></div>
                    </div>
                    <p className="text-white font-bold text-lg">Importando... {sendingProgress}%</p>
                    <p className="text-xs text-white/50 mt-2 animate-pulse">Por favor, não feche esta janela.</p>
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
                            className="w-full px-4 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary focus:border-primary outline-none placeholder:text-text-secondary/30"
                            placeholder="Ex: Pizzaria, Advogados"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Cidade / Região</label>
                        <input 
                            type="text" 
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="w-full px-4 py-2 bg-background/50 border border-white/20 rounded-md text-text-primary focus:border-primary outline-none placeholder:text-text-secondary/30"
                            placeholder="Ex: São Paulo, SP"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!keyword || !location || isSearching}
                        className="w-full md:w-auto bg-primary text-white px-8 py-2.5 rounded-md shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium min-w-[140px] disabled:cursor-not-allowed"
                    >
                        {isSearching ? 'Buscando...' : 'Buscar Leads'}
                    </button>
                </form>
                
                {isSearching && (
                    <div className="mt-4 text-sm text-text-primary animate-pulse flex items-center gap-2 bg-primary/10 p-2 rounded border border-primary/20 w-fit">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        {statusMessage}
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="flex-1 flex flex-col bg-surface rounded-lg border border-white/10 overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/20 gap-3 shrink-0">
                        <h3 className="font-bold text-text-primary text-lg">Resultados ({results.length})</h3>
                        <div className="flex gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <button 
                                onClick={() => setResults(prev => prev.map(r => ({ ...r, selected: true })))}
                                className="text-xs text-text-secondary hover:text-primary underline transition-colors"
                            >
                                Selecionar Todos
                            </button>
                            <button 
                                onClick={() => setAutomationStatus('configuring')}
                                disabled={selectedCount === 0}
                                className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 shadow-lg font-medium flex items-center gap-2 transition-all disabled:cursor-not-allowed"
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Importar para CRM</span>
                                <span className="sm:hidden">Importar</span>
                                ({selectedCount})
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start custom-scrollbar bg-background/30">
                        {results.map((lead) => (
                            <div 
                                key={lead.id} 
                                className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${lead.selected ? 'bg-primary/10 border-primary shadow-md' : 'bg-surface border-white/10 hover:border-white/30 hover:bg-surface/80'}`}
                                onClick={() => toggleSelection(lead.id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-text-primary truncate w-full pr-8" title={lead.name}>{lead.name}</h4>
                                    <div className={`absolute top-4 right-4 w-5 h-5 rounded border flex items-center justify-center transition-colors ${lead.selected ? 'bg-primary border-primary' : 'border-text-secondary bg-transparent'}`}>
                                        {lead.selected && <CheckBadgeIcon className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-sm text-text-secondary flex items-center gap-2 font-mono bg-black/10 p-1 rounded w-fit">
                                        📞 {lead.phone}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-1 truncate flex items-center gap-2" title={lead.address}>
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