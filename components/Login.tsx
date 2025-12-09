
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onRegister: (userData: any) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  
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
            // Se onLogin retornar false sem lançar erro (caso raro no novo api.ts, mas possível)
            setError('Email ou senha incorretos.');
        }
    } catch (e: any) {
        console.error(e);
        // Exibe a mensagem de erro vinda do Google Apps Script
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
        // Envia para o App.tsx -> api.ts
        await onRegister({
            companyName: companyName,
            firstName: firstName,
            lastName: lastName,
            email: regEmail,
            phone: regPhone,
            cpf: regCpf,
            password: regPassword
        });
        
        setSuccess('Cadastro realizado com sucesso! Seus dados foram salvos.');
        setIsLoginView(true);
        // Preenche o login automaticamente para facilitar
        setEmail(regEmail);
        setPassword('');
        
        // Limpa form de registro
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Lado Esquerdo - Branding com Efeito de Raio/Luz */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-dark relative overflow-hidden items-center justify-center p-12">
        
        {/* Fundo Base - Azul Profundo */}
        <div className="absolute inset-0 bg-[#020617]"></div>

        {/* Efeito de "Raio" / Luz Superior Esquerda */}
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
        
        {/* Efeito de "Raio" / Luz Central (Branco/Azul Claro) */}
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-white/10 blur-[80px] rounded-full mix-blend-overlay pointer-events-none"></div>

        {/* Efeito de Contraste Inferior Direito */}
        <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-lg">
            {/* Logo Brand */}
            <div className="mb-8 flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                    </svg>
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
        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {isLoginView ? 'Acesse sua conta' : 'Crie sua conta'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    {isLoginView ? 'Bem-vindo de volta!' : 'Preencha os dados abaixo para começar.'}
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
                /* REGISTER FORM (Campos Exatos) */
                <form className="mt-8 space-y-4" onSubmit={handleRegisterSubmit}>
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
                        {isLoading ? 'Salvando...' : 'Cadastrar'}
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
