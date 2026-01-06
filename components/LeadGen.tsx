
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
    CheckBadgeIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon, 
    BoltIcon, ShieldCheckIcon, StarIcon, PhoneIcon, WhatsAppIcon,
    CurrencyDollarIcon, ExclamationTriangleIcon
} from './Icons';
import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage } from '../types';

interface ScrapedLead {
    id: string;
    name: string;
    address: string;
    phone: string;
    contactType: 'whatsapp' | 'phone';
    selected: boolean;
    qualityScore: number;
    potentialValue: number;
    messages: ChatMessage[];
}

const LeadGen: React.FC = () => {
    const { addLead, openModal, closeModal, currentUser, companies, checkPlanLimits } = useData();
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    
    const [messageTemplate, setMessageTemplate] = useState('Olá {nome}, tudo bem? Vi que vocês são destaque em {localização}. Trabalho com desenvolvimento de sistemas e apps sob medida e notei uma oportunidade para digitalizar processos da sua empresa. Topa uma conversa rápida para eu te mostrar como um sistema próprio pode impactar seu faturamento?');
    
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<ScrapedLead[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    
    const [isConfirmingImport, setIsConfirmingImport] = useState(false);
    const [automationStatus, setAutomationStatus] = useState<'idle' | 'importing' | 'sent'>('idle');
    const [sendingProgress, setSendingProgress] = useState(0);

    const myCompany = companies.find(c => c.id === currentUser?.companyId);
    const plan = myCompany?.plan || 'Starter';

    const totalPotentialValue = useMemo(() => {
        return results.filter(r => r.selected).reduce((acc, curr) => acc + curr.potentialValue, 0);
    }, [results]);

    // Lógica aprimorada para detectar se é WhatsApp (Celular) ou Fixo
    const processContact = (phoneRaw: any, suggestedType?: string): { phone: string, type: 'whatsapp' | 'phone' } | null => {
        let clean = String(phoneRaw || '').replace(/[^\d+]/g, "");
        
        // Se for número brasileiro (+55 ou sem prefixo mas com DDD)
        const isBrazil = clean.startsWith("55") || (clean.length >= 10 && clean.length <= 11 && !clean.startsWith("+"));
        let finalClean = clean;
        if (isBrazil && !clean.startsWith("55")) finalClean = "55" + clean;

        // Regra Brasil: DDD + 9 dígitos = Celular/WhatsApp. DDD + 8 dígitos = Fixo.
        const numericOnly = finalClean.replace("55", "");
        
        if (isBrazil) {
            if (numericOnly.length === 11 && numericOnly[2] === "9") {
                return { phone: finalClean, type: 'whatsapp' };
            } else if (numericOnly.length === 10) {
                return { phone: finalClean, type: 'phone' };
            }
        }

        // Se for internacional, confiamos na sugestão da I.A. ou no comprimento
        if (suggestedType === 'whatsapp' || clean.length >= 12) {
            return { phone: clean, type: 'whatsapp' };
        }
        
        return { phone: clean, type: 'phone' };
    };

    const formatMessage = (leadName: string) => {
        return messageTemplate
            .replace(/{nome}/gi, leadName)
            .replace(/{localização}/gi, location || 'sua região');
    };

    const callGeminiHybridMining = async (nicho: string, local: string, segment: string): Promise<any[]> => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Aja como um Especialista em Inteligência de Mercado Global.
                          Extraia contatos comerciais REAIS para "${nicho}" em "${local}". 
                          FOCO: ${segment}.
                          
                          IDENTIFICAÇÃO DE TELEFONE (CRÍTICO):
                          1. Diferencie Celular/WhatsApp de Telefone Fixo.
                          2. No Brasil: 11 dígitos começando com 9 é 'whatsapp'. 10 dígitos é 'phone' (fixo).
                          
                          VALOR ESTIMADO:
                          Atribua um 'potentialValue' (em Reais) baseado no tamanho da empresa: Pequena (5k-15k), Média (20k-50k), Grande (80k+).
                          
                          Retorne JSON: { "leads": [{ "name": "...", "phone": "...", "contactType": "whatsapp" | "phone", "address": "...", "score": 1-5, "potentialValue": number }] }.`,
                config: {
                    temperature: 0.1,
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
                                        contactType: { type: Type.STRING },
                                        address: { type: Type.STRING },
                                        score: { type: Type.INTEGER },
                                        potentialValue: { type: Type.NUMBER }
                                    },
                                    required: ["name", "phone", "contactType", "potentialValue"]
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
        
        let segments = ["High Growth Companies", "Regional Highlights"];
        if (plan === 'PRO') segments = ["Industry Leaders", "Enterprise Groups", "Expanding Businesses"];
        if (plan === 'VIP') segments = ["Global Players", "Large Manufacturers", "Logistics & Ports", "International Chains"];

        const maxSearch = plan === 'VIP' ? 100 : (plan === 'PRO' ? 50 : 20);
        let foundCount = 0;
        const uniquePhones = new Set();
        const allResults: ScrapedLead[] = [];

        try {
            for (let i = 0; i < segments.length; i++) {
                if (foundCount >= maxSearch) break;
                setStatusMessage(`Escaneando potencial em ${segments[i]}...`);
                
                const batch = await callGeminiHybridMining(keyword, location, segments[i]);
                
                for (const item of batch) {
                    if (foundCount >= maxSearch) break;
                    const contact = processContact(item.phone, item.contactType);
                    if (contact && !uniquePhones.has(contact.phone)) {
                        uniquePhones.add(contact.phone);
                        allResults.push({
                            id: `scraped-${Date.now()}-${foundCount}`,
                            name: item.name,
                            phone: contact.phone,
                            contactType: contact.type, // Aqui já vem classificado corretamente
                            address: item.address || location,
                            selected: true,
                            qualityScore: item.score || 3,
                            potentialValue: item.potentialValue || 0,
                            messages: []
                        });
                        foundCount++;
                    }
                }
                setResults([...allResults].sort((a, b) => b.potentialValue - a.potentialValue));
                await new Promise(r => setTimeout(r, 200));
            }
            setStatusMessage(`Varredura concluída. ${foundCount} oportunidades mapeadas.`);
        } catch (error) { setStatusMessage('Erro na mineração global.'); } finally { setIsSearching(false); }
    };

    const confirmAndImport = async () => {
        const selectedLeads = results.filter(r => r.selected);
        if (selectedLeads.length === 0) return;

        if (!checkPlanLimits('leads')) {
            openModal('Limite de Plano Excedido', (
                <div className="text-center p-6">
                    <ExclamationTriangleIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ops! Limite Mensal Atingido</h3>
                    <p className="text-slate-500 mb-6">Seu plano ({plan}) permite captar até {plan === 'Starter' ? '50' : '250'} leads por mês. Você já atingiu este volume.</p>
                    <button onClick={closeModal} className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest">Entendi</button>
                </div>
            ));
            return;
        }

        setIsConfirmingImport(false);
        setAutomationStatus('importing');
        setSendingProgress(0);
        const processedIds: string[] = [];

        for (let i = 0; i < selectedLeads.length; i++) {
            const lead = selectedLeads[i];
            const personalizedMsg = formatMessage(lead.name);
            
            try {
                await addLead({
                    name: lead.name,
                    phone: lead.phone,
                    address: lead.address,
                    status: 'Novo',
                    source: `World Deep Miner`,
                    notes: `Tipo: ${lead.contactType === 'whatsapp' ? 'WhatsApp' : 'Fixo'}. Potencial: R$ ${lead.potentialValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}.`,
                    messages: lead.contactType === 'whatsapp' ? [{
                        id: `auto-${Date.now()}`,
                        text: personalizedMsg,
                        sender: 'user',
                        timestamp: new Date().toISOString()
                    }] : []
                });
                processedIds.push(lead.id);
            } catch (err) { console.error(err); }
            
            setSendingProgress(Math.round(((i + 1) / selectedLeads.length) * 100));
            if (i % 20 === 0) await new Promise(r => setTimeout(r, 10));
        }

        setResults(prev => prev.filter(r => !processedIds.includes(r.id)));
        setAutomationStatus('sent');
        openModal('Sucesso!', <div className="text-center p-6"><CheckBadgeIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" /><p className="font-bold text-slate-900 text-xl">Leads Importados!</p><button onClick={closeModal} className="mt-8 bg-blue-600 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest">Ver no CRM</button></div>);
    };

    return (
        <div className="flex flex-col relative h-full">
            {automationStatus === 'importing' && (
                <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center flex-col backdrop-blur-xl">
                    <div className="w-64 bg-white/10 rounded-full h-2 mb-6 overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-300" style={{width: `${sendingProgress}%`}}></div>
                    </div>
                    <p className="text-white font-black text-3xl">{sendingProgress}%</p>
                    <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.3em] mt-2">Classificando e Importando Leads...</p>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase">
                        <BoltIcon className="w-10 h-10 text-blue-600" /> 
                        <span>Deep Miner 2.0 <span className="text-blue-400 text-sm">(GLOBAL)</span></span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-black mt-1 uppercase tracking-[0.3em]">Scanner Mundial • Inteligência na Identificação de Fixo/Whats</p>
                </div>

                {results.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="bg-white border border-slate-200 px-6 py-3 rounded-3xl shadow-sm flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                <CurrencyDollarIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Potencial de Vendas</p>
                                <p className="text-xl font-black text-slate-900">R$ {totalPotentialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsConfirmingImport(true)}
                            className="bg-blue-600 text-white px-10 py-4 rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all w-full sm:w-auto"
                        >
                            Importar Selecionados
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 mb-10">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nicho Estratégico</label>
                        <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-blue-600" placeholder="Ex: Escritórios, Indústrias, Clinicas" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Cidade / País / Região</label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-blue-600" placeholder="Cidade ou Região" />
                    </div>
                    <button type="submit" disabled={isSearching} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all h-[58px] shadow-xl flex items-center justify-center gap-2">
                        {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <MagnifyingGlassIcon className="w-5 h-5" />}
                        {isSearching ? 'Mining...' : 'Pesquisar'}
                    </button>
                </form>
                {statusMessage && <p className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse"> {statusMessage}</p>}
            </div>

            {results.length > 0 && (
                <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-6">
                             <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-[0.2em]">Oportunidades ({results.length})</h3>
                             <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-[9px] font-black text-green-600 uppercase bg-green-50 px-2 py-1 rounded-lg">
                                    <WhatsAppIcon className="w-3 h-3" /> {results.filter(r => r.contactType === 'whatsapp').length} Whats
                                </span>
                                <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-lg">
                                    <PhoneIcon className="w-3 h-3" /> {results.filter(r => r.contactType === 'phone').length} Fixos
                                </span>
                             </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setResults(results.map(r => ({...r, selected: true})))} className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Todos</button>
                            <button onClick={() => setResults(results.map(r => ({...r, selected: r.contactType === 'whatsapp'})))} className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Só Whats</button>
                            <button onClick={() => setResults([])} className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Limpar</button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-start custom-scrollbar bg-slate-50/20">
                        {results.map((lead) => (
                            <div key={lead.id} className={`group relative p-6 rounded-[32px] border transition-all duration-300 cursor-pointer flex flex-col justify-between h-52 bg-white ${lead.selected ? 'border-blue-600 shadow-xl ring-2 ring-blue-600/5' : 'border-slate-100 hover:border-blue-300 hover:shadow-lg'}`} onClick={() => setResults(prev => prev.map(r => r.id === lead.id ? { ...r, selected: !r.selected } : r))}>
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-black text-slate-900 text-xs truncate pr-10 uppercase tracking-tight">{lead.name}</h4>
                                        <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${lead.selected ? 'bg-blue-600 border-blue-600 shadow-lg' : 'border-slate-200'}`}>
                                            {lead.selected && <CheckBadgeIcon className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                    <p className={`text-[11px] font-mono px-3 py-1.5 rounded-xl w-fit flex items-center gap-2 mb-2 font-bold ${lead.contactType === 'whatsapp' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {lead.contactType === 'whatsapp' ? <WhatsAppIcon className="w-3.5 h-3.5" /> : <PhoneIcon className="w-3.5 h-3.5" />}
                                        {lead.phone}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate font-bold uppercase tracking-widest opacity-60">📍 {lead.address}</p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Potencial Contrato</span>
                                        <span className="text-sm font-black text-slate-900">R$ {lead.potentialValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                    </div>
                                    <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${lead.qualityScore >= 4 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                                        {lead.qualityScore >= 4 ? <ShieldCheckIcon className="w-3.5 h-3.5" /> : null}
                                        {lead.qualityScore >= 4 ? 'Elite' : 'Padrão'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isSearching && results.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 py-20 grayscale">
                    <CurrencyDollarIcon className="w-24 h-24 mb-8 text-slate-400" />
                    <p className="font-black uppercase tracking-[0.4em] text-[11px] text-slate-900 text-center leading-relaxed">
                        Inteligência Artificial de Captação. <br/> Identificação automática de WhatsApp e Telefone Fixo.
                    </p>
                </div>
            )}

            {isConfirmingImport && (
                <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden p-10 flex flex-col gap-6 border border-slate-200 animate-in zoom-in duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><BoltIcon className="w-8 h-8" /></div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Importar Oportunidades</h3>
                                <p className="text-sm text-slate-500">Mapeamos {results.filter(r => r.selected && r.contactType === 'whatsapp').length} contatos de WhatsApp para abordagem.</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">Mensagem (Apenas para Whats):</label>
                            <textarea 
                                value={messageTemplate} 
                                onChange={e => setMessageTemplate(e.target.value)}
                                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all shadow-inner"
                            />
                            <p className="text-[9px] text-slate-400 mt-2 italic">* Leads de Telefone Fixo serão importados sem mensagem automática.</p>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setIsConfirmingImport(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Voltar</button>
                            <button onClick={confirmAndImport} className="flex-2 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Finalizar Importação</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadGen;
