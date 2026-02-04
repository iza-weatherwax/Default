# Story Chat - Aplicativo de Escrita Criativa com IA

Um aplicativo mobile (Progressive Web App) para escrita criativa que usa IA para ajudar autores a desenvolver histórias consistentes, mantendo controle total sobre personagens, mundo e narrativa.

## 🌟 Funcionalidades Principais

### 📝 Interface de Chat Limpa
- Interface estilo WhatsApp otimizada para mobile
- Escreva e desenvolva sua história em conversas naturais
- A IA responde usando apenas informação relevante para o momento
- Visualização em tempo real de tokens e custos

### 🧠 Memory Bank (Banco de Memórias)
Sistema inteligente de gerenciamento de informações da história:
- **Categorias**: Personagens, Mundo, Eventos, Relacionamentos
- **Níveis de Importância**: Crítico (1) a Contexto (4)
- **Busca Semântica**: Encontra informações relevantes automaticamente
- **Rastreamento de Uso**: Veja quantas vezes cada memória foi usada
- **Palavras-chave**: Sistema de tags para busca eficiente

### 🔒 Character Locks (Travas de Personagem)
Sistema que garante consistência absoluta:
- Defina regras que **NUNCA** podem ser violadas
- Exemplo: "Azael não tem olhos" - bloqueia qualquer menção a olhos
- Detecção automática de violações
- Três modos de ação:
  - **Regenerar**: Gera nova resposta automaticamente
  - **Avisar**: Mostra violação mas permite continuar
  - **Auto-corrigir**: Tenta corrigir o texto automaticamente

### 🔍 Scene State (Estado da Cena)
Rastreamento inteligente do que está acontecendo:
- Detecta personagens presentes na cena
- Rastreia localização atual
- Conta menções de cada elemento
- Previne repetições excessivas

### 🎯 Busca Semântica
Sistema que entende significado, não apenas palavras:
- Usa TF-IDF e similaridade de cosseno
- Quando você escreve "Bia encontra aranha", automaticamente lembra que "Bia tem medo de aranhas"
- Prioriza memórias por relevância e importância

### 📊 Priority Queue (Fila de Prioridade)
Sistema inteligente de seleção de contexto:
1. **Travas** - SEMPRE incluídas
2. **Memórias Críticas** relacionadas - Prioridade 1
3. **Memórias Importantes** relacionadas - Prioridade 2
4. **Memórias Úteis** - Prioridade 3
5. **Informação de Fundo** - Prioridade 4 (só se sobrar espaço)

### 🚫 Deduplication Checker (Detector de Repetição)
Previne repetições irritantes:
- Detecta se algo foi mencionado 2+ vezes na cena
- Avisa se mencionou há menos de 5 parágrafos
- Permite referências breves a detalhes já estabelecidos

### 💰 Token Counter
Acompanhamento em tempo real:
- Veja exatamente quantos tokens está usando
- Custo estimado em dólares
- Barra de progresso visual com cores (verde → amarelo → vermelho)
- Controle de orçamento por sessão

### ✅ Post-Validation
Validação automática antes de mostrar resposta:
- Verifica violações de travas
- Detecta repetições excessivas
- Confirma consistência de personagens
- Opção de regenerar automaticamente se necessário

## 🛠️ Stack Técnico

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: TailwindCSS (otimizado para mobile)
- **Storage**: IndexedDB via Dexie
- **State Management**: Zustand
- **IA**: Claude API (Anthropic) / OpenRouter
- **Icons**: Lucide React

## 🚀 Como Usar

### Instalação Local

```bash
# Clonar o repositório
git clone <seu-repo>
cd story-chat-app

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Configuração Inicial

1. **Abra o aplicativo** no navegador (geralmente `http://localhost:5173`)

2. **Vá para Settings** (ícone de engrenagem)

3. **Configure sua API Key**:
   - **Anthropic**: Obtenha em https://console.anthropic.com
   - **OpenRouter**: Obtenha em https://openrouter.ai
   - Sem API key, o app funciona em modo demo com respostas simuladas

4. **Ajuste os parâmetros**:
   - **Temperatura**: 0.0 (preciso) a 1.0 (criativo)
   - **Tokens Máximos**: Tamanho das respostas (100-4000)
   - **Orçamento de Tokens**: Quanto contexto incluir (1000-100000)

### Fluxo de Trabalho Recomendado

#### 1. Configure Memórias Primeiro
Vá para **Memórias** e adicione informações importantes:

```
Categoria: Personagem
Importância: Crítico (1)
Descrição: Azael é um guerreiro cego desde nascimento. Usa outros sentidos para "ver".
Palavras-chave: Azael, cego, sentidos
```

#### 2. Crie Travas de Segurança
Vá para **Travas** e defina regras obrigatórias:

```
Personagem: Azael
Regra: Azael NUNCA pode ter olhos ou visão
Palavras Proibidas: olhos, olhar, enxergar, ver, visão
Ação: Regenerar
```

#### 3. Comece a Escrever no Chat
Volte para **Chat** e comece a desenvolver sua história:

```
Você: Azael caminha pela floresta escura.

IA: A floresta estava silenciosa. Azael parou,
seus ouvidos aguçados captando cada som ao redor.
O vento carregava o cheiro de pinheiros e terra úmida...
```

#### 4. O Sistema Funciona Automaticamente
- ✅ Busca memórias relevantes sobre Azael
- ✅ Inclui travas (nunca menciona olhos)
- ✅ Detecta repetições
- ✅ Mantém consistência

## 📱 Uso Mobile

O app é otimizado para mobile:

- **Instalar na Tela Inicial** (iOS/Android):
  1. Abra no navegador
  2. Safari (iOS): Compartilhar → Adicionar à Tela Inicial
  3. Chrome (Android): Menu → Adicionar à tela inicial

- **Safe Areas**: Suporte completo para notch/island
- **Gestos**: Scroll natural, toque responsivo
- **Teclado**: Auto-ajuste quando teclado aparece
- **Offline**: Funciona offline (dados locais no IndexedDB)

## 📊 Estrutura do Projeto

```
src/
├── components/
│   ├── ChatScreen.tsx         # Interface principal de chat
│   ├── MemoryManager.tsx      # Gerenciador de memórias
│   ├── LockEditor.tsx         # Editor de travas
│   ├── Settings.tsx           # Configurações
│   └── BottomNav.tsx          # Navegação inferior
├── lib/
│   ├── db.ts                  # Configuração Dexie/IndexedDB
│   ├── aiService.ts           # Integração Claude API
│   ├── semanticSearch.ts      # Busca semântica TF-IDF
│   ├── validation.ts          # Validação e detecção
│   ├── contextSelection.ts    # Seleção de contexto
│   └── tokenCounter.ts        # Contador de tokens
├── stores/
│   └── useAppStore.ts         # State management (Zustand)
└── types/
    └── index.ts               # TypeScript types
```

## 🎨 Personalização

### Modelos Suportados

#### Anthropic
- `claude-3-5-sonnet-20241022` (Recomendado)
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307` (Rápido e barato)

#### OpenRouter
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-3-opus`
- E muitos outros modelos

### Custos Estimados

| Modelo | Input (1M tokens) | Output (1M tokens) |
|--------|-------------------|-------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Opus | $15.00 | $75.00 |
| Claude 3 Haiku | $0.25 | $1.25 |

## 🔧 Desenvolvimento

### Build para Produção

```bash
npm run build
```

### Deploy

#### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Variáveis de Ambiente

Crie `.env.local`:

```env
VITE_DEFAULT_API_KEY=sk-ant-...
VITE_DEFAULT_MODEL=claude-3-5-sonnet-20241022
```

## 🐛 Troubleshooting

### "API key not set"
- Vá em Settings e configure sua API key
- Ou use o modo demo sem API key

### Respostas muito curtas
- Aumente "Tokens Máximos" em Settings
- Aumente a Temperatura para mais criatividade

### IA ignorando travas
- Verifique se as palavras proibidas estão corretas
- Use modo "Regenerar" em vez de "Avisar"
- Adicione padrão regex para detecção mais precisa

### Muitas repetições
- Ative "Detecção de Repetição" em Settings
- Reduza a temperatura
- Adicione mais memórias variadas

## 📝 Licença

MIT License - Use livremente!

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra issues ou pull requests.

---

Feito com ❤️ para escritores criativos
