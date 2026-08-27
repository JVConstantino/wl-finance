-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS FINANÇASPRO (SUPABASE / POSTGRESQL)
-- Execute este script no SQL Editor do seu painel do Supabase
-- ==============================================================================

-- 1. TABELA DE TRANSAÇÕES
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'investimento')),
    amount NUMERIC(12,2) NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pago',
    account_id TEXT,
    is_from_repeat_rule TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE CONTAS E CARTEIRAS
CREATE TABLE IF NOT EXISTS public.accounts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE REGRAS RECORRENTES (DESPESAS/RECEITAS FIXAS)
CREATE TABLE IF NOT EXISTS public.repeating_rules (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'investimento')),
    amount NUMERIC(12,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    day INTEGER NOT NULL,
    account_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE METAS MENSAIS POR CATEGORIA
CREATE TABLE IF NOT EXISTS public.monthly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    category TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_category_goal UNIQUE (user_id, category)
);

-- 5. TABELA DE CATEGORIAS PERSONALIZADAS
CREATE TABLE IF NOT EXISTS public.custom_categories (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'investimento')),
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) - SEGURANÇA POR USUÁRIO
-- Cada usuário só poderá visualizar, criar, atualizar e excluir seus próprios dados
-- ==============================================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repeating_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para TRANSACTIONS
DROP POLICY IF EXISTS "Usuários gerenciam suas transações" ON public.transactions;
CREATE POLICY "Usuários gerenciam suas transações" 
ON public.transactions 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Políticas de acesso para ACCOUNTS
DROP POLICY IF EXISTS "Usuários gerenciam suas contas" ON public.accounts;
CREATE POLICY "Usuários gerenciam suas contas" 
ON public.accounts 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Políticas de acesso para REPEATING_RULES
DROP POLICY IF EXISTS "Usuários gerenciam suas regras" ON public.repeating_rules;
CREATE POLICY "Usuários gerenciam suas regras" 
ON public.repeating_rules 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Políticas de acesso para MONTHLY_GOALS
DROP POLICY IF EXISTS "Usuários gerenciam suas metas" ON public.monthly_goals;
CREATE POLICY "Usuários gerenciam suas metas" 
ON public.monthly_goals 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Políticas de acesso para CUSTOM_CATEGORIES
DROP POLICY IF EXISTS "Usuários gerenciam suas categorias" ON public.custom_categories;
CREATE POLICY "Usuários gerenciam suas categorias" 
ON public.custom_categories 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- ÍNDICES PARA PERFORMANCE MÁXIMA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_cat ON public.transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_user ON public.repeating_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.monthly_goals(user_id);
