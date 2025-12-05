
# 📘 Nexus Manager - Documentação Técnica

## 1. Arquitetura
O **Nexus Manager** é uma aplicação React (Single Page Application).

- **Frontend:** React + Vite + TailwindCSS.
- **Backend:** Externo (Deve ser configurado via VITE_BACKEND_URL).

## 2. Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:

```env
# URL do Backend
VITE_BACKEND_URL=http://localhost:3000

# Chave da API do Google Gemini (Opcional, para Captação de Leads)
API_KEY=sua_chave_gemini
```

## 3. Estrutura de Pastas
- `src/components`: Componentes visuais e páginas.
- `src/services`: Camada de comunicação HTTP (`api.ts`).
- `src/context`: Gerenciamento de estado global (`DataContext`).
- `src/types`: Definições de tipos TypeScript.

## 4. Deploy do Frontend
Gere os arquivos estáticos para produção:
`npm run build`

A pasta `dist` gerada pode ser hospedada em qualquer servidor web ou serviço de nuvem de sua preferência (Google Cloud Storage, AWS S3, Apache, Nginx, etc).
