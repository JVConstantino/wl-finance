import { createClient } from '@supabase/supabase-js';

// Obter URL e Key das variáveis de ambiente ou do LocalStorage (permite configurar direto pelo app)
export const getSupabaseConfig = () => {
    try {
        let envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
        let envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';

        let localUrl = '';
        let localKey = '';
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                localUrl = localStorage.getItem('fp_supabase_url') || '';
                localKey = localStorage.getItem('fp_supabase_anon_key') || '';
            } catch(e) {}
        }

        let url = (envUrl.trim() !== '') ? envUrl.trim() : localUrl.trim();
        let key = (envKey.trim() !== '') ? envKey.trim() : localKey.trim();

        // Sanitização e limpeza de aspas e barras
        url = url.replace(/['"]+/g, '').replace(/\/+$/, '');
        key = key.replace(/['"]+/g, '');

        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        return {
            url,
            key,
            isConfigured: Boolean(url && key && url.includes('.supabase.co'))
        };
    } catch (err) {
        console.warn('Erro ao ler configuração Supabase:', err);
        return { url: '', key: '', isConfigured: false };
    }
};

export const saveSupabaseConfig = (url, key) => {
    let cleanUrl = (url || '').trim().replace(/['"]+/g, '').replace(/\/+$/, '');
    let cleanKey = (key || '').trim().replace(/['"]+/g, '');

    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
    }

    if (cleanUrl) localStorage.setItem('fp_supabase_url', cleanUrl);
    if (cleanKey) localStorage.setItem('fp_supabase_anon_key', cleanKey);
    // Recarregar cliente
    initSupabase();
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem('fp_supabase_url');
    localStorage.removeItem('fp_supabase_anon_key');
    supabaseInstance = null;
};

let supabaseInstance = null;

export const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;
    const config = getSupabaseConfig();
    if (config.isConfigured) {
        try {
            supabaseInstance = createClient(config.url, config.key, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            return supabaseInstance;
        } catch (err) {
            console.error('Erro ao inicializar Supabase:', err);
            return null;
        }
    }
    return null;
};

export const initSupabase = () => {
    supabaseInstance = null;
    return getSupabase();
};

// ==============================================================================
// AUTHENTICATION HELPERS
// ==============================================================================

export const authSignUp = async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase não configurado. Verifique a URL e Anon Key.');
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    } catch (err) {
        if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
            throw new Error('Falha de conexão com o Supabase. Verifique se a URL do projeto está correta (https://xxxx.supabase.co) e se o projeto está ativo.');
        }
        throw err;
    }
};

export const authSignIn = async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
};

export const authSignOut = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const authResetPassword = async (email) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
    });
    if (error) throw error;
    return data;
};

export const getCurrentUser = async () => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const getSession = async () => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

// ==============================================================================
// FAMÍLIA & CASAL (COMPARTILHAMENTO DE CONTA MULTI-DISPOSITIVO)
// ==============================================================================

export const fetchUserFamily = async (userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return null;
    try {
        const { data, error } = await supabase
            .from('family_members')
            .select('family_id, user_email, role, family_groups(name, created_by)')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) return null;
        if (!data) return null;

        // Buscar membros do grupo
        const { data: allMembers } = await supabase
            .from('family_members')
            .select('user_email, role, created_at')
            .eq('family_id', data.family_id);

        return {
            familyId: data.family_id,
            familyName: data.family_groups?.name || 'Família',
            role: data.role,
            members: allMembers || []
        };
    } catch (err) {
        console.warn('Erro ao buscar família:', err);
        return null;
    }
};

export const joinOrCreateFamily = async (familyCode, familyName, user) => {
    const supabase = getSupabase();
    if (!supabase || !user) throw new Error('Supabase ou usuário não disponível');
    const code = familyCode.trim().toUpperCase();

    // 1. Verificar se o grupo familiar já existe ou criar
    const { data: existingGroup } = await supabase
        .from('family_groups')
        .select('*')
        .eq('id', code)
        .maybeSingle();

    if (!existingGroup) {
        const { error: errCreate } = await supabase
            .from('family_groups')
            .insert({
                id: code,
                name: familyName || `Família ${code}`,
                created_by: user.id
            });
        if (errCreate) console.warn('Aviso ao criar grupo:', errCreate);
    }

    // 2. Inserir ou atualizar o membro
    const { error: errMember } = await supabase
        .from('family_members')
        .upsert({
            family_id: code,
            user_id: user.id,
            user_email: user.email,
            role: existingGroup ? 'member' : 'owner'
        }, { onConflict: 'family_id, user_id' });

    if (errMember) throw errMember;
    return { familyId: code, familyName: existingGroup?.name || familyName || `Família ${code}` };
};

export const leaveFamily = async (familyCode, userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyCode)
        .eq('user_id', userId);
};

// ==============================================================================
// DATA SYNC & CLOUD OPERATIONS
// ==============================================================================

export const fetchAllUserData = async () => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase não configurado');

    const [
        { data: txs, error: errTx },
        { data: accs, error: errAcc },
        { data: rules, error: errRules },
        { data: goals, error: errGoals },
        { data: cats, error: errCats }
    ] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('repeating_rules').select('*').order('day', { ascending: true }),
        supabase.from('monthly_goals').select('*'),
        supabase.from('custom_categories').select('*')
    ]);

    if (errTx) console.error('Erro ao buscar transações:', errTx);
    if (errAcc) console.error('Erro ao buscar contas:', errAcc);
    if (errRules) console.error('Erro ao buscar regras:', errRules);
    if (errGoals) console.error('Erro ao buscar metas:', errGoals);
    if (errCats) console.error('Erro ao buscar categorias:', errCats);

    // Mapear formato das transações para compatibilidade
    const formattedTransactions = (txs || []).map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        category: t.category,
        date: t.date,
        description: t.description || '',
        status: t.status || 'pago',
        accountId: t.account_id || 'acc_main',
        isFromRepeatRule: t.is_from_repeat_rule || undefined,
        paidBy: t.paid_by || 'conjunto',
        createdByEmail: t.created_by_email || undefined,
        familyId: t.family_id || undefined
    }));

    const formattedAccounts = (accs || []).map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        color: a.color || 'from-blue-600 to-indigo-800'
    }));

    const formattedRules = (rules || []).map(r => ({
        id: r.id,
        type: r.type,
        amount: Number(r.amount),
        category: r.category,
        description: r.description || '',
        day: Number(r.day),
        accountId: r.account_id || 'acc_main'
    }));

    const formattedGoals = (goals || []).reduce((acc, curr) => {
        acc[curr.category] = Number(curr.amount);
        return acc;
    }, {});

    const formattedCategories = (cats || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        color: c.color || '#3b82f6'
    }));

    return {
        transactions: formattedTransactions,
        accounts: formattedAccounts,
        repeatingRules: formattedRules,
        monthlyGoals: formattedGoals,
        customCategories: formattedCategories
    };
};

export const syncUpsertTransaction = async (tx, userId, familyId, userEmail) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;

    const payload = {
        id: tx.id,
        user_id: userId,
        family_id: familyId || null,
        paid_by: tx.paidBy || 'conjunto',
        created_by_email: userEmail || null,
        type: tx.type,
        amount: Number(tx.amount),
        category: tx.category,
        date: tx.date,
        description: tx.description || '',
        status: tx.status || 'pago',
        account_id: tx.accountId || 'acc_main',
        is_from_repeat_rule: tx.isFromRepeatRule || null
    };

    const { error } = await supabase.from('transactions').upsert(payload);
    if (error) console.error('Erro ao salvar transação na nuvem:', error);
};

export const syncDeleteTransaction = async (id, userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.error('Erro ao excluir transação da nuvem:', error);
};

export const syncUpsertAccount = async (account, userId, familyId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;

    const payload = {
        id: account.id,
        user_id: userId,
        family_id: familyId || null,
        name: account.name,
        type: account.type,
        color: account.color || 'from-blue-600 to-indigo-800'
    };

    const { error } = await supabase.from('accounts').upsert(payload);
    if (error) console.error('Erro ao salvar conta na nuvem:', error);
};

export const syncDeleteAccount = async (id, userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) console.error('Erro ao excluir conta da nuvem:', error);
};

export const syncUpsertRule = async (rule, userId, familyId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;

    const payload = {
        id: rule.id,
        user_id: userId,
        family_id: familyId || null,
        type: rule.type,
        amount: Number(rule.amount),
        category: rule.category,
        description: rule.description || '',
        day: Number(rule.day),
        account_id: rule.accountId || 'acc_main'
    };

    const { error } = await supabase.from('repeating_rules').upsert(payload);
    if (error) console.error('Erro ao salvar regra na nuvem:', error);
};

export const syncDeleteRule = async (id, userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    const { error } = await supabase.from('repeating_rules').delete().eq('id', id);
    if (error) console.error('Erro ao excluir regra da nuvem:', error);
};

export const syncUpsertGoal = async (category, amount, userId, familyId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;

    const payload = {
        user_id: userId,
        family_id: familyId || null,
        category,
        amount: Number(amount),
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('monthly_goals').upsert(payload, { onConflict: 'user_id, category' });
    if (error) console.error('Erro ao salvar meta na nuvem:', error);
};

export const syncUpsertCategory = async (cat, userId, familyId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;

    const payload = {
        id: cat.id || `cat_${Date.now()}`,
        user_id: userId,
        family_id: familyId || null,
        name: cat.name,
        type: cat.type,
        color: cat.color || '#3b82f6'
    };

    const { error } = await supabase.from('custom_categories').upsert(payload);
    if (error) console.error('Erro ao salvar categoria na nuvem:', error);
};

export const syncDeleteCategory = async (id, userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    const { error } = await supabase.from('custom_categories').delete().eq('id', id);
    if (error) console.error('Erro ao excluir categoria da nuvem:', error);
};

// ==============================================================================
// MIGRAÇÃO LOCALSTORAGE -> NUVEM SUPABASE
// ==============================================================================

export const migrateAllLocalData = async (data, userId, familyId, userEmail) => {
    const supabase = getSupabase();
    if (!supabase || !userId) throw new Error('Supabase ou usuário não disponível');

    const { transactions = [], accounts = [], repeatingRules = [], monthlyGoals = {}, customCategories = [] } = data;

    // 1. Contas
    if (accounts.length > 0) {
        const accPayloads = accounts.map(a => ({
            id: a.id,
            user_id: userId,
            family_id: familyId || null,
            name: a.name,
            type: a.type,
            color: a.color || ''
        }));
        await supabase.from('accounts').upsert(accPayloads);
    }

    // 2. Categorias Personalizadas
    if (customCategories.length > 0) {
        const catPayloads = customCategories.map(c => ({
            id: c.id,
            user_id: userId,
            family_id: familyId || null,
            name: c.name,
            type: c.type,
            color: c.color || '#3b82f6'
        }));
        await supabase.from('custom_categories').upsert(catPayloads);
    }

    // 3. Regras Recorrentes
    if (repeatingRules.length > 0) {
        const rulePayloads = repeatingRules.map(r => ({
            id: r.id,
            user_id: userId,
            family_id: familyId || null,
            type: r.type,
            amount: Number(r.amount),
            category: r.category,
            description: r.description || '',
            day: Number(r.day),
            account_id: r.accountId || 'acc_main'
        }));
        await supabase.from('repeating_rules').upsert(rulePayloads);
    }

    // 4. Metas
    const goalEntries = Object.entries(monthlyGoals);
    if (goalEntries.length > 0) {
        const goalPayloads = goalEntries.map(([category, amount]) => ({
            user_id: userId,
            family_id: familyId || null,
            category,
            amount: Number(amount),
            updated_at: new Date().toISOString()
        }));
        await supabase.from('monthly_goals').upsert(goalPayloads, { onConflict: 'user_id, category' });
    }

    // 5. Transações
    if (transactions.length > 0) {
        const txPayloads = transactions.map(t => ({
            id: t.id,
            user_id: userId,
            family_id: familyId || null,
            paid_by: t.paidBy || 'conjunto',
            created_by_email: userEmail || null,
            type: t.type,
            amount: Number(t.amount),
            category: t.category,
            date: t.date,
            description: t.description || '',
            status: t.status || 'pago',
            account_id: t.accountId || 'acc_main',
            is_from_repeat_rule: t.isFromRepeatRule || null
        }));
        await supabase.from('transactions').upsert(txPayloads);
    }

    return true;
};
