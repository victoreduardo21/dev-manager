import React, { useState, useEffect } from 'react';
import type { Client } from '../types';
import { useData } from '../context/DataContext';
import { MailIcon, PhoneIcon } from './Icons';

const ClientForm: React.FC<{ 
    // Fix: Correct the onSave prop type to reflect that new clients don't have a companyId yet.
    onSave: (client: Omit<Client, 'id' | 'companyId'> | Client) => Promise<void>; 
    initialData?: Client;
}> = ({ onSave, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [companyName, setCompanyName] = useState(initialData?.companyName || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [cpf, setCpf] = useState(initialData?.cpf || '');
    const [cnpj, setCnpj] = useState(initialData?.cnpj || '');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !companyName || !email) {
            setError('Nome, Empresa e Email são obrigatórios.');
            return;
        }
        setIsSaving(true);
        const clientData = { name, companyName, email, phone, cpf, cnpj };
        
        if (initialData) {
            await onSave({ ...initialData, ...clientData });
        } else {
            await onSave(clientData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            <input type="text" placeholder="Nome da Empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            <input type="tel" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            <input type="text" placeholder="CPF" value={cpf} onChange={e => setCpf(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            <input type="text" placeholder="CNPJ" value={cnpj} onChange={e => setCnpj(e.target.value)} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            <div className="text-right">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Salvando...' : (initialData ? 'Atualizar Cliente' : 'Salvar Cliente')}
                </button>
            </div>
        </form>
    );
};

const ClientCard: React.FC<{ client: Client; onEdit: (client: Client) => void; }> = ({ client, onEdit }) => (
  <div className="bg-surface rounded-lg shadow-lg border border-white/10 p-5 flex flex-col justify-between">
    <div>
      <h3 className="text-lg font-bold text-text-primary">{client.name}</h3>
      <p className="text-sm text-primary font-medium">{client.companyName}</p>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center">
          <MailIcon className="w-4 h-4 mr-2 text-text-secondary" />
          <span className="text-text-secondary">{client.email}</span>
        </div>
        <div className="flex items-center">
          <PhoneIcon className="w-4 h-4 mr-2 text-text-secondary" />
          <span className="text-text-secondary">{client.phone}</span>
        </div>
      </div>
    </div>
    <div className="mt-4 text-right">
       <button onClick={() => onEdit(client)} className="text-sm font-medium text-primary hover:underline">Editar</button>
    </div>
  </div>
);

const Clients: React.FC = () => {
  const { clients, addClient, updateClient, openModal } = useData();
    
  const handleAddClick = () => {
    openModal('Adicionar Novo Cliente', <ClientForm onSave={addClient} />);
  };
  
  const handleEditClick = (client: Client) => {
    openModal('Editar Cliente', <ClientForm onSave={updateClient} initialData={client} />);
  };
    
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-primary">Clientes</h2>
        <button 
          onClick={handleAddClick}
          className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors duration-300"
        >
          Adicionar Cliente
        </button>
      </div>
      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
            <ClientCard key={client.id} client={client} onEdit={handleEditClick} />
            ))}
        </div>
        ) : (
        <div className="text-center py-10 bg-surface rounded-lg border border-dashed border-white/20">
            <p className="text-text-secondary">Nenhum cliente cadastrado ainda.</p>
            <p className="text-sm text-text-secondary/80 mt-1">Clique em "Adicionar Cliente" para começar.</p>
        </div>
      )}
    </div>
  );
};

export default Clients;