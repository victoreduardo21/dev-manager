
import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, CheckBadgeIcon, Logo } from './Icons';
import type { BillingCycle } from '../types';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onRegister: (userData: any) => Promise<void>;
  onBack: () => void;
  selectedPlan?: string | null;
  selectedBillingCycle?: BillingCycle;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onBack, selectedPlan, selectedBillingCycle = 'monthly' }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Se um plano foi passado, muda automaticamente para a tela de registro
  useEffect(() => {
      if (selectedPlan) {
          setIsLoginView(false);
      }
  }, [selectedPlan]);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const success = await onLogin(email, password);
        if (!success) {
            setError('Email ou senha incorretos.');
        }
    } catch (e: any) {
        console.error(e);
        setError(e.message || 'Erro ao conectar com o servidor.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (regPassword !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }

    setIsLoading(true);
    try {
        await onRegister({
            companyName: companyName,
            firstName: firstName,
            lastName: lastName,
            email: regEmail,
            phone: regPhone,
            cpf: regCpf,
            password: regPassword,
            plan: selectedPlan || 'Starter', // Envia o plano selecionado ou default
            billingCycle: selectedBillingCycle
        });
        
        setSuccess('Cadastro realizado com sucesso! Seus dados foram salvos.');
        setIsLoginView(true);
        setEmail(regEmail);
        setPassword('');
        
        setFirstName(''); setLastName(''); setRegEmail(''); setRegPhone(''); 
        setRegCpf(''); setRegPassword(''); setConfirmPassword(''); setCompanyName('');

    } catch (e: any) {
        console.error(e);
        setError('Falha no cadastro: ' + (e.message || 'Tente novamente.'));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      
      {/* Botão Voltar Absoluto */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full transition-all backdrop-blur-sm lg:text-white lg:bg-white/10 lg:hover:bg-white/20 text-sm font-medium"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Voltar ao Site
      </button>

      {/* Lado Esquerdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-dark relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[#020617]"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-white/10 blur-[80px] rounded-full mix-blend-overlay pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-lg">
            <div className="mb-8 flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Logo className="w-8 h-8 text-white" />
                </div>
                <span className="text-3xl font-bold text-white tracking-wide">Nexus Manager</span>
            </div>

            <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
                Gestão Empresarial <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white">Simples</span>
            </h1>
            <p className="text-xl text-blue-100/80 mb-8 leading-relaxed">
                Controle total de projetos, finanças e equipe em um único lugar. 
                Otimize seu fluxo de trabalho sem complicações.
            </p>
            <div className="flex gap-4">
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg border border-white/10 shadow-xl">
                    <p className="font-bold text-2xl text-white">100%</p>
                    <p className="text-sm text-blue-200">Controle</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg border border-white/10 shadow-xl">
                    <p className="font-bold text-2xl text-blue-300">Online</p>
                    <p className="text-sm text-blue-200">Em tempo real</p>
                </div>
            </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white text-slate-900 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 mt-12 lg:mt-0">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {isLoginView ? 'Acesse sua conta' : 'Crie sua conta'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    {isLoginView ? 'Bem-vindo de volta!' : 'Preencha os dados abaixo para finalizar sua assinatura.'}
                </p>
            </div>

            {isLoginView ? (
                /* LOGIN FORM */
                <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
                    {success && <p className="text-sm text-green-800 text-center font-bold bg-green-100 p-3 rounded-lg border border-green-200">{success}</p>}
                    {error && <p className="text-sm text-red-800 text-center bg-red-100 p-3 rounded-lg border border-red-200">{error}</p>}
                    
                    <div className="space-y-4">
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                             <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-3 focus:border-primary focus:ring-primary outline-none shadow-sm"
                                placeholder="seu@email.com"
                            />
                        </div>
                       <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-3 focus:border-primary focus:ring-primary outline-none shadow-sm"
                                placeholder="Sua senha"
                            />
                       </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-all shadow-lg shadow-blue-900/20"
                    >
                        {isLoading ? 'Conectando...' : 'Entrar'}
                    </button>
                    
                    <div className="text-center mt-4">
                        <button type="button" onClick={() => setIsLoginView(false)} className="text-sm font-bold text-primary hover:underline">
                            Não tem conta? Cadastre-se
                        </button>
                    </div>
                </form>
            ) : (
                /* REGISTER FORM */
                <form className="mt-8 space-y-4" onSubmit={handleRegisterSubmit}>
                    {/* Visualização do Plano Selecionado */}
                    {selectedPlan && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 mb-6">
                            <div className="bg-blue-600 rounded-full p-1">
                                <CheckBadgeIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Plano Escolhido</p>
                                <p className="text-lg font-bold text-blue-700">
                                    {selectedPlan} <span className="text-sm font-normal text-slate-600">({selectedBillingCycle === 'yearly' ? 'Anual' : 'Mensal'})</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-800 text-center bg-red-100 p-3 rounded-lg border border-red-200">{error}</p>}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                        <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 focus:border-primary focus:ring-primary outline-none shadow-sm"
                            placeholder="Ex: Nexus Tech"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 focus:border-primary focus:ring-primary outline-none shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sobrenome</label>
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 focus:border-primary focus:ring-primary outline-none shadow-sm"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 focus:border-primary focus:ring-primary outline-none shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                            <input
                                type="tel"
                                required
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 focus:border-primary focus:ring-primary outline-none shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                            <input
                                type="text"
                                required
                                value={regCpf}
                                onChange={(e) => setRegCpf(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 focus:border-primary focus:ring-primary outline-none shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                        <input
                            type="password"
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 focus:border-primary focus:ring-primary outline-none shadow-sm"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 focus:border-primary focus:ring-primary outline-none shadow-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-all shadow-lg shadow-blue-900/20"
                    >
                        {isLoading ? 'Salvando...' : 'Finalizar Cadastro'}
                    </button>

                    <div className="text-center mt-4">
                        <button type="button" onClick={() => setIsLoginView(true)} className="text-sm font-bold text-primary hover:underline">
                            Já tem uma conta? Fazer Login
                        </button>
                    </div>
                </form>
            )}
            
            <div className="mt-6 text-center text-xs text-slate-400">
                <p>Protegido por reCAPTCHA e sujeito à Política de Privacidade.</p>
                <p className="mt-1">© 2025 Nexus Manager.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
