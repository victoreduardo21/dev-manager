
import React, { useEffect, useState } from 'react';
import { 
    ChartBarIcon, UsersIcon, FolderIcon, PhoneIcon, CheckBadgeIcon, 
    CloudIcon, ChevronRightIcon, FunnelIcon, CurrencyDollarIcon,
    RocketLaunchIcon, MapPinIcon, ChatBubbleLeftRightIcon,
    ExclamationTriangleIcon, StarIcon, ShieldCheckIcon, BoltIcon,
    GlobeAltIcon, WhatsAppIcon
} from './Icons';
import { PLANS } from '../constants';
import type { BillingCycle } from '../types';

interface LandingPageProps {
    onEnterApp: (plan?: string, billingCycle?: BillingCycle) => void;
}

// --- Sub-componentes de Conteúdo ---

const TestimonialCard: React.FC<{ name: string; role: string; text: string; avatar: string }> = ({ name, role, text, avatar }) => (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="flex gap-1 text-amber-400 mb-4">
            {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} className="w-5 h-5 fill-current" />)}
        </div>
        <p className="text-slate-600 italic mb-6 leading-relaxed">"{text}"</p>
        <div className="flex items-center gap-4">
            <img src={avatar} alt={name} className="w-12 h-12 rounded-full border-2 border-blue-100 shadow-sm" />
            <div>
                <h4 className="font-bold text-slate-900">{name}</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{role}</p>
            </div>
        </div>
    </div>
);

const FeatureItem: React.FC<{ title: string; desc: string; icon: React.ReactNode; color: string }> = ({ title, desc, icon, color }) => (
    <div className="bg-white border border-slate-100 p-8 rounded-[32px] hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 group hover:-translate-y-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${color} group-hover:scale-110 shadow-sm`}>
            {icon}
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </div>
);

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-slate-200 py-6 last:border-0">
            <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center text-left gap-4 group">
                <span className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{question}</span>
                <span className={`text-2xl transition-transform duration-300 text-blue-600 ${open ? 'rotate-45' : ''}`}>+</span>
            </button>
            <div className={`grid transition-all duration-300 overflow-hidden ${open ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]'}`}>
                <p className="min-h-0 text-slate-500 text-sm leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

// --- Componente Principal ---

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
    const [scrolled, setScrolled] = useState(false);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
            
            {/* Botão Flutuante WhatsApp */}
            <a 
                href="https://wa.me/5513996104848?text=Olá,%20gostaria%20de%20falar%20com%20o%20suporte%20do%20Nexus%20Manager." 
                target="_blank" 
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group animate-bounce-subtle"
            >
                <WhatsAppIcon className="w-8 h-8" />
                <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
                    Clique aqui para ser redirecionado <br/> ao nosso atendimento
                </span>
            </a>

            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200 py-3 shadow-lg' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <RocketLaunchIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-slate-900">NEXUS<span className="text-blue-600">MANAGER</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <button onClick={() => scrollTo('features')} className="hover:text-blue-600 transition-colors">Recursos</button>
                        <button onClick={() => scrollTo('testimonials')} className="hover:text-blue-600 transition-colors">Depoimentos</button>
                        <button onClick={() => scrollTo('pricing')} className="hover:text-blue-600 transition-colors">Planos</button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => onEnterApp()} className="hidden sm:block text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors">Entrar</button>
                        <button onClick={() => scrollTo('pricing')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95">Experimentar</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-48 pb-32 overflow-hidden bg-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50 rounded-full blur-[120px] opacity-50"></div>
                </div>
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-widest mb-10 shadow-sm animate-bounce-subtle">
                        <BoltIcon className="w-4 h-4" /> Nexus v3.0 • A Revolução na Gestão
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1] text-slate-900 uppercase max-w-5xl mx-auto">
                        Gerencie sua Agência <br /> em <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">um só lugar.</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
                        Controle total de projetos, finanças e equipe. Excelência e inovação para o seu negócio. Abandone o caos e escale com inteligência.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={() => scrollTo('pricing')} className="group bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black text-xl shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center gap-3 hover:scale-105 active:scale-95">
                            Começar agora <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">Eficiência Máxima</span>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase">TUDO O QUE VOCÊ PRECISA.</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureItem title="CRM Kanban" desc="Visualize seu funil de vendas e mova leads com um clique." icon={<FunnelIcon className="w-7 h-7" />} color="bg-blue-50 text-blue-600" />
                        <FeatureItem title="WhatsApp I.A" desc="Automação nativa para disparos e nutrição de contatos." icon={<ChatBubbleLeftRightIcon className="w-7 h-7" />} color="bg-green-50 text-green-600" />
                        <FeatureItem title="Gestão Sites" desc="Controle prazos, parceiros e entregas de forma visual." icon={<FolderIcon className="w-7 h-7" />} color="bg-purple-50 text-purple-600" />
                        <FeatureItem title="Deep Search" desc="Capte leads qualificados diretamente do Google Maps." icon={<MapPinIcon className="w-7 h-7" />} color="bg-rose-50 text-rose-600" />
                    </div>
                </div>
            </section>

            {/* Testimonials Restoration */}
            <section id="testimonials" className="py-32 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
                        <div className="max-w-2xl text-center md:text-left">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight text-white uppercase">CONFIADO POR <br /> QUEM CRESCE.</h2>
                            <p className="text-slate-400 text-lg">Donos de agências e gestores que saíram do caos para a escala com o Nexus.</p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto justify-center">
                            <div className="text-center bg-white/5 border border-white/10 p-6 rounded-[32px] min-w-[140px]">
                                <p className="text-3xl font-black text-blue-500">+500</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Clientes</p>
                            </div>
                            <div className="text-center bg-white/5 border border-white/10 p-6 rounded-[32px] min-w-[140px]">
                                <p className="text-3xl font-black text-blue-500">99%</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Satisfação</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <TestimonialCard 
                            name="Ricardo Silva" role="CEO Agência Alpha"
                            text="O Nexus triplicou nossa velocidade de entrega. A gestão de projetos é impecável e o CRM é extremamente intuitivo."
                            avatar="https://i.pravatar.cc/150?u=ricardo"
                        />
                        <TestimonialCard 
                            name="Juliana Costa" role="Fundadora WebDesign Pro"
                            text="A ferramenta de captação de leads VIP é mágica. Encontramos clientes qualificados em minutos, coisa que levava dias."
                            avatar="https://i.pravatar.cc/150?u=juliana"
                        />
                        <TestimonialCard 
                            name="Lucas Oliveira" role="Gestor de TI"
                            text="Finalmente um sistema que une o financeiro e o operacional de forma coesa. O suporte é rápido e eficiente."
                            avatar="https://i.pravatar.cc/150?u=lucas"
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 bg-[#fcfdfe]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mb-8 uppercase">Planos de Crescimento</h2>
                        <div className="inline-flex items-center gap-4 bg-slate-100 p-2 rounded-[24px] border border-slate-200">
                            <button onClick={() => setBillingCycle('monthly')} className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500'}`}>Mensal</button>
                            <button onClick={() => setBillingCycle('yearly')} className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500'}`}>Anual <span className={`${billingCycle === 'yearly' ? 'bg-white/20' : 'bg-green-100 text-green-600'} px-2 py-0.5 rounded text-[9px]`}>-17%</span></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
                        {PLANS.map((plan) => (
                            <div key={plan.name} className={`group relative p-8 sm:p-10 rounded-[40px] border flex flex-col transition-all duration-500 hover:-translate-y-2 ${plan.highlight ? 'bg-white border-blue-600 shadow-2xl z-10' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                {plan.tag && <div className="absolute top-0 right-10 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full shadow-xl uppercase tracking-widest">{plan.tag}</div>}
                                
                                <h3 className="text-xl font-black mb-2 tracking-tighter text-slate-900 uppercase">{plan.name}</h3>
                                <p className="text-slate-500 text-[10px] mb-8 font-black uppercase opacity-60 tracking-widest min-h-[30px]">{plan.description}</p>
                                
                                <div className="flex items-baseline gap-1 mb-8 whitespace-nowrap">
                                    <span className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">
                                        R$ {(billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest shrink-0 opacity-50">{billingCycle === 'monthly' ? '/mês' : '/ano'}</span>
                                </div>

                                <button onClick={() => onEnterApp(plan.name, billingCycle)} className={`w-full py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all mb-10 shadow-lg ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95'}`}>
                                    Escolher {plan.name}
                                </button>
                                
                                <div className="space-y-4 flex-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Vantagens:</p>
                                    <ul className="space-y-4">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-start gap-3 text-xs font-bold text-slate-600 leading-tight">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.highlight ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <CheckBadgeIcon className="w-3 h-3" />
                                                </div>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-24 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex flex-col items-center md:items-start gap-3">
                            <div className="flex items-center gap-3">
                                <RocketLaunchIcon className="w-8 h-8 text-blue-600" />
                                <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">NEXUS<span className="text-blue-600">MANAGER</span></span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">
                                © 2025 NEXUS MANAGER. ALL RIGHTS RESERVED.
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-center md:items-end gap-2">
                             <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                                Desenvolvido pela GTS - Global Tech Software
                             </p>
                             <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-blue-50 transition-colors cursor-pointer"><UsersIcon className="w-4 h-4" /></div>
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-blue-50 transition-colors cursor-pointer"><GlobeAltIcon className="w-4 h-4" /></div>
                             </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
