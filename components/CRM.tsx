

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import type { Lead, LeadStatus, ChatMessage } from '../types';
import { PhoneIcon, MailIcon, MapPinIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon } from './Icons';

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

    const openWhatsAppWeb = () => {
        const cleanPhone = lead.phone.replace(/\D/g, '');
        // Adiciona 55 se não tiver (assumindo Brasil)
        const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
        const text = encodeURIComponent(newMessage || "Olá, tudo bem?");
        window.open(`https://wa.me/${finalPhone}?text=${text}`, '_blank');
    };

    return (
        <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-background/30 rounded-lg border border-white/10 mb-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center mt-10 space-y-2">
                        <p className="text-text-secondary text-sm">Nenhuma mensagem registrada no CRM.</p>
                        <p className="text-xs text-text-secondary/60">As mensagens trocadas aqui são internas ou registros.</p>
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
            
            <div className="flex flex-col gap-2">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 bg-surface border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                    />
                    <button type="submit" className="bg-surface border border-white/20 p-2 rounded-full text-text-secondary hover:text-white transition-colors" title="Salvar no Histórico (Interno)">
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </form>
                <button 
                    type="button"
                    onClick={openWhatsAppWeb}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Abrir Conversa no WhatsApp Web
                </button>
            </div>
        </div>
    );
};

const LeadDetailsModal: React.FC<{ 
    lead?: Lead; 
    onSave: (lead: Omit<Lead, 'id' | 'companyId' | 'createdAt'> | Lead) => Promise<void>; 
}> = ({ lead, onSave }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'whatsapp'>('info');
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
        if (!lead) return; // Should not happen for existing leads
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
            <div className="flex border-b border-white/10 mb-4">
                <button 
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                    onClick={() => setActiveTab('info')}
                >
                    Dados do Lead
                </button>
                {lead && (
                    <button 
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'whatsapp' ? 'border-green-500 text-green-500' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                        onClick={() => setActiveTab('whatsapp')}
                    >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" /> WhatsApp / Chat
                    </button>
                )}
            </div>

            {activeTab === 'info' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" placeholder="Nome do Lead / Empresa" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                    <input type="tel" name="phone" placeholder="Telefone / WhatsApp" value={formData.phone} onChange={handleChange} required className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                    <input type="email" name="email" placeholder="Email (Opcional)" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md">
                        {statusColumns.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea name="notes" placeholder="Anotações" value={formData.notes} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                    <div className="text-right">
                        <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50">
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
    const { leads, addLead, updateLead, openModal } = useData();

    const handleAddClick = () => {
        openModal('Novo Lead', <LeadDetailsModal onSave={addLead} />);
    };

    const handleCardClick = (lead: Lead) => {
        openModal(lead.name, <LeadDetailsModal onSave={updateLead} lead={lead} />);
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
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-text-primary">CRM Pipeline</h2>
                <button onClick={handleAddClick} className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors">
                    + Novo Lead
                </button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-4 h-full min-w-[1200px]">
                    {statusColumns.map(column => (
                        <div key={column} className="flex-1 min-w-[280px] bg-surface/50 rounded-lg border border-white/10 flex flex-col">
                            <div className={`p-3 font-bold text-sm border-b border-white/10 flex justify-between items-center ${statusColors[column].split(' ')[2]}`}>
                                <span>{column.toUpperCase()}</span>
                                <span className="bg-black/30 px-2 py-0.5 rounded-full text-xs">
                                    {leads.filter(l => l.status === column).length}
                                </span>
                            </div>
                            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                                {leads.filter(l => l.status === column).map(lead => (
                                    <div 
                                        key={lead.id} 
                                        onClick={() => handleCardClick(lead)}
                                        className={`p-4 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] bg-surface border-white/10 group`}
                                    >
                                        <h4 className="font-bold text-text-primary">{lead.name}</h4>
                                        
                                        <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
                                            <PhoneIcon className="w-3 h-3" /> {lead.phone}
                                        </div>
                                        {lead.messages && lead.messages.length > 0 && (
                                            <div className="flex items-center gap-2 mt-2 text-xs text-green-400 bg-green-400/10 p-1 rounded w-fit">
                                                <ChatBubbleLeftRightIcon className="w-3 h-3" /> 
                                                {lead.messages.length} mensagens
                                            </div>
                                        )}
                                        
                                        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                                            <span className="text-text-secondary">{lead.source}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => handleMoveStatus(e, lead, 'prev')}
                                                    disabled={column === 'Novo'}
                                                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                                                >
                                                    ←
                                                </button>
                                                <button 
                                                    onClick={(e) => handleMoveStatus(e, lead, 'next')}
                                                    disabled={column === 'Perdido'}
                                                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
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
