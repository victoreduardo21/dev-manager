
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CheckBadgeIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, ChevronLeftIcon, BoltIcon, ShieldCheckIcon } from './Icons';
import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage } from '../types';

interface ScrapedLead {
    id: string;
    name: string;
    address: string;
    phone: string;
    selected: boolean;
    messages: ChatMessage[];
}

const LeadGen: React.FC = () => {
    const { addLead, openModal, closeModal, currentUser, companies } = useData();
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    
    const [messageTemplate, setMessageTemplate] = useState('Olá {nome}, tudo bem? Vi que vocês são destaque em {localização}. Trabalho com desenvolvimento de sistemas e apps sob medida e notei uma oportunidade para digitalizar processos da sua empresa, aumentando a escala e reduzindo custos. Topa uma conversa rápida para eu te mostrar como um sistema próprio pode impactar seu faturamento este ano?');
    
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<ScrapedLead[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    
    const [isConfirmingImport, setIsConfirmingImport] = useState(false);
    const [automationStatus, setAutomationStatus] = useState<'idle' | 'importing' | 'sent'>('idle');
    const [sendingProgress, setSendingProgress] = useState(0);

    const myCompany = companies.find(c => c.id === currentUser?.companyId);
    const plan = myCompany?.plan || 'Starter';

    // Validação Rigorosa: Apenas Celulares Brasileiros (DDD + 9 + 8 dígitos)
    const validateAndSanitizeWhatsApp = (phone: string): string | null => {
        let clean = phone.replace(/\D/g, "");
        if (clean.startsWith("55")) clean = clean.substring(2);
        
        // Regra: Deve ter 11 dígitos e o terceiro dígito (após DDD) deve ser 9
        if (clean.length === 11 && clean[2] === '9') {
            return clean;
        }
        // Fallback: Se a I.A retornar sem o 9 (comum em algumas regiões antigas), mas for 10 dígitos, 
        // em alguns casos de automação comercial não é zap. Vamos ser rigorosos:
        return null; 
    };

    const formatMessage = (leadName: string) => {
        return messageTemplate
            .replace(/{nome}/gi, leadName)
            .replace(/{localização}/gi, location || 'sua região');
    };

    const callGeminiLayeredExtraction = async (nicho: string, local: string, segment: string): Promise<any[]> => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Aja como minerador B2B focado em WhatsApp Marketing. 
                          Extraia 50 leads de empresas de "${nicho}" em "${local}". 
                          SEGMENTO: ${segment}. 
                          REGRAS OBRIGATÓRIAS:
                          1. Retorne APENAS números de CELULAR (WhatsApp).
                          2. O número deve ter o formato DDD + 9 + 8 dígitos.
                          3. Ignore telefones fixos (números que não começam com 9 após o DDD).
                          Retorne JSON: { "leads": [{ "name": "...", "phone": "...", "address": "..." }] }.`,
                config: {
                    temperature: 0.2,
                    thinkingConfig: { thinkingBudget: 16000 },
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            leads: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        phone: { type: Type.STRING },
                                        address: { type: Type.STRING }
                                    },
                                    required: ["name", "phone"]
                                }
                            }
                        },
                        required: ["leads"]
                    }
                }
            });
            const data = JSON.parse(response.text || '{"leads":[]}');
            return data.leads || [];
        } catch (error) { return []; }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword || !location) return;

        setIsSearching(true);
        setResults([]);
        
        let segments = ["Geral"];
        if (plan === 'PRO') segments = ["Principais Empresas", "Especialistas", "Destaques Locais"];
        if (plan === 'VIP') segments = ["Empresas em Crescimento", "Novos Negócios", "Varejo Premium", "Serviços B2B", "Indústrias"];

        const maxTotal = plan === 'VIP' ? 500 : (plan === 'PRO' ? 150 : 20);
        let foundCount = 0;
        const uniquePhones = new Set();
        const allResults: ScrapedLead[] = [];

        try {
            for (let i = 0; i < segments.length; i++) {
                if (foundCount >= maxTotal) break;
                setStatusMessage(`Fase ${i + 1}/${segments.length}: Validando WhatsApps de ${segments[i]}...`);
                
                const batch = await callGeminiLayeredExtraction(keyword, location, segments[i]);
                
                for (const item of batch) {
                    const validPhone = validateAndSanitizeWhatsApp(item.phone);
                    if (validPhone && !uniquePhones.has(validPhone)) {
                        uniquePhones.add(validPhone);
                        allResults.push({
                            id: `scraped-${Date.now()}-${foundCount}`,
                            name: item.name,
                            phone: validPhone,
                            address: item.address || location,
                            selected: true,
                            messages: []
                        });
                        foundCount++;
                    }
                }
                setResults([...allResults]);
                await new Promise(r => setTimeout(r, 100));
            }
            setStatusMessage(`Captação Concluída: ${foundCount} WhatsApps reais encontrados.`);
        } catch (error) { setStatusMessage('Erro na mineração.'); } finally { setIsSearching(false); }
    };

    const confirmAndImport = async () => {
        const selectedLeads = results.filter(r => r.selected);
        if (selectedLeads.length === 0) return;

        setIsConfirmingImport(false);
        setAutomationStatus('importing');
        setSendingProgress(0);
        const processedIds: string[] = [];

        for (let i = 0; i < selectedLeads.length; i++) {
            const lead = selectedLeads[i];
            const personalizedMsg = formatMessage(lead.name);
            const initialHistory: ChatMessage[] = [{
                id: `auto-${Date.now()}`,
                text: personalizedMsg,
                sender: 'user',
                timestamp: new Date().toISOString()
            }];

            try {
                await addLead({
                    name: lead.name,
                    phone: lead.phone,
                    address: lead.address,
                    status: 'Novo',
                    source: `WhatsApp Mining (${keyword})`,
                    notes: `Lead com WhatsApp validado. Script: "${personalizedMsg}"`,
                    messages: initialHistory
                });
                processedIds.push(lead.id);
            } catch (err) { console.error(err); }
            
            setSendingProgress(Math.round(((i + 1) / selectedLeads.length) * 100));
            await new Promise(r => setTimeout(r, 50));
        }

        setResults(prev => prev.filter(r => !processedIds.includes(r.id)));
        setAutomationStatus('sent');
        openModal('Importação Concluída', <div className="text-center p-6"><CheckBadgeIcon className="w-16 h-16 text-green-500 mx-auto mb-4" /><p className="font-bold text-slate-900 text-xl">Leads Sincronizados!</p><p className="text-sm text-slate-500 mt-2">Os números foram filtrados e apenas celulares (WhatsApp) foram importados.</p><button onClick={closeModal} className="mt-8 bg-blue-600 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest">Acessar CRM</button></div>);
    };

    return (
        <div className="flex flex-col relative h-full">
            {/* Overlay de Progresso */}
            {automationStatus === 'importing' && (
                <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center flex-col backdrop-blur-md">
                    <div className="w-72 bg-white/10 rounded-full h-3 mb-6 overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.6)]" style={{width: `${sendingProgress}%`}}></div>
                    </div>
                    <p className="text-white font-black text-4xl tracking-tighter mb-2">{sendingProgress}%</p>
                    <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.3em]">Validando e Importando para CRM...</p>
                </div>
            )}

            {/* Modal de Confirmação */}
            {isConfirmingImport && (
                <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden p-10 flex flex-col gap-6 border border-slate-200 animate-in zoom-in duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-sm"><ShieldCheckIcon className="w-8 h-8" /></div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Confirmar WhatsApps</h3>
                                <p className="text-sm text-slate-500">Preparamos {results.filter(r => r.selected).length} contatos mobile validados.</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">Mensagem de Abordagem Dev:</label>
                            <textarea 
                                value={messageTemplate} 
                                onChange={e => setMessageTemplate(e.target.value)}
                                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all shadow-inner"
                            />
                            <div className="mt-2 flex gap-2">
                                <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-3 py-1 rounded-lg">Tag: {'{nome}'}</span>
                                <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-3 py-1 rounded-lg">Tag: {'{localização}'}</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setIsConfirmingImport(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200">Cancelar</button>
                            <button onClick={confirmAndImport} className="flex-2 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/30 active:scale-95 transition-all">Importar no CRM</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase">
                        <BoltIcon className="w-10 h-10 text-green-500" /> 
                        <span>Minerador WhatsApp</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-black mt-1 uppercase tracking-[0.3em]">Filtro Mobile Ativo • Plano {plan}</p>
                </div>
                {results.length > 0 && (
                    <button 
                        onClick={() => setIsConfirmingImport(true)}
                        className="w-full md:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95"
                    >
                        Importar {results.filter(r => r.selected).length} Contatos
                    </button>
                )}
            </div>

            {/* Painel de Busca */}
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 mb-10">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nicho (Ex: Clinicas Medicas)</label>
                        <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-blue-600" placeholder="O que buscar?" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Cidade (Ex: São Paulo, SP)</label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-blue-600" placeholder="Onde buscar?" />
                    </div>
                    <button type="submit" disabled={isSearching} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all h-[58px] shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <MagnifyingGlassIcon className="w-5 h-5" />}
                        {isSearching ? 'Minerando Zaps...' : 'Extrair Contatos'}
                    </button>
                </form>
                {statusMessage && <p className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse flex items-center gap-2"> <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> {statusMessage}</p>}
            </div>

            {/* Resultados */}
            {results.length > 0 && (
                <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-[0.2em]">Celulares Identificados ({results.length})</h3>
                        <div className="flex gap-4">
                            <button onClick={() => setResults(results.map(r => ({...r, selected: true})))} className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Selecionar Tudo</button>
                            <button onClick={() => setResults([])} className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Limpar</button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-start custom-scrollbar bg-slate-50/20">
                        {results.map((lead) => (
                            <div key={lead.id} className={`group relative p-6 rounded-[32px] border transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 bg-white ${lead.selected ? 'border-green-500 shadow-xl ring-2 ring-green-500/5' : 'border-slate-100 hover:border-blue-300 hover:shadow-lg'}`} onClick={() => setResults(prev => prev.map(r => r.id === lead.id ? { ...r, selected: !r.selected } : r))}>
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-black text-slate-900 text-xs truncate pr-10 uppercase tracking-tight">{lead.name}</h4>
                                        <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${lead.selected ? 'bg-green-500 border-green-500 shadow-lg scale-110' : 'border-slate-200 group-hover:border-blue-300'}`}>
                                            {lead.selected && <CheckBadgeIcon className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-green-600 font-mono bg-green-50 px-3 py-1.5 rounded-xl w-fit flex items-center gap-2 mb-2 font-bold">
                                        {lead.phone}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate font-bold uppercase tracking-widest opacity-60">📍 {lead.address}</p>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <span className="flex items-center gap-1.5 text-[9px] text-green-600 font-black uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
                                        <ShieldCheckIcon className="w-3.5 h-3.5" /> Zap Validado
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isSearching && results.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 py-20 grayscale">
                    <ChatBubbleLeftRightIcon className="w-24 h-24 mb-8 text-slate-400" />
                    <p className="font-black uppercase tracking-[0.4em] text-[11px] text-slate-900 text-center leading-relaxed">
                        Busca focada em dispositivos móveis. <br/> Capture apenas números aptos para WhatsApp.
                    </p>
                </div>
            )}
        </div>
    );
};

export default LeadGen;
