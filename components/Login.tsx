
import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, RocketLaunchIcon } from './Icons';
import { PLANS } from '../constants';
import type { BillingCycle } from '../types';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onRegister: (userData: any) => Promise<void>;
  onBack: () => void;
  initialView?: 'login' | 'register';
  selectedPlan?: string;
  billingCycle?: BillingCycle;
}

const Login: React.FC<LoginProps> = ({ 
    onLogin, 
    onRegister, 
    onBack, 
    initialView = 'login',
    selectedPlan = 'Starter',
    billingCycle = 'monthly'
}) => {
  const [isLoginView, setIsLoginView] = useState(initialView === 'login');
  
  useEffect(() => {
      setIsLoginView(initialView === 'login');
  }, [initialView]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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

  const planDetails = PLANS.find(p => p.name === selectedPlan);
  const planPrice = planDetails 
      ? (billingCycle === 'yearly' ? planDetails.price.yearly : planDetails.price.monthly) 
      : 0;

  const handleNumericInput = (value: string, setter: (v: string) => void, limit: number) => {
      const onlyNums = value.replace(/\D/g, '');
      setter(onlyNums.slice(0, limit));
  };

  const validatePasswordComplexity = (pass: string) => {
      const hasUpper = /[A-Z]/.test(pass);
      const hasLower = /[a-z]/.test(pass);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
      const digits = pass.match(/\d/g) || [];
      const exactSixDigits = digits.length === 6;
      const exactLength = pass.length === 9;
      
      return {
          isValid: hasUpper && hasLower && hasSpecial && exactSixDigits && exactLength,
          reasons: {
              upper: hasUpper,
              lower: hasLower,
              special: hasSpecial,
              digits: exactSixDigits,
              length: exactLength
          }
      };
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        const result = await onLogin(email, password);
        if (!result) setError('Acesso negado. Verifique os dados.');
    } catch (e: any) {
        setError('Erro de conexão.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (regCpf.length !== 11) {
        setError('CPF deve ter exatamente 11 números.');
        return;
    }

    const complexity = validatePasswordComplexity(regPassword);
    if (!complexity.isValid) {
        setError('A senha deve ter 9 dígitos (6 números, 1 Maiúscula, 1 Minúscula, 1 Especial).');
        return;
    }

    if (regPassword !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }

    setIsLoading(true);
    try {
        await onRegister({
            companyName, firstName, lastName,
            email: regEmail, phone: regPhone, cpf: regCpf,
            password: regPassword,
        });
        setSuccess('Cadastro concluído!');
        setIsLoginView(true);
    } catch (e: any) {
        setError(e.message || 'Erro no cadastro.');
    } finally {
        setIsLoading(false);
    }
  };

  const inputClasses = "block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm font-semibold text-xs";

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      
      {/* Visual Section - Dark */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#020617] relative items-center justify-center p-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.1]"></div>
        
        <div className="relative z-10 max-w-lg">
            <div className="mb-12 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                    <RocketLaunchIcon className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-white uppercase">NEXUS<span className="text-blue-500">MANAGER</span></span>
            </div>
            
            <h1 className="text-6xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
                Gerencie sua <br /> Agência em <br /> <span className="text-blue-500 text-7xl">um só lugar</span>
            </h1>
            
            <p className="text-slate-400 text-lg font-medium leading-relaxed border-l-2 border-blue-600 pl-6">
                Controle total de projetos, finanças e equipe. Excelência e inovação para o seu negócio.
            </p>
        </div>
      </div>

      {/* Form Section - White Card */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6 bg-white p-8 sm:p-12 rounded-[40px] shadow-2xl shadow-slate-200 border border-white">
            <div className="text-center space-y-1">
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
                    {isLoginView ? 'Acessar Painel' : 'Criar sua Conta'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    {isLoginView ? 'Seja bem-vindo de volta' : 'Preencha os dados abaixo'}
                </p>
            </div>

            {isLoginView ? (
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-[10px] font-bold text-center">{success}</div>}
                    {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-[10px] font-bold text-center">{error}</div>}
                    
                    <div className="space-y-3">
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="Email de acesso" />
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} placeholder="Sua senha" />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-xs font-black text-white uppercase tracking-widest hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20">
                        {isLoading ? 'Entrando...' : 'Entrar no Nexus'}
                    </button>
                    
                    <div className="text-center pt-2">
                        <button type="button" onClick={() => setIsLoginView(false)} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">
                            Ainda não tem conta? Cadastre-se
                        </button>
                    </div>
                </form>
            ) : (
                <form className="space-y-3" onSubmit={handleRegisterSubmit}>
                    {/* Compact Header for Register */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center mb-2">
                        <div>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Assinatura</p>
                            <h4 className="text-lg font-black text-slate-900">{selectedPlan}</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-slate-900">R$ {planPrice.toLocaleString('pt-BR')}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">/{billingCycle === 'yearly' ? 'anual' : 'mensal'}</p>
                        </div>
                    </div>

                    {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[10px] font-bold text-center">{error}</div>}

                    <div className="grid grid-cols-1 gap-3">
                        <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClasses} placeholder="Nome da Empresa" />

                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClasses} placeholder="Nome" />
                            <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClasses} placeholder="Sobrenome" />
                        </div>
                        
                        <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputClasses} placeholder="Email Corporativo" />

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="tel"
                                required
                                value={regPhone}
                                onChange={(e) => handleNumericInput(e.target.value, setRegPhone, 11)}
                                className={inputClasses}
                                placeholder="WhatsApp (11 dig)"
                                maxLength={11}
                            />
                            <input
                                type="text"
                                required
                                value={regCpf}
                                onChange={(e) => handleNumericInput(e.target.value, setRegCpf, 11)}
                                className={inputClasses}
                                placeholder="CPF (11 dig)"
                                maxLength={11}
                            />
                        </div>

                        {/* Password Logic Compact */}
                        <div className="grid grid-cols-2 gap-3">
                            <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={inputClasses} placeholder="Senha (9 dig)" maxLength={9} />
                            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClasses} placeholder="Confirmar" maxLength={9} />
                        </div>
                        
                        {/* Requirement indicators */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
                            <span className={`text-[9px] font-bold flex items-center gap-1 ${regPassword.length === 9 ? 'text-emerald-600' : 'text-slate-300'}`}>● Exato 9 dig</span>
                            <span className={`text-[9px] font-bold flex items-center gap-1 ${(regPassword.match(/\d/g) || []).length === 6 ? 'text-emerald-600' : 'text-slate-300'}`}>● 6 Números</span>
                            <span className={`text-[9px] font-bold flex items-center gap-1 ${/[A-Z]/.test(regPassword) ? 'text-emerald-600' : 'text-slate-300'}`}>● 1 Maiúscula</span>
                            <span className={`text-[9px] font-bold flex items-center gap-1 ${/[!@#$%^&*]/.test(regPassword) ? 'text-emerald-600' : 'text-slate-300'}`}>● 1 Especial</span>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-xs font-black text-white uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all mt-4">
                        {isLoading ? 'Criando Conta...' : 'Finalizar e Acessar'}
                    </button>

                    <div className="text-center">
                        <button type="button" onClick={() => setIsLoginView(true)} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">
                            Já tem conta? Fazer Login
                        </button>
                    </div>
                </form>
            )}
            
            <button onClick={onBack} className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                Voltar para página inicial
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
