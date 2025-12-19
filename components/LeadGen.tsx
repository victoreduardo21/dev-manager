
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { MapPinIcon, CheckBadgeIcon, PaperAirplaneIcon, ExclamationTriangleIcon, TrashIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface ScrapedLead {
    id: string;
    name: string;
    address: string;
    phone: string;
    selected: boolean;
}

const LeadGen: React.FC = () => {
    const { addLead, openModal, sendWhatsAppMessage, currentUser, companies, leads: existingLeadsInCRM } = useData();
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<ScrapedLead[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    
    const [automationStatus, setAutomationStatus] = useState<'idle' | 'configuring' | 'sending' | 'sent'>('idle');
    
    const MSG_TEMPLATE_PT = 'Olá {nome}, vi sua empresa no Google e gostaria de apresentar uma oportunidade.';
    const MSG_TEMPLATE_EN = 'Hello {nome}, I found your business on Google and would like to present an opportunity.';

    const [messageTemplate, setMessageTemplate] = useState(MSG_TEMPLATE_PT);
    const [sendingProgress, setSendingProgress] = useState(0);

    const myCompany = companies.find(c => c.id === currentUser?.companyId);
    const isStarter = myCompany?.plan === 'Starter';

    const callGeminiDirect = async (prompt: string): Promise<string> => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
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
        
        let foundCount = 0;
        const LIMIT_STARTER = 50;
        
        try {
            const letterBatches = ["A, B, C", "D, E, F", "G, H, I", "J, K, L", "M, N, O", "P, Q, R", "S, T, U", "V, W, X, Y, Z"];
            const uniquePhones = new Set();
            let languageDetected = false;

            for (let i = 0; i < letterBatches.length; i++) { 
                if (isStarter && foundCount >= LIMIT_STARTER) {
                    setStatusMessage(`Limite de 50 leads do plano Starter atingido.`);
                    break;
                }

                setStatusMessage(`Buscando lote ${i+1}... (${foundCount} encontrados)`);
                
                const prompt = `
                    Act as a data scraper. I need business leads for: "${keyword}" in "${location}".
                    Batch filter: Names starting with ${letterBatches[i]}.
                    Format: NAME | PHONE | ADDRESS
                    Phone is mandatory. Return ONLY numbers.
                `;

                try {
                    const textResponse = await callGeminiDirect(prompt);
                    const lines = textResponse.split('\n');
                    const newLeads: ScrapedLead[] = [];

                    for (const line of lines) {
                        if (isStarter && foundCount >= LIMIT_STARTER) break;
                        
                        if (line.includes('|')) {
                            const parts = line.split('|').map(p => p.trim());
                            if (parts.length >= 2) {
                                const name = parts[0].replace(/[*#-]/g, '').trim(); 
                                let phone = parts[1].replace(/[^\d]/g, ""); // Apenas dígitos
                                const address = parts[2] || location;
                                
                                if (phone.length >= 8 && !uniquePhones.has(phone)) {
                                    if (!languageDetected) {
                                        const loc = location.toLowerCase();
                                        setMessageTemplate(loc.includes('usa') || loc.includes('uk') ? MSG_TEMPLATE_EN : MSG_TEMPLATE_PT);
                                        languageDetected = true;
                                    }

                                    uniquePhones.add(phone);
                                    newLeads.push({
                                        id: `scraped-${Date.now()}-${foundCount}`,
                                        name: name,
                                        phone: phone,
                                        address: address,
                                        selected: true
                                    });
                                    foundCount++;
                                }
                            }
                        }
                    }
                    
                    if (newLeads.length > 0) {
                        setResults(prev => [...prev, ...newLeads]);
                    }
                    await new Promise(r => setTimeout(r, 800)); 

                } catch (err) { console.warn(err); }
            }
            setStatusMessage(`Busca concluída! ${foundCount} leads encontrados.`);

        } catch (error) {
            setStatusMessage('Erro na varredura.');
        } finally {
            setIsSearching(false);
        }
    };

    const toggleSelection = (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
    };

    const removeLeadResult = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setResults(prev => prev.filter(r => r.id !== id));
    };

    const clearResults = () => {
        if (confirm('Limpar todos os resultados da busca atual?')) {
            setResults([]);
            setStatusMessage('');
        }
    };

    const handleStartAutomation = async () => {
        const selectedLeads = results.filter(r => r.selected);
        if (selectedLeads.length === 0) return;

        // Verificação de limite Starter na importação
        if (isStarter) {
            const currentTotal = existingLeadsInCRM.length;
            if (currentTotal + selectedLeads.length > 50) {
                alert(`Ops! Você já tem ${currentTotal} leads no CRM. O plano Starter permite no máximo 50. Exclua leads antigos para liberar espaço.`);
                return;
            }
        }

        setAutomationStatus('sending');
        setSendingProgress(0);

        const processedIds: string[] = [];

        for (let i = 0; i < selectedLeads.length; i++) {
            const lead = selectedLeads[i];
            
            try {
                const personalizedMsg = messageTemplate.replace('{nome}', lead.name);
                await sendWhatsAppMessage(lead.phone, personalizedMsg);
                
                await addLead({
                    name: lead.name,
                    phone: lead.phone,
                    address: lead.address,
                    status: 'Novo',
                    source: `Deep Search (${keyword})`,
                    notes: `Importado via Captação Automática.`,
                    messages: [{
                        id: `msg-${Date.now()}-${i}`,
                        sender: 'user',
                        text: personalizedMsg,
                        timestamp: new Date().toISOString()
                    }]
                });
                
                processedIds.push(lead.id);
            } catch (crmErr) {
                console.error(crmErr);
            }

            setSendingProgress(Math.round(((i + 1) / selectedLeads.length) * 100));
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        setResults(prev => prev.filter(r => !processedIds.includes(r.id)));
        setAutomationStatus('sent');
        
        openModal('Importação Concluída', (
            <div className="text-center">
                <CheckBadgeIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="font-bold text-text-primary text-lg">Pronto!</p>
                <p className="text-text-secondary">{processedIds.length} leads foram enviados para o seu CRM.</p>
                <button onClick={() => { setAutomationStatus('idle'); openModal('', null); }} className="bg-primary text-white px-6 py-2 rounded-lg w-full mt-6 hover:bg-primary/90 font-bold">Ver no CRM</button>
            </div>
        ));
    };

    return (
        <div className="flex flex-col relative h-full">
            {automationStatus === 'configuring' && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-surface border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-text-primary uppercase tracking-tighter">
                            <PaperAirplaneIcon className="w-6 h-6 text-primary" /> Configurar Mensagem
                        </h3>
                        <textarea 
                            value={messageTemplate}
                            onChange={e => setMessageTemplate(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 bg-background border border-white/20 rounded-lg text-text-primary mb-4 focus:border-primary outline-none resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setAutomationStatus('idle')} className="px-4 py-2 text-text-secondary font-bold">Cancelar</button>
                            <button onClick={handleStartAutomation} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 font-bold">Importar Agora</button>
                        </div>
                    </div>
                </div>
            )}

             {automationStatus === 'sending' && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 flex-col backdrop-blur-md">
                    <div className="w-64 bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
                        <div className="bg-primary h-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.6)]" style={{width: `${sendingProgress}%`}}></div>
                    </div>
                    <p className="text-white font-black text-xl uppercase tracking-widest">{sendingProgress}%</p>
                    <p className="text-xs text-white/40 mt-2 font-bold uppercase tracking-tighter">Sincronizando Leads...</p>
                </div>
             )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                    <MapPinIcon className="w-8 h-8 text-primary" /> 
                    <span>Captação Inteligente</span>
                </h2>
                {isStarter && (
                    <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Plano Starter</span>
                        <div className="h-4 w-px bg-blue-500/20"></div>
                        <span className="text-[10px] font-bold text-text-primary uppercase tracking-tighter">Até 50 Leads</span>
                    </div>
                )}
            </div>

            <div className="bg-surface p-6 rounded-2xl shadow-lg border border-white/10 mb-6 shrink-0">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 opacity-60">O que você busca?</label>
                        <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} className="w-full px-4 py-2.5 bg-background/50 border border-white/20 rounded-xl text-text-primary focus:border-primary outline-none font-medium" placeholder="Ex: Escritório de Advocacia, Clínica..." />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 opacity-60">Onde?</label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-2.5 bg-background/50 border border-white/20 rounded-xl text-text-primary focus:border-primary outline-none font-medium" placeholder="Ex: Curitiba, PR" />
                    </div>
                    <button type="submit" disabled={!keyword || !location || isSearching} className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 font-black uppercase text-[10px] tracking-widest min-w-[160px]">
                        {isSearching ? 'Buscando...' : 'Iniciar Varredura'}
                    </button>
                </form>
                {statusMessage && <p className="mt-3 text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">{statusMessage}</p>}
            </div>

            {results.length > 0 && (
                <div className="flex-1 flex flex-col bg-surface rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/10">
                        <div className="flex items-center gap-4">
                            <h3 className="font-black text-text-primary text-xs uppercase tracking-widest">Resultados ({results.length})</h3>
                            <button onClick={clearResults} className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tighter">Limpar Tudo</button>
                        </div>
                        <button 
                            onClick={() => setAutomationStatus('configuring')}
                            disabled={results.filter(r => r.selected).length === 0}
                            className="bg-green-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 disabled:opacity-50 shadow-md transition-all"
                        >
                            Importar Selecionados ({results.filter(r => r.selected).length})
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start custom-scrollbar bg-slate-50">
                        {results.map((lead) => (
                            <div key={lead.id} className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer ${lead.selected ? 'bg-white border-primary shadow-lg ring-1 ring-primary/20' : 'bg-white border-white/10 hover:border-white/30'}`} onClick={() => toggleSelection(lead.id)}>
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-text-primary text-sm truncate pr-6 uppercase tracking-tight">{lead.name}</h4>
                                    <button 
                                        onClick={(e) => removeLeadResult(e, lead.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                        title="Remover da lista"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] text-text-secondary font-mono bg-slate-100 px-2 py-1 rounded w-fit">📞 {lead.phone}</p>
                                    <p className="text-[10px] text-text-secondary truncate opacity-70">📍 {lead.address}</p>
                                </div>
                                <div className={`absolute top-4 right-4 w-4 h-4 rounded border flex items-center justify-center transition-all ${lead.selected ? 'bg-primary border-primary' : 'border-slate-300 group-hover:border-primary'}`}>
                                    {lead.selected && <CheckBadgeIcon className="w-3 h-3 text-white" />}
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
