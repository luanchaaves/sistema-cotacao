# 🤖 Robô LED Partner — Sistema de Cotação Automática de Eventos

> **Sistema web profissional de geração de orçamentos e cotações comerciais em tempo real para atrações de eventos (Robô de LED, Personagens Vivos, Cilindro CO2, Fogos Indoor Gerb e Combos Promocionais).**

![Robô LED Partner](https://raw.githubusercontent.com/luanchaaves/sistema-cotacao/main/public/images/robo-hero.png)

---

## 🎯 Sobre o Projeto

O **Sistema de Cotação Robô LED Partner** foi desenvolvido para transformar o processo de atendimento e captação de clientes. Ele permite que qualquer cliente simule e gere um **orçamento comercial completo e profissional 24h por dia**, calculando automaticamente:

1. **Valores das Atrações & Efeitos** (por hora contratada ou taxa fixa);
2. **Combos Promocionais** (com desconto inteligente e sem bitributação de itens inclusos);
3. **Logística & Frete em Tempo Real** (ida e volta calculadas a partir de São Bernardo do Campo - SP via integração de mapas);
4. **Cálculo de Combustível** (baseado em consumo km/L e preço do litro configuráveis);
5. **Margem Operacional Fixa de Deslocamento** (R$ 30,00 fixos);
6. **Pedágios** (identificação e suporte a tarifas cadastradas por rodovia);
7. **Piso de Frete Mínimo** (garantia de viabilidade operacional);
8. **Disparo Imediato para WhatsApp** com texto comercial formatado e link direto para os canais oficiais (Instagram e Linktree).

---

## 🚀 Principais Funcionalidades

### 👤 Área Pública do Cliente (Jornada em 5 Etapas)
- **Etapa 1 — Dados do Evento:** Nome, WhatsApp com máscara, tipo de evento (Casamento, Aniversário, 15 Anos, Infantil, Corporativo, Formatura, etc.), data, horário e convidados.
- **Etapa 2 — Localização & Rota:** Busca automática por CEP (ViaCEP) e cálculo de distância rodoviária exata por geocodificação e roteamento OSRM/OpenStreetMap com fallback seguro. Detalhamento transparente do frete (ida e volta, combustível, margem operacional e pedágios).
- **Etapa 3 — Atrações & Combos:** Seleção de combos com descontos especiais ou seleção individual de atrações. Modal interativo com fotos reais de personagens vivos (Homem-Aranha, Mickey, Minnie, Patrulha Canina, Sonic, La Casa de Papel, etc.).
- **Etapa 4 — Duração & Observações:** Seletor de duração do show (30min, 1h, 1h30, 2h, 2h30, 3h, 4h ou personalizado) e campo para pedidos especiais.
- **Etapa 5 — Resumo da Proposta Comercial:** Cartão de proposta comercial de alto padrão com código único (`#RLP-2026-XXXX`), detalhamento financeiro, aviso legal e botões de ação:
  - **Quero Contratar / Falar no WhatsApp** (abre o WhatsApp oficial com a mensagem pronta preenchida);
  - **Copiar Resumo** (para colar em qualquer canal);
  - **Imprimir / Salvar em PDF** (layout pronto para impressão).
- **Página Pública do Orçamento (`/orcamento/[code]`):** Link compartilhável com a proposta comercial permanente.

---

### 🛡️ Painel Administrativo Completo (`/admin`)
- **Dashboard com Métricas Comerciais:** Volume total de propostas geradas, cotações hoje/mês, volume financeiro estimado, ticket médio e taxa de confirmação.
- **Gestão de Orçamentos (`/admin/orcamentos`):** Tabela com busca em tempo real por nome/telefone/código/cidade, filtros de status (Pendente, Contatado, Confirmado, Cancelado), gaveta com raio-x da cotação e botão de contato com 1 clique no WhatsApp.
- **Parâmetros Comerciais & Frete (`/admin/configuracoes`):**
  - Endereço da base de origem (São Bernardo do Campo - SP, CEP, coordenadas);
  - Consumo médio do veículo (km/L);
  - Preço médio da gasolina (R$/L);
  - Margem operacional fixa de deslocamento (R$);
  - Frete mínimo garantido (R$);
  - Contatos oficiais (WhatsApp comercial, Instagram e Linktree).
- **CRUD de Serviços & Efeitos (`/admin/servicos`):** Cadastre, edite preços, mude imagens, alterne entre cobrança horária ou taxa fixa, ative ou desative itens.
- **CRUD de Personagens Vivos (`/admin/personagens`):** Gestão de figurinos e catálogo com imagens e categorias temáticas.
- **CRUD de Combos Promocionais (`/admin/combos`):** Criação de pacotes com preço regular vs. preço promocional, itens inclusos e selos de destaque.
- **CRUD de Praças de Pedágio (`/admin/pedagios`):** Cadastro de rodovias e tarifas.

---

## 🧮 Regras Comerciais e Fórmulas de Cálculo

```
distância total = distância de ida × 2
litros necessários = distância total ÷ consumo do veículo (km/L)
combustível = litros necessários × preço da gasolina (R$/L)
frete calculado = combustível + margem operacional fixa + pedágios
frete final = MÁXIMO(frete calculado, frete mínimo)

subtotal atrações = valor combo selecionado + soma dos serviços extras individuais
total do orçamento = subtotal atrações + frete final
```

---

## 🛠️ Stack Tecnológica

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) com paleta escura premium (Fuchsia, Cyan, Emerald e Dark Glassmorphism)
- **ORM & Banco de Dados:** [Prisma](https://www.prisma.io/) com SQLite (zero dependência externa de infraestrutura, 100% pronto para PostgreSQL/MySQL)
- **Autenticação:** JWT com cookies seguros via [jose](https://github.com/panva/jose) e hash [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Geocodificação & Roteamento:** Integração com ViaCEP + OpenStreetMap Nominatim + OSRM Routing Engine com cálculo de Haversine fallback
- **Interatividade:** [Lucide React](https://lucide.dev/) + [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 💻 Como Executar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/luanchaaves/sistema-cotacao.git
cd sistema-cotacao
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz (ou copie de `.env.example`):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-super-segura-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Inicializar o Banco de Dados
```bash
npx prisma db push
```

### 5. Executar em modo desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🔐 Acesso Administrativo Padrão

- **URL do Painel:** `http://localhost:3000/admin` (ou `http://localhost:3000/admin/login`)
- **Email:** `admin@roboledpartner.com.br`
- **Senha:** `admin123`

*(As credenciais e todos os parâmetros comerciais podem ser alterados diretamente no painel administrativo).*

---

## 🌐 Deploy em Produção

O projeto está otimizado para deploy em qualquer plataforma moderna (Vercel, Railway, Render, Fly.io ou VPS com Node.js):

```bash
# Build de produção
npm run build

# Iniciar servidor
npm run start
```

---

## 📱 Contatos & Redes Oficiais da Robô LED Partner

- **WhatsApp Oficial:** [(11) 91997-3647](https://api.whatsapp.com/send/?phone=5511919973647&type=phone_number&app_absent=0)
- **Instagram:** [@roboledpartner](https://www.instagram.com/roboledpartner/)
- **Linktree:** [linktr.ee/roboledpartner](https://linktr.ee/roboledpartner)

---

Desenvolvido com excelência para a **Robô LED Partner** ✨
