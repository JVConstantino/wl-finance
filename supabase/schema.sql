-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS FINANÇASPRO (SUPABASE / POSTGRESQL)
-- Execute este script no SQL Editor do seu painel do Supabase
-- ==============================================================================

-- 1. TABELA DE GRUPOS FAMILIARES / CASAL
CREATE TABLE IF NOT EXISTS public.family_groups (
    id TEXT PRIMARY KEY, -- ex: 'CASAL-LUIS-2026'
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE MEMBROS DO GRUPO FAMILIAR
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id TEXT REFERENCES public.family_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_email TEXT,
    role TEXT DEFAULT 'member', -- 'owner' | 'member'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_family_user UNIQUE (family_id, user_id)
);

-- FUNÇÃO HELPER DE SEGURANÇA PARA RLS MULTI-USUÁRIO / CASAL
CREATE OR REPLACE FUNCTION public.get_my_family_ids() 
RETURNS TABLE (family_id TEXT) AS $$
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. TABELA DE TRANSAÇÕES
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    family_id TEXT,
    paid_by TEXT DEFAULT 'conjunto', -- 'marido' | 'esposa' | 'conjunto'
    created_by_email TEXT,
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

-- 4. TABELA DE CONTAS E CARTEIRAS
CREATE TABLE IF NOT EXISTS public.accounts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    family_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE REGRAS RECORRENTES (DESPESAS/RECEITAS FIXAS)
CREATE TABLE IF NOT EXISTS public.repeating_rules (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    family_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'investimento')),
    amount NUMERIC(12,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    day INTEGER NOT NULL,
    account_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE METAS MENSAIS POR CATEGORIA
CREATE TABLE IF NOT EXISTS public.monthly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    family_id TEXT,
    category TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_category_goal UNIQUE (user_id, category)
);

-- 7. TABELA DE CATEGORIAS PERSONALIZADAS
CREATE TABLE IF NOT EXISTS public.custom_categories (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    family_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'investimento')),
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) - SEGURANÇA POR USUÁRIO E CASAL
-- ==============================================================================

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repeating_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- Políticas para FAMILY_GROUPS
DROP POLICY IF EXISTS "Membros acessam seus grupos familiares" ON public.family_groups;
CREATE POLICY "Membros acessam seus grupos familiares" 
ON public.family_groups FOR ALL 
USING (
    created_by = auth.uid() 
    OR id IN (SELECT family_id FROM public.get_my_family_ids())
) 
WITH CHECK (
    created_by = auth.uid() 
    OR id IN (SELECT family_id FROM public.get_my_family_ids())
);

-- Políticas para FAMILY_MEMBERS
DROP POLICY IF EXISTS "Membros gerenciam integrantes da família" ON public.family_members;
CREATE POLICY "Membros gerenciam integrantes da família" 
ON public.family_members FOR ALL 
USING (
    user_id = auth.uid() 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
) 
WITH CHECK (
    user_id = auth.uid() 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
);

-- Políticas para TRANSACTIONS (Pessoal + Família Compartilhada)
DROP POLICY IF EXISTS "Usuários e familiares gerenciam transações" ON public.transactions;
CREATE POLICY "Usuários e familiares gerenciam transações" 
ON public.transactions FOR ALL 
USING (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
) 
WITH CHECK (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
);

-- Políticas para ACCOUNTS
DROP POLICY IF EXISTS "Usuários e familiares gerenciam contas" ON public.accounts;
CREATE POLICY "Usuários e familiares gerenciam contas" 
ON public.accounts FOR ALL 
USING (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
) 
WITH CHECK (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
);

-- Políticas para REPEATING_RULES
DROP POLICY IF EXISTS "Usuários e familiares gerenciam regras" ON public.repeating_rules;
CREATE POLICY "Usuários e familiares gerenciam regras" 
ON public.repeating_rules FOR ALL 
USING (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
) 
WITH CHECK (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
);

-- Políticas para MONTHLY_GOALS
DROP POLICY IF EXISTS "Usuários e familiares gerenciam metas" ON public.monthly_goals;
CREATE POLICY "Usuários e familiares gerenciam metas" 
ON public.monthly_goals FOR ALL 
USING (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
) 
WITH CHECK (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
);

-- Políticas para CUSTOM_CATEGORIES
DROP POLICY IF EXISTS "Usuários e familiares gerenciam categorias" ON public.custom_categories;
CREATE POLICY "Usuários e familiares gerenciam categorias" 
ON public.custom_categories FOR ALL 
USING (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
) 
WITH CHECK (
    auth.uid() = user_id 
    OR family_id IN (SELECT family_id FROM public.get_my_family_ids())
);

-- ==============================================================================
-- ÍNDICES PARA PERFORMANCE MÁXIMA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_family ON public.transactions(user_id, family_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_family ON public.accounts(user_id, family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON public.family_members(family_id);
