# Documentação da API - Nexus Manager (Backend Contract)

## 1. Visão Geral e Arquitetura

O sistema é um SaaS Multi-tenant. O backend deve garantir o isolamento de dados entre empresas.

*   **Autenticação:** JWT (Json Web Token).
*   **Tenancy:** O `companyId` deve ser extraído do token JWT do usuário logado para filtrar todas as consultas (exceto para SuperAdmin). O frontend não deve precisar enviar `companyId` nas rotas de criação/leitura padrão.
*   **Formato de Data:** ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
*   **Moeda:** Armazenar valores monetários preferencialmente como `Decimal` ou `Float`.

---

## 2. Autenticação & Usuários

### Login
`POST /api/auth/login`
*   **Request:**
    ```json
    {
      "email": "user@example.com",
      "password": "secret_password"
    }
    ```
*   **Response (200):**
    ```json
    {
      "token": "eyJhbGciOiJIUz...",
      "user": {
        "id": "uuid",
        "name": "Nome",
        "email": "email",
        "role": "Admin", // ou 'User', 'SuperAdmin'
        "companyId": "uuid-company"
      }
    }
    ```

### Criar Usuário (Team Member)
`POST /api/users`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request:**
    ```json
    {
      "name": "Nome do Funcionario",
      "email": "func@empresa.com",
      "password": "temp_password",
      "role": "User" // ou 'Admin'
    }
    ```

### Listar Usuários
`GET /api/users`
*   **Regra:** Retorna apenas usuários da empresa do token.

---

## 3. Empresas (Super Admin & Assinaturas)

### Listar Empresas (Apenas SuperAdmin)
`GET /api/companies`

### Criar Nova Empresa (Tenant)
`POST /api/companies`
*   **Request:**
    ```json
    {
      "name": "Nome da Empresa",
      "cnpj_cpf": "00000000000",
      "subscriptionValue": 199.00,
      "currency": "BRL",
      "adminUser": {
        "name": "Nome Admin",
        "email": "admin@empresa.com",
        "phone": "+551199999999"
      }
    }
    ```
*   **Backend Logic:** Deve criar a `Company` e automaticamente criar o primeiro `User` (Admin) vinculado a ela.

### Registrar Pagamento de Assinatura
`POST /api/companies/:id/subscription/pay`
*   **Request:**
    ```json
    {
      "amount": 199.00,
      "date": "2024-05-20",
      "cardDetails": { "last4": "4242", "expiry": "12/28" } // Opcional
    }
    ```
*   **Backend Logic:** Atualiza `subscriptionDueDate` (adiciona 1 mês) e muda status para 'Ativa'.

---

## 4. CRM & Leads (Captação)

### Listar Leads
`GET /api/leads`

### Criar Lead
`POST /api/leads`
*   **Request:**
    ```json
    {
      "name": "Empresa Alvo Ltda",
      "phone": "+5511988887777",
      "email": "contato@alvo.com", // Opcional
      "address": "Rua X, 123", // Opcional
      "status": "Novo", // Novo, Contatado, Qualificado, etc.
      "source": "Google Maps",
      "notes": "Observações...",
      "messages": [] // Array opcional de mensagens iniciais
    }
    ```

### Atualizar Lead (Mover de fase ou Adicionar msg)
`PUT /api/leads/:id`
*   **Request:** (Envia os campos que mudaram)
    ```json
    {
      "status": "Qualificado",
      "messages": [ ... ] // Atualiza histórico de chat
    }
    ```

---

## 5. Gestão de Projetos & Sites

O sistema trata "Projetos" e "Sites" de forma muito similar. Você pode ter um endpoint unificado com um filtro `type` ou endpoints separados.

### Listar Projetos
`GET /api/projects`
*   **Query Params:** `?type=Project` ou `?type=Site`

### Criar Projeto
`POST /api/projects`
*   **Request:**
    ```json
    {
      "type": "Project", // ou 'Site'
      "name": "Redesign Website",
      "description": "Escopo do projeto...",
      "clientId": "uuid-client",
      "value": 5000.00,
      "downPayment": 1000.00, // Entrada
      "installments": 4, // Número de parcelas
      "currency": "BRL",
      "startDate": "2024-05-01",
      "endDate": "2024-06-01",
      "hasRetainer": false, // Mensalidade recorrente?
      "assignedPartnerIds": ["uuid-partner-1"]
    }
    ```
*   **Backend Logic:** O backend deve calcular e gerar automaticamente os registros de `Payments` (Parcelas) baseados no valor total, entrada e número de parcelas.

### Atualizar Status Financeiro (Parcela)
`PATCH /api/projects/:projectId/payments/:paymentId`
*   **Request:**
    ```json
    {
      "status": "Pago" // ou 'Atrasado'
    }
    ```

---

## 6. Clientes, Parceiros e Produtos SaaS

Estas são operações CRUD (Create, Read, Update, Delete) padrão.

### Clientes
*   `GET /api/clients`
*   `POST /api/clients`
    *   Body: `{ name, companyName, email, phone, cpf, cnpj }`
*   `PUT /api/clients/:id`

### Parceiros
*   `GET /api/partners`
*   `POST /api/partners`
    *   Body: `{ name, role, hourlyRate, isAvailable }`
*   `PUT /api/partners/:id`

### Produtos SaaS
*   `GET /api/saas-products`
*   `POST /api/saas-products`
    *   Body: `{ name, plans: [{ name, price, customerCount }] }`

---

## 7. Integrações (Settings)

### Salvar Configuração WhatsApp
`PUT /api/settings/whatsapp`
*   **Request:**
    ```json
    {
      "apiUrl": "https://evolution-api.seu-server.com",
      "apiToken": "token-seguro",
      "instanceName": "MinhaInstancia"
    }
    ```
*   **Nota:** Se o backend for fazer o disparo das mensagens (proxy), ele precisa salvar esses dados. Se o frontend disparar direto (como está hoje no código React), o backend só precisa salvar isso para persistência se o usuário trocar de navegador.

### Disparo de Mensagem (Opcional - Backend Proxy)
Se você optar por não expor a API do WhatsApp no frontend:
`POST /api/whatsapp/send`
*   **Request:**
    ```json
    {
      "phone": "+551199999999",
      "message": "Olá, tudo bem?"
    }
    ```

---

## Resumo dos Modelos de Dados (DB Schema Sugerido)

Aqui está uma sugestão rápida de tabelas para um banco relacional (PostgreSQL/MySQL):

1.  **companies:** id, name, subscription_status, etc.
2.  **users:** id, company_id (FK), email, password_hash, role.
3.  **clients:** id, company_id (FK), name, email, phone.
4.  **leads:** id, company_id (FK), name, phone, status, source.
5.  **lead_messages:** id, lead_id (FK), text, sender, timestamp.
6.  **projects:** id, company_id (FK), client_id (FK), type, value, status.
7.  **project_payments:** id, project_id (FK), amount, due_date, status.
8.  **partners:** id, company_id (FK), name, hourly_rate.
9.  **saas_products:** id, company_id (FK), name.
10. **saas_plans:** id, product_id (FK), name, price.