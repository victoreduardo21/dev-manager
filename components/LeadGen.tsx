
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CheckBadgeIcon, TrashIcon, MagnifyingGlassIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface ScrapedLead {
    id: string;
    name: string;
    address: string;
    phone: string;
    selected: boolean;
    isMobile: boolean; // Indica se é um celular (provável WhatsApp)
}

const LeadGen: React.FC = () => {
    const { addLead, openModal, currentUser, companies, leads: existingLeadsInCRM } = useData();
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<ScrapedLead[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    
    const [automationStatus, setAutomationStatus] = useState<'idle' | 'importing' | 'sent'>('idle');
    const [sendingProgress, setSendingProgress] = useState(0);

    const myCompany = companies.find(c => c.id === currentUser?.companyId);
    const isStarter = myCompany?.plan === 'Starter';

    // Função interna para validar se um número brasileiro é celular (provável WhatsApp)
    const validateWhatsAppNumber = (phone: string) => {
        const clean = phone.replace(/\D/g, "");
        // Padrão BR: 55 + DDD + 9 + 8 dígitos ou apenas DDD + 9 + 8 dígitos
        if (clean.length === 11) return clean[2] === '9'; // DDD + 9...
        if (clean.length === 13) return clean[4] === '9'; // 55 + DDD + 9...
        return false;
    };

    const callGeminiDirect = async (prompt: string): Promise<string> => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    temperature: 0.2,
                }
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
        setStatusMessage('Iniciando varredura profunda e validação...');
        
        let foundCount = 0;
        const LIMIT_STARTER = 50;
        
        try {
            const letterBatches = ["A-C", "D-G", "H-L", "M-P", "Q-T", "U-Z"];
            const uniquePhones = new Set();

            for (let i = 0; i < letterBatches.length; i++) { 
                if (isStarter && foundCount >= LIMIT_STARTER) {
                    setStatusMessage(`Limite de 50 leads do plano Starter atingido.`);
                    break;
                }

                setStatusMessage(`Validando empresas (${letterBatches[i]})... ${foundCount} válidos.`);
                
                const prompt = `
                    Você é um especialista em prospecção B2B. Extraia leads REAIS para o nicho "${keyword}" em "${location}".
                    FOCO: Apenas empresas ativas.
                    CRITÉRIO CONTATO: Priorize números de CELULAR (que começam com 9 após o DDD).
                    REGRAS:
                    1. Ignore números fixos (Ex: 3322-xxxx, 3030-xxxx).
                    2. Ignore números 0800 ou de suporte.
                    3. Retorne apenas se tiver certeza que o número é da empresa "${keyword}".
                    4. Formato obrigatório: NOME DA EMPRESA | TELEFONE COM DDD | ENDEREÇO
                    5. Filtro de iniciais: ${letterBatches[i]}.
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
                                let phone = parts[1].replace(/[^\d]/g, ""); 
                                const address = parts[2] || location;
                                
                                const isMobile = validateWhatsAppNumber(phone);
                                
                                if (phone.length >= 10 && !uniquePhones.has(phone)) {
                                    uniquePhones.add(phone);
                                    newLeads.push({
                                        id: `scraped-${Date.now()}-${foundCount}`,
                                        name: name,
                                        phone: phone,
                                        address: address,
                                        selected: isMobile,
                                        isMobile: isMobile
                                    });
                                    foundCount++;
                                }
                            }
                        }
                    }
                    
                    if (newLeads.length > 0) {
                        setResults(prev => [...prev, ...newLeads]);
                    }
                    await new Promise(r => setTimeout(r, 600)); 

                } catch (err) { console.warn(err); }
            }
            setStatusMessage(`Varredura concluída! ${foundCount} leads processados.`);

        } catch (error) {
            setStatusMessage('Erro na varredura inteligente.');
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

    const handleImportOnly = async () => {
        const selectedLeads = results.filter(r => r.selected);
        if (selectedLeads.length === 0) return;

        if (isStarter) {
            const currentTotal = existingLeadsInCRM.length;
            if (currentTotal + selectedLeads.length > 50) {
                alert(`Limite do plano Starter (50 leads) atingido.`);
                return;
            }
        }

        setAutomationStatus('importing');
        setSendingProgress(0);

        const processedIds: string[] = [];

        for (let i = 0; i < selectedLeads.length; i++) {
            const lead = selectedLeads[i];
            
            try {
                await addLead({
                    name: lead.name,
                    phone: lead.phone,
                    address: lead.address,
                    status: 'Novo',
                    source: `Deep Search (${keyword})`,
                    notes: `Importado via Captação Inteligente.`,
                    messages: []
                });
                
                processedIds.push(lead.id);
            } catch (crmErr) {
                console.error(crmErr);
            }

            setSendingProgress(Math.round(((i + 1) / selectedLeads.length) * 100));
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setResults(prev => prev.filter(r => !processedIds.includes(r.id)));
        setAutomationStatus('sent');
        
        openModal('Importação Concluída', (
            <div className="text-center">
                <CheckBadgeIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="font-bold text-text-primary text-lg">Sucesso!</p>
                <p className="text-text-secondary">{processedIds.length} leads foram movidos para o seu CRM.</p>
                <button onClick={() => { setAutomationStatus('idle'); openModal('', null); }} className="bg-primary text-white px-6 py-2 rounded-lg w-full mt-6 hover:bg-primary/90 font-bold">Ver no CRM</button>
            </div>
        ));
    };

    return (
        <div className="flex flex-col relative h-full">
             {automationStatus === 'importing' && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 flex-col backdrop-blur-md">
                    <div className="w-64 bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
                        <div className="bg-primary h-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.6)]" style={{width: `${sendingProgress}%`}}></div>
                    </div>
                    <p className="text-white font-black text-xl uppercase tracking-widest">{sendingProgress}%</p>
                    <p className="text-xs text-white/40 mt-2 font-bold uppercase tracking-tighter">Importando para o CRM...</p>
                </div>
             )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                    <MagnifyingGlassIcon className="w-8 h-8 text-primary" /> 
                    <span>Captação Inteligente</span>
                </h2>
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Scanner de Leads Ativo</span>
                    </div>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-2xl shadow-lg border border-white/10 mb-6 shrink-0">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 opacity-60">Nicho de Mercado</label>
                        <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} className="w-full px-4 py-2.5 bg-background/50 border border-white/20 rounded-xl text-text-primary focus:border-primary outline-none font-medium" placeholder="Ex: Academias, Restaurantes..." />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5 opacity-60">Cidade / Região</label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-2.5 bg-background/50 border border-white/20 rounded-xl text-text-primary focus:border-primary outline-none font-medium" placeholder="Ex: São Paulo, SP" />
                    </div>
                    <button type="submit" disabled={!keyword || !location || isSearching} className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 font-black uppercase text-[10px] tracking-widest min-w-[160px]">
                        {isSearching ? 'Varrendo...' : 'Pesquisar Leads'}
                    </button>
                </form>
                {statusMessage && <p className="mt-3 text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">{statusMessage}</p>}
            </div>

            {results.length > 0 && (
                <div className="flex-1 flex flex-col bg-surface rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/5">
                        <div className="flex items-center gap-4">
                            <h3 className="font-black text-text-primary text-xs uppercase tracking-widest">Leads Encontrados ({results.length})</h3>
                            <button onClick={clearResults} className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tighter">Limpar Busca</button>
                        </div>
                        <button 
                            onClick={handleImportOnly}
                            disabled={results.filter(r => r.selected).length === 0}
                            className="bg-primary text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 shadow-md transition-all"
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
                                        title="Remover"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] text-text-secondary font-mono bg-slate-100 px-2 py-1 rounded w-fit">📞 {lead.phone}</p>
                                        {lead.isMobile && (
                                            <span className="text-[9px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Celular</span>
                                        )}
                                    </div>
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

            {!isSearching && results.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                    <MagnifyingGlassIcon className="w-20 h-20 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">Pronto para buscar novos clientes</p>
                </div>
            )}
        </div>
    );
};

export default LeadGen;
