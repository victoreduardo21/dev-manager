
import React, { useEffect, useState } from 'react';
import { 
    ChartBarIcon, UsersIcon, FolderIcon, PhoneIcon, CheckBadgeIcon, 
    CloudIcon, ChevronRightIcon, GlobeAltIcon, FunnelIcon, CurrencyDollarIcon
} from './Icons';

interface LandingPageProps {
    onEnterApp: (plan?: string) => void;
}

// --- Componentes Visuais (Mockups do Sistema) ---
const SystemDashboardMockup = () => (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all hover:scale-[1.01] duration-500">
        {/* Fake Browser Header */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <div className="ml-4 bg-white px-3 py-1 rounded text-xs text-slate-400 flex-1 border border-slate-200">nexusmanager.app/dashboard</div>
        </div>
        
        <div className="flex h-[400px] md:h-[500px]">
            {/* Fake Sidebar */}
            <div className="w-16 md:w-56 bg-[#020617] p-4 flex flex-col gap-4 text-slate-400 border-r border-slate-800">
                <div className="h-8 w-8 md:w-auto bg-blue-600 rounded-lg mb-4 flex items-center justify-center text-white font-bold">
                    <span className="hidden md:inline ml-2">Nexus</span>
                    <span className="md:hidden">N</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded opacity-20 mb-2"></div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white bg-blue-600/20 p-2 rounded-lg border border-blue-600/30">
                        <div className="w-4 h-4 bg-blue-500 rounded-full shrink-0"></div>
                        <div className="h-2 w-20 bg-blue-200 rounded hidden md:block"></div>
                    </div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <div className="w-4 h-4 bg-slate-700 rounded-full shrink-0"></div>
                            <div className="h-2 w-16 bg-slate-700 rounded hidden md:block"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fake Main Content */}
            <div className="flex-1 bg-slate-50 p-6 overflow-hidden relative">
                <div className="flex justify-between items-center mb-6">
                    <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    <div className="h-8 w-24 bg-blue-600 rounded shadow-lg shadow-blue-600/20"></div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <div className="h-3 w-12 bg-slate-100 rounded mb-2"></div>
                            <div className="h-6 w-20 bg-slate-800 rounded"></div>
                        </div>
                    ))}
                </div>

                {/* Chart Area */}
                <div className="flex gap-4 h-full">
                    <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative">
                         <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-between px-6 pb-6 gap-2">
                            {[40, 70, 45, 90, 60, 80, 50, 75].map((h, idx) => (
                                <div key={idx} className="w-full bg-blue-500/20 rounded-t hover:bg-blue-500 transition-colors duration-300" style={{height: `${h}%`}}></div>
                            ))}
                         </div>
                    </div>
                    <div className="w-1/3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm hidden lg:block">
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center gap-2 border-b border-slate-50 pb-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                                    <div className="flex-1">
                                        <div className="h-2 w-full bg-slate-100 rounded mb-1"></div>
                                        <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const KanbanMockup = () => (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-2xl w-full max-w-sm mx-auto transform rotate-3 hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="h-2 w-20 bg-slate-700 rounded"></div>
        </div>
        <div className="space-y-3">
            <div className="bg-slate-800 p-3 rounded border-l-4 border-blue-500">
                <div className="h-2 w-16 bg-slate-600 rounded mb-2"></div>
                <div className="h-2 w-full bg-slate-700 rounded"></div>
            </div>
            <div className="bg-slate-800 p-3 rounded border-l-4 border-yellow-500">
                <div className="h-2 w-16 bg-slate-600 rounded mb-2"></div>
                <div className="h-2 w-24 bg-slate-700 rounded"></div>
            </div>
             <div className="bg-slate-800 p-3 rounded border-l-4 border-green-500">
                <div className="h-2 w-16 bg-slate-600 rounded mb-2"></div>
                <div className="h-2 w-20 bg-slate-700 rounded"></div>
            </div>
        </div>
    </div>
);

const FeatureCard: React.FC<{ title: string; desc: string; icon: React.ReactNode }> = ({ title, desc, icon }) => (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group hover:-translate-y-1">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
);

const PricingCard: React.FC<{ 
    title: string; 
    price: string; 
    desc: string; 
    features: string[]; 
    isPopular?: boolean;
    buttonText?: string;
    onClick: () => void;
}> = ({ title, price, desc, features, isPopular, buttonText = "Escolher Plano", onClick }) => (
    <div className={`relative p-8 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
        isPopular 
            ? 'bg-white border-blue-500 shadow-2xl shadow-blue-200/50 scale-105 z-10' 
            : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-lg'
    }`}>
        {isPopular && (
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                MAIS POPULAR
            </div>
        )}
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-bold text-slate-900">{price}</span>
            <span className="text-lg text-slate-500">/mês</span>
        </div>
        <p className={`text-sm mb-6 ${isPopular ? 'text-blue-600' : 'text-slate-500'}`}>{desc}</p>
        
        <button 
            onClick={onClick}
            className={`w-full py-3 rounded-lg font-bold transition-all mb-8 ${
                isPopular 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
            }`}
        >
            {buttonText}
        </button>

        <ul className="space-y-4 flex-1">
            {features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckBadgeIcon className={`w-5 h-5 shrink-0 ${isPopular ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span>{feat}</span>
                </li>
            ))}
        </ul>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-blue-500 selection:text-white font-sans">
            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <GlobeAltIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900">Nexus<span className="text-blue-600">Manager</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 transition-colors">Funcionalidades</button>
                        <button onClick={() => scrollToSection('benefits')} className="hover:text-blue-600 transition-colors">Benefícios</button>
                        <button onClick={() => scrollToSection('pricing')} className="hover:text-blue-600 transition-colors">Planos</button>
                        <button 
                            onClick={() => onEnterApp()} 
                            className="text-slate-900 font-bold hover:text-blue-600 transition-colors"
                        >
                            Fazer Login
                        </button>
                    </div>
                    <button 
                        onClick={() => scrollToSection('pricing')}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-800 transition-all transform hover:scale-105 shadow-lg shadow-slate-900/10"
                    >
                        Criar Conta
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
                     <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
                     <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[100px] opacity-60"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 text-blue-600 text-sm font-bold mb-8 shadow-sm animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Nova Integração com WhatsApp API
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-slate-900">
                        Gestão Empresarial <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Simples e Inteligente</span>
                    </h1>
                    
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Centralize CRM, Projetos, Financeiro e Automação em uma única plataforma. 
                        Otimize sua agência ou empresa de serviços hoje mesmo.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => scrollToSection('pricing')}
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            Escolher meu Plano <ChevronRightIcon className="w-5 h-5" />
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-lg transition-all shadow-sm">
                            Ver Demonstração
                        </button>
                    </div>

                    {/* Dashboard Preview Mockup (Visual do Sistema) */}
                    <div className="mt-20 relative mx-auto max-w-6xl">
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-20"></div>
                        <SystemDashboardMockup />
                    </div>
                </div>
            </section>

             {/* Benefits Section */}
             <section id="benefits" className="py-24 relative z-10 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                                Por que sua empresa precisa do <span className="text-blue-600">Nexus</span>?
                            </h2>
                            <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                                Pare de usar 5 ferramentas diferentes. O Nexus Manager unifica todo o seu fluxo de trabalho, desde a captação do lead até a emissão da nota fiscal.
                            </p>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                        <CurrencyDollarIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-900">Aumente seu Faturamento</h4>
                                        <p className="text-slate-500">Não perca mais leads por falta de acompanhamento. Nosso CRM visual garante que nenhuma oportunidade seja esquecida.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                        <FunnelIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-900">Organização Total</h4>
                                        <p className="text-slate-500">Projetos, prazos e tarefas em um só lugar. Saiba exatamente quem está fazendo o quê e quando será entregue.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                        <CloudIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-900">Acesse de Onde Estiver</h4>
                                        <p className="text-slate-500">Sistema 100% em nuvem. Gerencie sua empresa pelo computador, tablet ou celular com segurança.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            {/* Visual Abstracto dos Cards/Kanban */}
                            <div className="relative z-10">
                                <KanbanMockup />
                            </div>
                            <div className="absolute top-10 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-0"></div>
                            <div className="absolute bottom-10 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 relative z-10 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Funcionalidades Poderosas</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                            Ferramentas desenvolvidas pensando na realidade de agências e prestadores de serviços.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard 
                            title="CRM & Vendas" 
                            desc="Pipeline visual (Kanban) para gerenciar leads. Histórico completo de conversas e integração direta com WhatsApp."
                            icon={<UsersIcon className="w-6 h-6" />}
                        />
                        <FeatureCard 
                            title="Gestão de Projetos" 
                            desc="Controle prazos, tarefas e parceiros. Saiba exatamente o status de cada entrega com relatórios de progresso."
                            icon={<FolderIcon className="w-6 h-6" />}
                        />
                        <FeatureCard 
                            title="Financeiro & SaaS" 
                            desc="Gestão de recorrência (assinaturas), fluxo de caixa previsto vs. realizado e emissão de cobranças."
                            icon={<ChartBarIcon className="w-6 h-6" />}
                        />
                        <FeatureCard 
                            title="Automação WhatsApp" 
                            desc="Dispare mensagens em massa para leads qualificados, gere QR Code e conecte sua instância em segundos."
                            icon={<PhoneIcon className="w-6 h-6" />}
                        />
                        <FeatureCard 
                            title="Captação de Leads IA" 
                            desc="Utilize Inteligência Artificial para varrer a web e encontrar empresas locais com base em nicho e localização."
                            icon={<CloudIcon className="w-6 h-6" />}
                        />
                        <FeatureCard 
                            title="Área do Cliente" 
                            desc="Permita que seus clientes visualizem o andamento de projetos e faturas em um portal dedicado."
                            icon={<CheckBadgeIcon className="w-6 h-6" />}
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 relative z-10 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Planos que cabem no seu bolso</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                            Escolha o plano ideal para a sua fase. Cancele a qualquer momento.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                        <PricingCard 
                            title="Starter" 
                            price="R$ 97" 
                            desc="Ideal para freelancers e profissionais autônomos."
                            features={[
                                "CRM de Vendas Básico",
                                "Gestão de até 5 Projetos",
                                "1 Usuário Admin",
                                "Controle Financeiro Simples",
                                "Sem Automação de WhatsApp"
                            ]}
                            onClick={() => onEnterApp('Starter')}
                        />
                        <PricingCard 
                            title="Professional" 
                            price="R$ 197" 
                            desc="Perfeito para pequenas agências e equipes em crescimento."
                            isPopular={true}
                            features={[
                                "CRM de Vendas Ilimitado",
                                "Projetos Ilimitados",
                                "Até 5 Usuários",
                                "Automação WhatsApp API",
                                "Captação de Leads com IA",
                                "Área do Cliente",
                                "Suporte via Chat"
                            ]}
                            onClick={() => onEnterApp('Professional')}
                        />
                        <PricingCard 
                            title="Business" 
                            price="R$ 497" 
                            desc="Para grandes operações que precisam de escala."
                            features={[
                                "Tudo do Professional",
                                "Usuários Ilimitados",
                                "API Aberta para Integrações",
                                "Gestão Multi-Empresas (White Label)",
                                "Gerente de Conta Dedicado",
                                "Treinamento para Equipe"
                            ]}
                            buttonText="Falar com Consultor"
                            onClick={() => onEnterApp('Business')}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative z-10 overflow-hidden bg-white border-t border-slate-200">
                <div className="max-w-4xl mx-auto px-6 text-center relative">
                    <h2 className="text-4xl font-bold mb-6 text-slate-900">Pronto para escalar sua operação?</h2>
                    <p className="text-xl text-slate-500 mb-10">
                        Junte-se a empresas que organizaram seus processos e aumentaram seu faturamento com o Nexus Manager.
                    </p>
                    <button 
                        onClick={() => scrollToSection('pricing')}
                        className="px-10 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 transform hover:scale-105"
                    >
                        Criar Conta Gratuita
                    </button>
                    <p className="mt-6 text-sm text-slate-400">Não requer cartão de crédito • Cancelamento a qualquer momento</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-900 pt-16 pb-8 text-slate-400 text-sm">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4 text-white">
                            {/* Logo Footer */}
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <GlobeAltIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">Nexus Manager</span>
                        </div>
                        <p>A plataforma definitiva para gestão de agências e serviços digitais.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Produto</h4>
                        <ul className="space-y-2">
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-blue-400">Funcionalidades</button></li>
                            <li><button onClick={() => scrollToSection('pricing')} className="hover:text-blue-400">Preços</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Recursos</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-blue-400">Blog</a></li>
                            <li><a href="#" className="hover:text-blue-400">Suporte</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-blue-400">Privacidade</a></li>
                            <li><a href="#" className="hover:text-blue-400">Termos de Uso</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 border-t border-slate-800 pt-8 text-center">
                    <p>&copy; 2025 Nexus Manager. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
