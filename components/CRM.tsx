
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import type { Lead, LeadStatus, ChatMessage } from '../types';
import { PhoneIcon, MailIcon, MapPinIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, TrashIcon } from './Icons';

const statusColumns: LeadStatus[] = ['Novo', 'Contatado', 'Qualificado', 'Proposta', 'Ganho', 'Perdido'];

const statusColors: Record<LeadStatus, string> = {
    'Novo': 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    'Contatado': 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
    'Qualificado': 'bg-purple-500/20 border-purple-500/50 text-purple-300',
    'Proposta': 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300',
    'Ganho': 'bg-green-500/20 border-green-500/50 text-green-300',
    'Perdido': 'bg-red-500/20 border-red-500/50 text-red-300'
};

const LeadChat: React.FC<{ lead: Lead, onSendMessage: (text: string) => Promise<void> }> = ({ lead, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messages = lead.messages || [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        await onSendMessage(newMessage);
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-[400px]">
             <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-background/30 rounded-lg border border-white/10 mb-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center mt-10 space-y-2">
                        <p className="text-text-secondary text-sm">Nenhum histórico de conversa registrado.</p>
                        <p className="text-xs text-text-secondary/60">As mensagens aqui servem para controle interno do lead.</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            msg.sender === 'user' 
                                ? 'bg-primary text-white rounded-br-none' 
                                : 'bg-surface border border-white/20 text-text-primary rounded-bl-none'
                        }`}>
                            <p>{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-white/70' : 'text-text-secondary'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSend} className="flex gap-2">
                <input 
                    type="text" 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Registrar anotação de conversa..."
                    className="flex-1 px-4 py-2 bg-surface border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                />
                <button type="submit" className="bg-primary p-2 rounded-full text-white shadow-lg shadow-primary/20">
                    <PaperAirplaneIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

const LeadDetailsModal: React.FC<{ 
    lead?: Lead; 
    onSave: (lead: Omit<Lead, 'id' | 'companyId' | 'createdAt'> | Lead) => Promise<void>; 
    onDelete?: (id: string) => void;
}> = ({ lead, onSave, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');
    const [formData, setFormData] = useState({
        name: lead?.name || '',
        phone: lead?.phone || '',
        email: lead?.email || '',
        status: lead?.status || 'Novo' as LeadStatus,
        source: lead?.source || 'Manual',
        notes: lead?.notes || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const data = { ...formData };
        if (lead) {
            await onSave({ ...lead, ...data });
        } else {
            await onSave({ ...data, messages: [] });
        }
        setIsSaving(false);
    };

    const handleSendMessage = async (text: string) => {
        if (!lead) return;
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            text,
            sender: 'user',
            timestamp: new Date().toISOString()
        };
        const updatedMessages = [...(lead.messages || []), newMessage];
        await onSave({ ...lead, messages: updatedMessages });
    };

    return (
        <div>
            <div className="flex justify-between items-center border-b border-white/10 mb-4">
                <div className="flex">
                    <button 
                        className={`px-4 py-2 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                        onClick={() => setActiveTab('info')}
                    >
                        Dados do Lead
                    </button>
                    {lead && (
                        <button 
                            className={`px-4 py-2 font-bold text-xs uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            Histórico
                        </button>
                    )}
                </div>
                {lead && onDelete && (
                    <button 
                        onClick={() => { if(confirm('Excluir este lead permanentemente?')) onDelete(lead.id); }}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir Lead"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {activeTab === 'info' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" placeholder="Nome do Lead / Empresa" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none" />
                    <input type="tel" name="phone" placeholder="Telefone" value={formData.phone} onChange={handleChange} required className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md">
                        {statusColumns.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea name="notes" placeholder="Anotações" value={formData.notes} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md h-24" />
                    <div className="text-right">
                        <button type="submit" disabled={isSaving} className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            {isSaving ? 'Salvando...' : 'Salvar Lead'}
                        </button>
                    </div>
                </form>
            ) : (
                lead ? <LeadChat lead={lead} onSendMessage={handleSendMessage} /> : null
            )}
        </div>
    );
}

const CRM: React.FC = () => {
    const { leads, addLead, updateLead, deleteLead, openModal, closeModal, checkPlanLimits } = useData();

    const handleAddClick = () => {
        if (checkPlanLimits('leads')) {
            openModal('Novo Lead', <LeadDetailsModal onSave={addLead} />);
        }
    };

    const handleCardClick = (lead: Lead) => {
        openModal(lead.name, <LeadDetailsModal onSave={updateLead} lead={lead} onDelete={(id) => { deleteLead(id); closeModal(); }} />);
    };
    
    const handleMoveStatus = async (e: React.MouseEvent, lead: Lead, direction: 'next' | 'prev') => {
        e.stopPropagation();
        const currentIndex = statusColumns.indexOf(lead.status);
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        if (newIndex >= 0 && newIndex < statusColumns.length) {
            await updateLead({ ...lead, status: statusColumns[newIndex] });
        }
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">CRM Pipeline</h2>
                <button onClick={handleAddClick} className="bg-primary text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    + Novo Lead
                </button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-4 h-full min-w-[1200px]">
                    {statusColumns.map(column => (
                        <div key={column} className="flex-1 min-w-[280px] bg-surface/50 rounded-xl border border-white/10 flex flex-col shadow-inner">
                            <div className={`p-4 font-black text-[10px] border-b border-white/10 flex justify-between items-center tracking-widest ${statusColors[column].split(' ')[2]}`}>
                                <span>{column.toUpperCase()}</span>
                                <span className="bg-black/20 px-2 py-0.5 rounded-full">
                                    {leads.filter(l => l.status === column).length}
                                </span>
                            </div>
                            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                                {leads.filter(l => l.status === column).map(lead => (
                                    <div 
                                        key={lead.id} 
                                        onClick={() => handleCardClick(lead)}
                                        className="p-4 rounded-xl border shadow-sm cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] bg-white border-white/10 group"
                                    >
                                        <h4 className="font-bold text-text-primary uppercase tracking-tighter text-sm">{lead.name}</h4>
                                        <p className="text-[10px] font-mono text-text-secondary mt-1">{lead.phone}</p>
                                        
                                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px]">
                                            <span className="text-text-secondary font-black uppercase opacity-50">{lead.source}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => handleMoveStatus(e, lead, 'prev')}
                                                    disabled={column === 'Novo'}
                                                    className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30"
                                                >
                                                    ←
                                                </button>
                                                <button 
                                                    onClick={(e) => handleMoveStatus(e, lead, 'next')}
                                                    disabled={column === 'Perdido'}
                                                    className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 disabled:opacity-30"
                                                >
                                                    →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CRM;
