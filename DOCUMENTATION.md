
# 📘 Nexus Manager - Documentação do Sistema

## 1. Visão Geral
O **Nexus Manager** é um sistema de gerenciamento empresarial (ERP/CRM) focado em agências, prestadores de serviço e empresas de software. 
Ele foi projetado para ser **Multi-tenant** (gerenciar múltiplas empresas) e possui uma arquitetura híbrida:
- **Frontend:** React (SPA) rodando no navegador.
- **Backend:** Google Sheets (Planilhas Google) para armazenamento de dados gratuito e seguro.

## 2. Instalação e Configuração

### Pré-requisitos
1. Uma conta Google (para a planilha).
2. Uma chave de API do Google Gemini (para a IA).

### Passo a Passo
1. **Conexão com Banco de Dados:**
   - O sistema já vem com a URL do backend configurada no arquivo `services/api.ts`.
   - Todos os dados (Clientes, Projetos, Leads) são salvos automaticamente na nuvem.

2. **Configuração da IA (Captação de Leads):**
   - Abra o arquivo `components/LeadGen.tsx`.
   - Na linha 6, substitua `"COLE_SUA_CHAVE_AIZA_AQUI"` pela sua chave real da Google AI Studio.
   - Salve o arquivo.

3. **Configuração do WhatsApp:**
   - Para abrir conversas manuais (Web), não precisa configurar nada.
   - Para disparos automáticos via API (Z-API, Evolution), vá no menu "Configuração" e preencha a URL e Token.

## 3. Módulos do Sistema

### 📊 Dashboard
Visão geral do negócio. Mostra faturamento mensal, projetos em atraso e status do pipeline de vendas.

### 🤝 CRM & Captação
- **CRM (Pipeline):** Quadro Kanban para mover leads entre fases (Novo, Contatado, Ganho). Inclui histórico de chat.
- **Captação (Deep Search):**
  - Digite um Nicho (ex: "Pizzaria") e Local (ex: "São Paulo").
  - O sistema usa IA para varrer o Google Maps e trazer listas de empresas com telefone.
  - Permite importar em massa para o CRM e iniciar conversas no WhatsApp.

### 👥 Clientes e Parceiros
- Cadastro completo de clientes (PF/PJ).
- Gestão de parceiros/freelancers com valor/hora.

### 📁 Projetos e Sites
- Gestão de entregas com datas, valores e parcelas.
- **Financeiro Automático:** Ao criar um projeto com parcelas, o sistema gera automaticamente os lançamentos no módulo Financeiro.

### 💰 Financeiro
- Visão de fluxo de caixa (Realizado vs Projetado).
- Gráficos de desempenho mensal e anual.
- Controle de inadimplência.

### ☁️ SaaS (Produtos)
- Gestão de produtos de assinatura recorrente.
- Controle de planos e quantidade de clientes.

## 4. Arquitetura Técnica

### Fluxo de Dados
1. O usuário preenche um formulário no React.
2. O `services/api.ts` envia um POST para o Google Apps Script.
3. O Google Apps Script salva a linha na aba correspondente da Planilha Google.

### Estrutura da Planilha (Backend)
O sistema espera 5 abas na planilha:
- `Users` (Login)
- `Clients` (Clientes)
- `Projects` (Projetos/Sites)
- `Leads` (CRM)
- `Config` (Configurações gerais)

## 5. Solução de Problemas Comuns

- **Tela Branca/Sumindo:** Geralmente causado por tradutor automático do navegador. O sistema já possui bloqueio (`notranslate`), mas evite usar extensões de tradução.
- **"Erro na API":** Verifique se sua internet está conectada. O backend (Google Sheets) pode levar 1-2 segundos para responder ("Cold Start").
- **Captação não traz resultados:** Verifique se a chave API no `LeadGen.tsx` está correta e válida.

---
*Desenvolvido para Nexus Manager.*
