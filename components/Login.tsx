
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onRegister: (userData: { name: string; email: string; phone: string; cpf: string; password: string }) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const success = await onLogin(email, password);
        if (!success) {
            setError('Credenciais inválidas. Verifique seu email e senha.');
        }
    } catch (e) {
        setError('Erro de conexão. Tente novamente.');
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
            name: `${firstName} ${lastName}`,
            email: regEmail,
            phone: regPhone,
            cpf: regCpf,
            password: regPassword
        });
        // Assuming onRegister handles login or redirects, otherwise:
        // setIsLoginView(true);
        // setError('Cadastro realizado! Faça login.');
    } catch (e) {
        setError('Erro ao criar conta. Tente novamente.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding (Updated Gradient: Very Dark Blue) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden items-center justify-center p-12 shadow-2xl z-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="relative z-10 max-w-lg">
            <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
                Gestão Empresarial <span className="text-blue-500">Simples</span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Controle total de projetos, finanças e equipe em um único lugar. 
                Otimize seu fluxo de trabalho sem complicações.
            </p>
            
            <div className="flex gap-4">
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg border border-white/10">
                    <p className="font-bold text-2xl text-white">100%</p>
                    <p className="text-sm text-slate-300">Controle</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-lg border border-white/10">
                    <p className="font-bold text-2xl text-blue-400">Online</p>
                    <p className="text-sm text-slate-300">Em tempo real</p>
                </div>
            </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 text-slate-900 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {isLoginView ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    {isLoginView 
                        ? 'Insira suas credenciais para acessar o painel.' 
                        : 'Preencha os dados abaixo para começar.'}
                </p>
            </div>

            {isLoginView ? (
                /* LOGIN FORM */
                <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                Email Corporativo
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-900 focus:ring-blue-900 sm:text-sm transition-all focus:outline-none focus:ring-2"
                                placeholder="nome@empresa.com"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="password" class="block text-sm font-medium text-slate-700">
                                    Senha
                                </label>
                                <a href="#" className="text-sm font-medium text-blue-800 hover:text-blue-900">
                                    Esqueceu a senha?
                                </a>
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-900 focus:ring-blue-900 sm:text-sm transition-all focus:outline-none focus:ring-2"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600 text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full justify-center rounded-lg bg-blue-950 px-4 py-3 text-sm font-bold text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-lg"
                    >
                        {isLoading ? 'Acessando...' : 'Acessar Painel'}
                    </button>
                    
                    <div className="text-center mt-4">
                        <span className="text-sm text-slate-600">Não tem uma conta? </span>
                        <button 
                            type="button" 
                            onClick={() => { setIsLoginView(false); setError(''); }} 
                            className="text-sm font-bold text-blue-900 hover:underline"
                        >
                            Criar Cadastro
                        </button>
                    </div>
                </form>
            ) : (
                /* REGISTER FORM */
                <form className="mt-8 space-y-4" onSubmit={handleRegisterSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:border-blue-900 focus:ring-blue-900 sm:text-sm focus:outline-none focus:ring-2 text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sobrenome</label>
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:border-blue-900 focus:ring-blue-900 sm:text-sm focus:outline-none focus:ring-2 text-slate-900"
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
                            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:border-blue-900 focus:ring-blue-900 sm:text-sm focus:outline-none focus:ring-2 text-slate-900"
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
                                placeholder="(00) 00000-0000"
                                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:border-blue-900 focus:ring-blue-900 sm:text-sm focus:outline-none focus:ring-2 text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                            <input
                                type="text"
                                required
                                value={regCpf}
                                onChange={(e) => setRegCpf(e.target.value)}
                                placeholder="000.000.000-00"
                                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:border-blue-900 focus:ring-blue-900 sm:text-sm focus:outline-none focus:ring-2 text-slate-900"
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
                            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:border-blue-900 focus:ring-blue-900 sm:text-sm focus:outline-none focus:ring-2 text-slate-900"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:border-blue-900 focus:ring-blue-900 sm:text-sm focus:outline-none focus:ring-2 text-slate-900"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600 text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full justify-center rounded-lg bg-blue-950 px-4 py-3 text-sm font-bold text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-lg"
                    >
                        {isLoading ? 'Criando Conta...' : 'Cadastrar e Entrar'}
                    </button>

                    <div className="text-center mt-4">
                        <span className="text-sm text-slate-600">Já tem uma conta? </span>
                        <button 
                            type="button" 
                            onClick={() => { setIsLoginView(true); setError(''); }} 
                            className="text-sm font-bold text-blue-900 hover:underline"
                        >
                            Fazer Login
                        </button>
                    </div>
                </form>
            )}

            <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                    Protegido por reCAPTCHA e sujeito à Política de Privacidade.
                </p>
                <p className="text-xs text-slate-500 mt-2 font-semibold">
                    © 2025 GTS - Global Tech Software. Todos os direitos reservados.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
