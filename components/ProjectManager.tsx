import React, { useState, useEffect } from 'react';
import type { Project, Currency, ProjectStatus, Activity, ProjectCategory } from '../types';
import { CURRENCY_SYMBOLS, CURRENCIES, PROJECT_STATUSES } from '../constants';
import { useData } from '../context/DataContext';
import { TrashIcon } from './Icons';

const PROJECT_CATEGORIES: ProjectCategory[] = ['Site', 'Sistema', 'App', 'Marketing', 'Consultoria', 'Outro'];

const ProjectForm: React.FC<{ 
    onSave: (project: Omit<Project, 'id' | 'payments' | 'activities'> | Project) => Promise<void>;
    initialData?: Project;
}> = ({ onSave, initialData }) => {
    const { clients, partners } = useData();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Sistema' as ProjectCategory,
        clientId: '',
        value: '',
        downPayment: '',
        installments: '1',
        currency: 'BRL' as Currency,
        hasRetainer: false,
        retainerValue: '',
        assignedPartnerIds: [] as string[],
        startDate: '',
        endDate: '',
        status: 'Pendente' as ProjectStatus,
        progress: 0,
    });
    const [newActivity, setNewActivity] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if(initialData) {
            setFormData({
                ...initialData,
                value: String(initialData.value),
                downPayment: String(initialData.downPayment),
                installments: String(initialData.installments),
                retainerValue: String(initialData.retainerValue || ''),
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number' || type === 'range';
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handlePartnerChange = (partnerId: string) => {
        setFormData(prev => {
            const assignedPartnerIds = prev.assignedPartnerIds.includes(partnerId)
                ? prev.assignedPartnerIds.filter(id => id !== partnerId)
                : [...prev.assignedPartnerIds, partnerId];
            return { ...prev, assignedPartnerIds };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.clientId || !formData.value || !formData.startDate || !formData.endDate) {
            setError('Nome, Cliente, Valor e Datas são obrigatórios.');
            return;
        }
        setIsSaving(true);
        const dataToSave = {
            ...formData,
            value: parseFloat(String(formData.value)),
            downPayment: parseFloat(String(formData.downPayment)) || 0,
            installments: parseInt(String(formData.installments), 10),
            progress: Number(formData.progress),
            retainerValue: parseFloat(String(formData.retainerValue)) || undefined,
        };

        if (initialData) {
            const updatedActivities = [...(initialData.activities || [])];
             if (newActivity.trim()) {
                 updatedActivities.push({
                     id: `act-${Date.now()}`,
                     date: new Date().toISOString(),
                     description: newActivity.trim(),
                 });
             }
             const projectPayload: Project = { ...initialData, ...dataToSave, activities: updatedActivities };
             await onSave(projectPayload);
        } else {
             await onSave(dataToSave as any);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <input type="text" name="name" placeholder="Nome do Projeto / Site" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                     <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary">
                        {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <textarea name="description" placeholder="Descrição" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
            
            <select name="clientId" value={formData.clientId} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary">
                <option value="">Selecione um Cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <div className="grid grid-cols-2 gap-4">
                <input type="number" name="value" placeholder="Valor Total" value={formData.value} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
                <input type="number" name="downPayment" placeholder="Valor da Entrada" value={formData.downPayment} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input type="number" name="installments" placeholder="Parcelas" value={formData.installments} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
                <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-4">
                <input type="checkbox" name="hasRetainer" id="hasRetainer" checked={formData.hasRetainer} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="hasRetainer" className="text-sm">Tem mensalidade?</label>
                {formData.hasRetainer && <input type="number" name="retainerValue" placeholder="Valor Mensalidade" value={formData.retainerValue} onChange={handleChange} className="flex-1 px-3 py-2 bg-background/50 border border-white/20 rounded-md" />}
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-text-secondary">Data de Início</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
                </div>
                 <div>
                    <label className="text-sm text-text-secondary">Data de Entrega</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md" />
                </div>
            </div>
            {initialData && (
                <>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-text-secondary">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-md">
                            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-text-secondary">Progresso: {formData.progress}%</label>
                        <input type="range" name="progress" min="0" max="100" value={formData.progress} onChange={handleChange} className="w-full" />
                    </div>
                </div>
                 <div className="mt-4">
                    <label className="text-sm text-text-secondary">Adicionar Atualização de Andamento</label>
                    <textarea 
                        name="newActivity" 
                        placeholder="Ex: Reunião de alinhamento com o cliente concluída." 
                        value={newActivity} 
                        onChange={e => setNewActivity(e.target.value)} 
                        className="w-full mt-1 px-3 py-2 bg-background/50 border border-white/20 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        rows={3}
                    />
                </div>
                </>
            )}
            <div>
                <label className="text-sm text-text-secondary">Designar Parceiros</label>
                <div className="max-h-32 overflow-y-auto bg-background/50 p-2 border border-white/20 rounded-md mt-1">
                    {partners.map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                            <input type="checkbox" id={`partner-${p.id}`} checked={formData.assignedPartnerIds.includes(p.id)} onChange={() => handlePartnerChange(p.id)} />
                            <label htmlFor={`partner-${p.id}`}>{p.name} ({p.role})</label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="text-right">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Salvando...' : (initialData ? `Atualizar` : `Salvar`)}
                </button>
            </div>
        </form>
    );
};


const ProjectCard: React.FC<{
    project: Project; 
    clientName: string; 
    onEdit: (project: Project) => void;
    onViewHistory: (project: Project) => void;
    onDelete: (id: string) => void;
}> = ({ project, clientName, onEdit, onViewHistory, onDelete }) => {
    const latestActivity = project.activities && project.activities.length > 0 ? project.activities[project.activities.length - 1] : null;

    const handleDelete = () => {
        if (confirm(`Tem certeza que deseja excluir "${project.name}"?`)) {
            onDelete(project.id);
        }
    };

    const categoryColor = project.category === 'Site' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

    return (
    <div className="bg-surface p-5 rounded-lg shadow-lg border border-white/10 flex flex-col h-full relative group transition-all hover:border-white/20">
        <div>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${categoryColor}`}>
                            {project.category || 'Geral'}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">{project.name}</h3>
                    <p className="text-sm text-primary font-medium">{clientName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'Em Andamento' ? 'bg-blue-500/20 text-blue-400' : 
                        project.status === 'Concluído' ? 'bg-green-500/20 text-green-400' : 
                        project.status === 'Pendente' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                        {project.status}
                    </span>
                    <button 
                        onClick={handleDelete}
                        className="p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/30 transition-colors"
                        title="Excluir"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <p className="text-sm text-text-secondary my-3 h-10 overflow-hidden">{project.description}</p>
        </div>
        
        <div className="my-4">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>Progresso</span>
                <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-background/50 rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{width: `${project.progress}%`}}></div>
            </div>
        </div>

        {latestActivity && (
            <div className="mb-4 p-3 bg-background/40 rounded-md border border-white/10">
                <p className="text-xs font-semibold text-text-secondary mb-1">Última Atualização:</p>
                <p className="text-sm text-text-primary truncate">{latestActivity.description}</p>
                <p className="text-xs text-text-secondary text-right mt-1">{new Date(latestActivity.date).toLocaleDateString('pt-BR')}</p>
            </div>
        )}

        <div className="flex justify-between items-center text-sm pt-4 border-t border-white/10 mt-auto">
            <div>
                <p className="font-semibold text-text-secondary">Valor Total</p>
                <p className="text-text-primary font-medium">{`${CURRENCY_SYMBOLS[project.currency]} ${project.value.toLocaleString('pt-BR')}`}</p>
            </div>
             <div className="flex items-center gap-4">
                <button onClick={() => onViewHistory(project)} className="text-sm font-medium text-text-secondary hover:underline">Histórico</button>
                <button onClick={() => onEdit(project)} className="text-sm font-medium text-primary hover:underline">Editar</button>
            </div>
            <div>
                <p className="font-semibold text-text-secondary text-right">Entrega</p>
                <p className="text-text-primary font-medium">{new Date(project.endDate).toLocaleDateString('pt-BR')}</p>
            </div>
        </div>
    </div>
    );
};

const ActivityHistory: React.FC<{ activities: Activity[] }> = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return <p className="text-text-secondary">Nenhum histórico de andamento registrado.</p>;
    }
    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {activities.slice().reverse().map(activity => (
                <div key={activity.id} className="pb-2 border-b border-white/10 last:border-b-0">
                    <p className="text-sm text-text-primary">{activity.description}</p>
                    <p className="text-xs text-text-secondary mt-1">{new Date(activity.date).toLocaleString('pt-BR')}</p>
                </div>
            ))}
        </div>
    );
};


const ProjectManager: React.FC = () => {
  const { 
    projects, clients, 
    addProject, updateProject, deleteProject,
    openModal 
  } = useData();
  
  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente não encontrado';
  }
  
  const handleAddClick = () => {
      openModal(`Adicionar Novo Projeto`, <ProjectForm onSave={addProject} />);
  };

  const handleEditClick = (project: Project) => {
      openModal(`Editar Projeto: ${project.name}`, <ProjectForm onSave={updateProject} initialData={project} />);
  };
  
  const handleViewHistoryClick = (project: Project) => {
      openModal(`Histórico de Andamento: ${project.name}`, <ActivityHistory activities={project.activities} />);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-primary">Projetos & Sites</h2>
        <button onClick={handleAddClick} className="bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors">
          Novo Projeto/Site
        </button>
      </div>
       {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((item) => (
                    <ProjectCard 
                        key={item.id} 
                        project={item} 
                        clientName={getClientName(item.clientId)} 
                        onEdit={handleEditClick} 
                        onViewHistory={handleViewHistoryClick} 
                        onDelete={deleteProject}
                    />
                ))}
            </div>
         ) : (
            <div className="text-center py-10 bg-surface rounded-lg border border-dashed border-white/20">
                <p className="text-text-secondary">Nenhum projeto ou site cadastrado ainda.</p>
                <p className="text-sm text-text-secondary/80 mt-1">Clique no botão acima para começar.</p>
            </div>
      )}
    </div>
  );
};

export default ProjectManager;