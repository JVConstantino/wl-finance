import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus, ArrowUp, ArrowDown, Wallet, Clock, TrendingUp, Home, Coffee,
    Car, Briefcase, Smartphone, CheckCircle2, Circle, Trash2,
    X, ChevronLeft, ChevronRight, Repeat, Edit2, Calendar as CalendarIcon,
    PieChart, LayoutGrid, Target, AlertTriangle, Cloud, CloudOff, Loader2,
    LineChart, Landmark, User, Search, DownloadCloud, Settings, Tag,
    CreditCard, BarChart3, Lightbulb, UploadCloud, FileText,
    CalendarDays, MessageSquare, Send, Users, Camera, Moon, Sun,
    Wifi, History, Sparkles, Activity, ArrowRightLeft, Key, Check, Info,

    Download, ShieldCheck, Layers, ChevronDown, Database, LogIn, LogOut, RefreshCw
} from 'lucide-react';
import {
    getSupabase, getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig,
    authSignUp, authSignIn, authSignOut, authResetPassword,
    fetchAllUserData, syncUpsertTransaction, syncDeleteTransaction,
    syncUpsertAccount, syncDeleteAccount, syncUpsertRule, syncDeleteRule,
    syncUpsertGoal, syncUpsertCategory, syncDeleteCategory, migrateAllLocalData
} from './lib/supabase';


// Configurações Base
const baseCategories = {
    entrada: ['Salário', 'Freelance', 'Rendimentos', 'Vendas', 'Outros'],
    saida: ['Casa', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Assinaturas', 'Outros'],
    investimento: ['Renda Fixa', 'Ações', 'Cripto', 'Reserva de Emergência', 'Fundos Imobiliários']
};

const baseCategoryColors = {
    'Casa': '#3b82f6', 'Alimentação': '#f97316', 'Transporte': '#64748b',
    'Lazer': '#a855f7', 'Saúde': '#ef4444', 'Educação': '#06b6d4',
    'Assinaturas': '#ec4899', 'Outros': '#14b8a6',
    'Renda Fixa': '#10b981', 'Ações': '#6366f1', 'Cripto': '#f59e0b',
    'Reserva de Emergência': '#0ea5e9', 'Fundos Imobiliários': '#8b5cf6',
    'Salário': '#22c55e', 'Freelance': '#84cc16', 'Rendimentos': '#10b981', 'Vendas': '#eab308'
};

const defaultAccounts = [
    { id: 'acc_main', name: 'Conta Principal', type: 'banco', color: 'from-blue-600 to-indigo-800' },
    { id: 'acc_wallet', name: 'Carteira Física', type: 'dinheiro', color: 'from-emerald-500 to-teal-700' },
    { id: 'acc_credit', name: 'Cartão de Crédito', type: 'credito', color: 'from-rose-500 to-pink-700' }
];

const initialSampleTransactions = [
    {
        id: 'tx_init_1',
        type: 'entrada',
        amount: 6500,
        category: 'Salário',
        date: new Date().toISOString().split('T')[0],
        description: 'Salário Mensal',
        status: 'pago',
        accountId: 'acc_main'
    },
    {
        id: 'tx_init_2',
        type: 'saida',
        amount: 1450,
        category: 'Casa',
        date: new Date().toISOString().split('T')[0],
        description: 'Aluguel + Condomínio',
        status: 'pago',
        accountId: 'acc_main'
    },
    {
        id: 'tx_init_3',
        type: 'saida',
        amount: 380,
        category: 'Alimentação',
        date: new Date().toISOString().split('T')[0],
        description: 'Supermercado da Semana',
        status: 'pago',
        accountId: 'acc_credit'
    },
    {
        id: 'tx_init_4',
        type: 'saida',
        amount: 55.90,
        category: 'Assinaturas',
        date: new Date().toISOString().split('T')[0],
        description: 'Netflix Premium',
        status: 'pago',
        accountId: 'acc_credit',
        isFromRepeatRule: 'rule_sample_netflix'
    },
    {
        id: 'tx_init_5',
        type: 'investimento',
        amount: 1000,
        category: 'Renda Fixa',
        date: new Date().toISOString().split('T')[0],
        description: 'Tesouro Selic 2029',
        status: 'pago',
        accountId: 'acc_main'
    }
];

const initialSampleRules = [
    {
        id: 'rule_sample_netflix',
        type: 'saida',
        amount: 55.90,
        category: 'Assinaturas',
        description: 'Netflix Premium',
        day: 10,
        accountId: 'acc_credit'
    },
    {
        id: 'rule_sample_spotify',
        type: 'saida',
        amount: 34.90,
        category: 'Assinaturas',
        description: 'Spotify Família',
        day: 15,
        accountId: 'acc_credit'
    }
];

export default function App() {
    const [isInitializing, setIsInitializing] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('fp_theme');
        return saved ? JSON.parse(saved) : false;
    });

    // PWA Install Prompt
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallPWA = async () => {
        if (!deferredPrompt) {
            showToast("Para instalar, use o menu do navegador (Adicionar à Tela de Início / Instalar aplicativo).");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
            showToast("FinançasPro instalado com sucesso!");
        }
        setDeferredPrompt(null);
    };

    // SISTEMA DE NOTIFICAÇÕES (Toasts)
    const [toastMsg, setToastMsg] = useState('');
    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3500);
    };

    // =========================================================================
    // SISTEMA PULL-TO-REFRESH (PWA & MOBILE IPHONE)
    // =========================================================================
    const [pullY, setPullY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const touchStartRef = useRef(0);
    const isPullingRef = useRef(false);

    useEffect(() => {
        const handleTouchStart = (e) => {
            if (window.scrollY <= 5 && !isRefreshing) {
                touchStartRef.current = e.touches[0].clientY;
                isPullingRef.current = true;
            } else {
                isPullingRef.current = false;
            }
        };

        const handleTouchMove = (e) => {
            if (!isPullingRef.current || isRefreshing) return;
            const currentY = e.touches[0].clientY;
            const diff = currentY - touchStartRef.current;
            if (diff > 0 && window.scrollY <= 5) {
                // Efeito elástico suave estilo iOS
                const pullDistance = Math.min(diff * 0.45, 90);
                setPullY(pullDistance);
                if (pullDistance > 15 && e.cancelable) {
                    e.preventDefault();
                }
            } else {
                setPullY(0);
            }
        };

        const handleTouchEnd = async () => {
            if (!isPullingRef.current) return;
            isPullingRef.current = false;
            if (pullY >= 50 && !isRefreshing) {
                setIsRefreshing(true);
                setPullY(65);
                if (navigator.vibrate) {
                    try { navigator.vibrate(25); } catch (e) {}
                }
                try {
                    if (supabaseUser) {
                        await loadCloudData(supabaseUser);
                    } else {
                        const savedT = localStorage.getItem('fp_transactions');
                        if (savedT) setTransactions(JSON.parse(savedT));
                        await new Promise(r => setTimeout(r, 600));
                    }
                    showToast("Dados e finanças sincronizados!");
                } catch (err) {
                    console.error('Erro ao atualizar:', err);
                } finally {
                    setTimeout(() => {
                        setIsRefreshing(false);
                        setPullY(0);
                    }, 400);
                }
            } else {
                setPullY(0);
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isRefreshing, supabaseUser, pullY]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('inicio'); // 'inicio' | 'analise' | 'calendario' | 'investimentos'
    const [analysisView, setAnalysisView] = useState('mes');
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());

    // Modais e Estados
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [cancelFutureRepeats, setCancelFutureRepeats] = useState(true);

    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingCategoryGoal, setEditingCategoryGoal] = useState(null);
    const [goalAmountInput, setGoalAmountInput] = useState('');

    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [newCatData, setNewCatData] = useState({ name: '', type: 'saida', color: '#3b82f6' });

    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [familyCodeInput, setFamilyCodeInput] = useState('');
    const [activeFamilyCode, setActiveFamilyCode] = useState(() => {
        return localStorage.getItem('fp_family_code') || null;
    });

    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState(() => {
        return localStorage.getItem('fp_gemini_key') || '';
    });
    const [apiKeyInput, setApiKeyInput] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('todos');

    // Pagamento de Fatura
    const [isPayInvoiceModalOpen, setIsPayInvoiceModalOpen] = useState(false);
    const [invoiceAccountToPay, setInvoiceAccountToPay] = useState(null);
    const [invoiceSourceAccount, setInvoiceSourceAccount] = useState('acc_main');

    // Assistente IA FinBot
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [isScanningReceipt, setIsScanningReceipt] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        {
            id: 1,
            role: 'bot',
            text: 'Olá! Sou o FinBot, seu copiloto de finanças. Posso te dar dicas de economia, analisar seu mês ou registrar gastos para você! Tente digitar por exemplo: "Gastei 45 no mercado" ou "Recebi 1200 de freelance".'
        }
    ]);
    const chatEndRef = useRef(null);

    // Estados de Dados Principais (com persistência LocalStorage)
    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('fp_transactions');
        return saved ? JSON.parse(saved) : initialSampleTransactions;
    });

    const [repeatingRules, setRepeatingRules] = useState(() => {
        const saved = localStorage.getItem('fp_rules');
        return saved ? JSON.parse(saved) : initialSampleRules;
    });

    const [monthlyGoals, setMonthlyGoals] = useState(() => {
        const saved = localStorage.getItem('fp_goals');
        return saved ? JSON.parse(saved) : { 'Casa': 2500, 'Alimentação': 1200, 'Transporte': 600, 'Lazer': 500 };
    });

    const [customCategories, setCustomCategories] = useState(() => {
        const saved = localStorage.getItem('fp_custom_categories');
        return saved ? JSON.parse(saved) : [];
    });

    const [accounts, setAccounts] = useState(() => {
        const saved = localStorage.getItem('fp_accounts');
        return saved ? JSON.parse(saved) : defaultAccounts;
    });

    const [formData, setFormData] = useState({
        type: 'saida',
        amount: '',
        category: 'Casa',
        date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'pago',
        isRepeating: false,
        accountId: 'acc_main'
    });


    // =========================================================================
    // ESTADOS E SINCRONIZAÇÃO SUPABASE (NUVEM & AUTH)
    // =========================================================================
    const [supabaseUser, setSupabaseUser] = useState(null);
    const [supabaseConfig, setSupabaseConfigState] = useState(() => getSupabaseConfig());
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [authSuccessMsg, setAuthSuccessMsg] = useState('');
    const [isCloudConfigModalOpen, setIsCloudConfigModalOpen] = useState(false);
    const [configUrlInput, setConfigUrlInput] = useState('');
    const [configKeyInput, setConfigKeyInput] = useState('');
    const [isMigrating, setIsMigrating] = useState(false);

    // Carregar dados da nuvem quando usuário estiver autenticado
    const loadCloudData = async (user) => {
        if (!user) return;
        try {
            setIsCloudSyncing(true);
            const cloudData = await fetchAllUserData();
            if (cloudData) {
                if (cloudData.transactions && cloudData.transactions.length > 0) {
                    setTransactions(cloudData.transactions);
                }
                if (cloudData.accounts && cloudData.accounts.length > 0) {
                    setAccounts(cloudData.accounts);
                }
                if (cloudData.repeatingRules && cloudData.repeatingRules.length > 0) {
                    setRepeatingRules(cloudData.repeatingRules);
                }
                if (cloudData.monthlyGoals && Object.keys(cloudData.monthlyGoals).length > 0) {
                    setMonthlyGoals(cloudData.monthlyGoals);
                }
                if (cloudData.customCategories && cloudData.customCategories.length > 0) {
                    setCustomCategories(cloudData.customCategories);
                }
            }
        } catch (err) {
            console.error('Erro ao sincronizar com nuvem:', err);
        } finally {
            setIsCloudSyncing(false);
        }
    };

    // Inicialização do Supabase & Monitoramento de Sessão
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase) return;

        // Obter sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setSupabaseUser(session.user);
                loadCloudData(session.user);
            }
        });

        // Ouvir mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setSupabaseUser(session.user);
                if (event === 'SIGNED_IN') {
                    showToast(`Bem-vindo, ${session.user.email}!`);
                    loadCloudData(session.user);
                }
            } else {
                setSupabaseUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabaseConfig.isConfigured]);

    // Subscrição em Tempo Real (Realtime) para sincronizar múltiplos dispositivos
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase || !supabaseUser) return;

        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
                loadCloudData(supabaseUser);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_goals' }, () => {
                loadCloudData(supabaseUser);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabaseUser]);

    // Ações de Autenticação
    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccessMsg('');

        if (!authEmail.trim()) {
            setAuthError('Informe seu e-mail.');
            return;
        }

        setAuthLoading(true);
        try {
            if (authMode === 'login') {
                if (!authPassword) throw new Error('Informe sua senha.');
                await authSignIn(authEmail.trim(), authPassword);
                setIsAuthModalOpen(false);
                setAuthEmail('');
                setAuthPassword('');
                showToast('Login realizado com sucesso!');
            } else if (authMode === 'signup') {
                if (authPassword.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');
                const res = await authSignUp(authEmail.trim(), authPassword);
                if (res?.user && !res?.session) {
                    setAuthSuccessMsg('Cadastro criado! Verifique a confirmação no seu e-mail.');
                } else {
                    setIsAuthModalOpen(false);
                    setAuthEmail('');
                    setAuthPassword('');
                    showToast('Conta criada com sucesso!');
                }
            } else if (authMode === 'forgot') {
                await authResetPassword(authEmail.trim());
                setAuthSuccessMsg('Link de recuperação enviado para seu e-mail!');
            }
        } catch (err) {
            setAuthError(err.message || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await authSignOut();
            setSupabaseUser(null);
            showToast('Você saiu da sua conta.');
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveCloudConfig = (e) => {
        e.preventDefault();
        if (!configUrlInput.trim() || !configKeyInput.trim()) {
            showToast('Preencha a URL e a Anon Key do Supabase.');
            return;
        }
        saveSupabaseConfig(configUrlInput, configKeyInput);
        setSupabaseConfigState(getSupabaseConfig());
        setIsCloudConfigModalOpen(false);
        showToast('Supabase configurado com sucesso!');
    };

    const handleMigrateToCloud = async () => {
        if (!supabaseUser) {
            showToast('Faça login primeiro para sincronizar.');
            setIsAuthModalOpen(true);
            return;
        }
        try {
            setIsMigrating(true);
            await migrateAllLocalData({
                transactions,
                accounts,
                repeatingRules,
                monthlyGoals,
                customCategories
            }, supabaseUser.id);
            showToast('Todos os dados locais foram salvos na nuvem!');
            loadCloudData(supabaseUser);
        } catch (err) {
            console.error('Erro na migração:', err);
            showToast('Erro ao migrar dados: ' + (err.message || 'verifique as tabelas'));
        } finally {
            setIsMigrating(false);
        }
    };

    // Salvar no LocalStorage automaticamente (backup offline)

    useEffect(() => {
        localStorage.setItem('fp_transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('fp_rules', JSON.stringify(repeatingRules));
    }, [repeatingRules]);

    useEffect(() => {
        localStorage.setItem('fp_goals', JSON.stringify(monthlyGoals));
    }, [monthlyGoals]);

    useEffect(() => {
        localStorage.setItem('fp_custom_categories', JSON.stringify(customCategories));
    }, [customCategories]);

    useEffect(() => {
        localStorage.setItem('fp_accounts', JSON.stringify(accounts));
    }, [accounts]);

    useEffect(() => {
        localStorage.setItem('fp_theme', JSON.stringify(isDarkMode));
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        const timer = setTimeout(() => setIsInitializing(false), 300);
        return () => clearTimeout(timer);
    }, []);

    // Categorias Combinadas
    const allCategories = useMemo(() => {
        const combined = {
            entrada: [...baseCategories.entrada],
            saida: [...baseCategories.saida],
            investimento: [...baseCategories.investimento]
        };
        customCategories.forEach(cat => {
            if (combined[cat.type] && !combined[cat.type].includes(cat.name)) {
                combined[cat.type].push(cat.name);
            }
        });
        return combined;
    }, [customCategories]);

    const allCategoryColors = useMemo(() => {
        const combined = { ...baseCategoryColors };
        customCategories.forEach(cat => {
            combined[cat.name] = cat.color;
        });
        return combined;
    }, [customCategories]);

    // Transações do Mês Selecionado
    const monthlyTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date || new Date());
            return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, currentDate]);

    const filteredAndSearchedTransactions = useMemo(() => {
        return monthlyTransactions.filter(t => {
            const desc = t.description || '';
            const cat = t.category || '';
            const searchMatch = desc.toLowerCase().includes(searchQuery.toLowerCase()) || cat.toLowerCase().includes(searchQuery.toLowerCase());
            let filterMatch = true;
            if (filterType === 'entrada') filterMatch = t.type === 'entrada';
            if (filterType === 'saida') filterMatch = t.type === 'saida';
            if (filterType === 'investimento') filterMatch = t.type === 'investimento';
            if (filterType === 'pendentes') filterMatch = t.status === 'pendente';
            return searchMatch && filterMatch;
        });
    }, [monthlyTransactions, searchQuery, filterType]);

    // Saldos das Contas
    const accountBalances = useMemo(() => {
        const balances = {};
        accounts.forEach(acc => balances[acc.id] = 0);
        transactions.forEach(t => {
            if (t.status !== 'pago') return;

            if (t.type === 'transferencia') {
                if (balances[t.sourceAccountId] !== undefined) balances[t.sourceAccountId] -= t.amount;
                if (balances[t.targetAccountId] !== undefined) balances[t.targetAccountId] += t.amount;
            } else {
                const accId = t.accountId || 'acc_main';
                if (balances[accId] !== undefined) {
                    if (t.type === 'entrada') balances[accId] += t.amount;
                    if (t.type === 'saida' || t.type === 'investimento') balances[accId] -= t.amount;
                }
            }
        });
        return balances;
    }, [transactions, accounts]);

    const totals = useMemo(() => {
        return monthlyTransactions.reduce((acc, curr) => {
            if (curr.status === 'pago') {
                if (curr.type === 'entrada') acc.receitas += curr.amount;
                if (curr.type === 'saida') acc.despesas += curr.amount;
                if (curr.type === 'investimento') acc.investimentos += curr.amount;
            }
            return acc;
        }, { receitas: 0, despesas: 0, investimentos: 0 });
    }, [monthlyTransactions]);

    const totalLiquidBalance = useMemo(() => {
        return Object.values(accountBalances).reduce((a, b) => a + b, 0);
    }, [accountBalances]);

    const analysisData = useMemo(() => {
        const expenses = monthlyTransactions.filter(t => t.type === 'saida' && t.status === 'pago');
        const grouped = expenses.reduce((acc, curr) => {
            const cat = curr.category || 'Outros';
            acc[cat] = (acc[cat] || 0) + curr.amount;
            return acc;
        }, {});
        const totalExpenses = Object.values(grouped).reduce((a, b) => a + b, 0);
        let data = Object.entries(grouped).map(([name, amount]) => ({
            name,
            amount,
            percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
            color: allCategoryColors[name] || '#94a3b8'
        })).sort((a, b) => b.amount - a.amount);
        return { data, total: totalExpenses, grouped };
    }, [monthlyTransactions, allCategoryColors]);

    const investmentData = useMemo(() => {
        const allInvestments = transactions.filter(t => t.type === 'investimento' && t.status === 'pago');
        const grouped = allInvestments.reduce((acc, curr) => {
            const cat = curr.category || 'Outros';
            acc[cat] = (acc[cat] || 0) + curr.amount;
            return acc;
        }, {});
        const totalInvested = Object.values(grouped).reduce((a, b) => a + b, 0);
        let data = Object.entries(grouped).map(([name, amount]) => ({
            name,
            amount,
            percentage: totalInvested > 0 ? (amount / totalInvested) * 100 : 0,
            color: allCategoryColors[name] || '#6366f1'
        })).sort((a, b) => b.amount - a.amount);
        return { data, total: totalInvested, history: allInvestments };
    }, [transactions, allCategoryColors]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const getCategoryIcon = (category, colorClass = '') => {
        if (category === 'Transferência') return <ArrowRightLeft size={18} className={colorClass} />;

        const icons = {
            'Casa': <Home size={18} className={colorClass} />,
            'Alimentação': <Coffee size={18} className={colorClass} />,
            'Lazer': <Smartphone size={18} className={colorClass} />,
            'Transporte': <Car size={18} className={colorClass} />,
            'Saúde': <Activity size={18} className={colorClass} />,
            'Educação': <FileText size={18} className={colorClass} />,
            'Assinaturas': <Repeat size={18} className={colorClass} />,
            'Salário': <Briefcase size={18} className={colorClass} />,
            'Freelance': <Wallet size={18} className={colorClass} />,
            'Rendimentos': <TrendingUp size={18} className={colorClass} />,
            'Vendas': <Tag size={18} className={colorClass} />,
            'Renda Fixa': <Landmark size={18} className={colorClass} />,
            'Ações': <BarChart3 size={18} className={colorClass} />,
            'Cripto': <LineChart size={18} className={colorClass} />,
            'Reserva de Emergência': <Wallet size={18} className={colorClass} />,
            'Fundos Imobiliários': <Home size={18} className={colorClass} />
        };
        return icons[category] || <Tag size={18} className={colorClass} />;
    };

    const createPieSlices = (data) => {
        let cumulativePercent = 0;
        if (data.length === 0) {
            return [<circle key="empty" cx="50" cy="50" r="40" fill="transparent" stroke={isDarkMode ? '#334155' : '#f1f5f9'} strokeWidth="20" />];
        }
        return data.map((slice) => {
            const dashArray = `${(slice.percentage * 251.2) / 100} 251.2`;
            const dashOffset = -((cumulativePercent * 251.2) / 100);
            cumulativePercent += slice.percentage;
            return (
                <circle
                    key={slice.name}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="20"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap={data.length === 1 ? "round" : "butt"}
                    className="transition-all duration-700 ease-out origin-center -rotate-90"
                />
            );
        });
    };

    const assinaturasAtivas = repeatingRules.filter(r => r.type === 'saida');
    const gastoMensalAssinaturas = assinaturasAtivas.reduce((acc, r) => acc + (r.amount || 0), 0);
    const gastoAnualAssinaturas = gastoMensalAssinaturas * 12;

    const futureProjectionData = useMemo(() => {
        const currentTotalBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0);
        const ganhoMensalBase = repeatingRules.filter(r => r.type === 'entrada').reduce((a, b) => a + (b.amount || 0), 0) || totals.receitas;
        const gastoMensalBase = repeatingRules.filter(r => r.type === 'saida').reduce((a, b) => a + (b.amount || 0), 0) || totals.despesas;
        const netMensal = ganhoMensalBase - gastoMensalBase;

        return Array.from({ length: 6 }).map((_, i) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 1);
            const projBalance = currentTotalBalance + (netMensal * (i + 1));
            return {
                month: date.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
                balance: projBalance,
                isNegative: projBalance < 0
            };
        });
    }, [accountBalances, repeatingRules, totals, currentDate]);

    const maxFutureBalance = Math.max(...futureProjectionData.map(d => d.balance), 100);
    const minFutureBalance = Math.min(...futureProjectionData.map(d => d.balance), 0);

    // Variáveis e Lógica do Calendário
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: totalDays }, (_, i) => i + 1);
    }, [currentDate]);

    const blanks = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayIndex = new Date(year, month, 1).getDay();
        return Array.from({ length: firstDayIndex }, (_, i) => i);
    }, [currentDate]);

    // Ações de Transações
    const saveTransaction = (tData) => {
        setTransactions(prev => {
            const idx = prev.findIndex(item => item.id === tData.id);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = tData;
                return updated;
            }
            return [tData, ...prev];
        });

        if (supabaseUser) {
            syncUpsertTransaction(tData, supabaseUser.id);
        }

    };

    const deleteTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));

        if (supabaseUser) {
            syncDeleteTransaction(id, supabaseUser.id);
        }

    };

    const saveRule = (rData) => {
        setRepeatingRules(prev => {
            const idx = prev.findIndex(item => item.id === rData.id);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = rData;
                return updated;
            }
            return [...prev, rData];
        });

        if (supabaseUser) {
            syncUpsertRule(rData, supabaseUser.id);
        }

    };

    const deleteRule = (ruleId) => {
        setRepeatingRules(prev => prev.filter(r => r.id !== ruleId));

        if (supabaseUser) {
            syncDeleteRule(ruleId, supabaseUser.id);
        }

    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const amt = parseFloat(formData.amount);
        if (isNaN(amt) || amt <= 0 || !formData.description.trim()) {
            showToast('Preencha um valor válido e uma descrição.');
            return;
        }

        if (editingId) {
            const existing = transactions.find(t => t.id === editingId);
            const updated = {
                ...existing,
                type: formData.type,
                amount: amt,
                category: formData.category,
                date: formData.date,
                description: formData.description.trim(),
                status: formData.status,
                accountId: formData.accountId
            };
            saveTransaction(updated);
            showToast('Registro editado com sucesso!');
        } else {
            const newId = 'tx_' + Date.now().toString();
            const newT = {
                id: newId,
                type: formData.type,
                amount: amt,
                category: formData.category,
                date: formData.date,
                description: formData.description.trim(),
                status: formData.status,
                accountId: formData.accountId
            };
            saveTransaction(newT);

            if (formData.isRepeating) {
                const newRule = {
                    id: 'rule_' + Date.now().toString(),
                    type: formData.type,
                    amount: amt,
                    category: formData.category,
                    description: formData.description.trim(),
                    day: new Date(formData.date + 'T12:00:00').getDate(),
                    accountId: formData.accountId
                };
                saveRule(newRule);
            }
            showToast('Adicionado com sucesso!');
        }
        setIsFormOpen(false);
    };

    const handlePayInvoice = (e) => {
        e.preventDefault();
        if (!invoiceAccountToPay || !invoiceSourceAccount) return;

        const currentDebt = Math.abs(accountBalances[invoiceAccountToPay.id] || 0);
        if (currentDebt <= 0) {
            showToast("Esta fatura já está zerada.");
            return;
        }

        const transferTx = {
            id: 'tx_pay_' + Date.now().toString(),
            type: 'transferencia',
            amount: currentDebt,
            category: 'Transferência',
            date: new Date().toISOString().split('T')[0],
            description: `Pagamento de Fatura (${invoiceAccountToPay.name})`,
            status: 'pago',
            sourceAccountId: invoiceSourceAccount,
            targetAccountId: invoiceAccountToPay.id
        };

        saveTransaction(transferTx);
        showToast(`Fatura de ${formatCurrency(currentDebt)} paga com sucesso!`);
        setIsPayInvoiceModalOpen(false);
        setInvoiceAccountToPay(null);
    };

    const exportToCSV = () => {
        if (monthlyTransactions.length === 0) {
            showToast("Não há dados para exportar neste mês.");
            return;
        }
        try {
            const headers = ["Data", "Tipo", "Categoria", "Descrição", "Valor (R$)", "Estado", "Conta"];
            const rows = monthlyTransactions.map(t => [
                t.date,
                t.type.toUpperCase(),
                t.category,
                `"${(t.description || '').replace(/"/g, '""')}"`,
                t.amount.toFixed(2).replace('.', ','),
                t.status.toUpperCase(),
                accounts.find(a => a.id === t.accountId)?.name || 'Conta'
            ]);
            const csvContent = [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Extrato_FinancasPro_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.csv`;
            link.click();
            showToast("Relatório CSV baixado com sucesso!");
        } catch (err) {
            showToast("Erro ao exportar arquivo.");
        }
    };

    const openNewForm = (presetType = 'saida') => {
        setEditingId(null);
        setFormData({
            type: presetType,
            amount: '',
            category: allCategories[presetType] ? allCategories[presetType][0] : 'Outros',
            date: new Date().toISOString().split('T')[0],
            description: '',
            status: 'pago',
            isRepeating: false,
            accountId: 'acc_main'
        });
        setIsFormOpen(true);
    };

    const openEditForm = (transaction) => {
        setEditingId(transaction.id);
        setFormData({
            type: transaction.type,
            amount: transaction.amount.toString(),
            category: transaction.category,
            date: transaction.date,
            description: transaction.description,
            status: transaction.status,
            isRepeating: false,
            accountId: transaction.accountId || 'acc_main'
        });
        setIsFormOpen(true);
    };

    const toggleStatus = (id) => {
        const t = transactions.find(x => x.id === id);
        if (t) {
            const nextStatus = t.status === 'pago' ? 'pendente' : 'pago';
            saveTransaction({ ...t, status: nextStatus });
            showToast(nextStatus === 'pago' ? 'Marcado como concluído!' : 'Marcado como pendente.');
        }
    };

    const confirmDelete = () => {
        if (!transactionToDelete) return;
        deleteTransaction(transactionToDelete.id);
        if (cancelFutureRepeats && transactionToDelete.isFromRepeatRule) {
            deleteRule(transactionToDelete.isFromRepeatRule);
        }
        setTransactionToDelete(null);
        showToast("Registro excluído com sucesso!");
    };

    // Chatbot IA
    useEffect(() => {
        if (chatEndRef.current && isAssistantOpen) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, isAssistantOpen, isAiTyping]);

    const handleBotChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userText = chatInput.trim();
        setChatHistory(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);
        setChatInput('');
        setIsAiTyping(true);

        if (geminiApiKey.trim()) {
            try {
                const systemPrompt = `Você é o FinBot, assistente do FinançasPro. Responda em Português do Brasil de forma amigável e concisa.
Resumo atual deste mês: Ganhos: R$ ${totals.receitas.toFixed(2)}, Gastos: R$ ${totals.despesas.toFixed(2)}, Saldo Geral: R$ ${totalLiquidBalance.toFixed(2)}.
Se o usuário pedir para registrar um gasto, ganho ou aporte, retorne APENAS UM JSON no formato exato:
{"action": "add", "type": "saida" | "entrada" | "investimento", "amount": numero_sem_cifrao, "description": "nome curto", "category": "escolha_uma"}
Categorias de saída: Casa, Alimentação, Transporte, Lazer, Saúde, Educação, Assinaturas, Outros.
Entradas: Salário, Freelance, Rendimentos, Vendas.
Investimentos: Renda Fixa, Ações, Cripto, Reserva de Emergência, Fundos Imobiliários.`;

                const payload = {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userText }] }],
                    generationConfig: { temperature: 0.2 }
                };

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('API Error ' + res.status);
                const json = await res.json();
                const replyText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

                if (replyText.includes('"action"') && replyText.includes('"add"')) {
                    const cleanJson = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
                    const data = JSON.parse(cleanJson);
                    const newT = {
                        id: 'tx_' + Date.now().toString(),
                        type: data.type || 'saida',
                        amount: parseFloat(data.amount) || 0,
                        category: data.category || 'Outros',
                        date: new Date().toISOString().split('T')[0],
                        description: data.description || 'Novo Registro',
                        status: 'pago',
                        accountId: 'acc_main'
                    };
                    saveTransaction(newT);
                    setChatHistory(prev => [...prev, {
                        id: Date.now(),
                        role: 'bot',
                        text: `✅ Pronto! Registrei ${data.type === 'entrada' ? 'um ganho' : data.type === 'investimento' ? 'um investimento' : 'um gasto'} de ${formatCurrency(data.amount)} em "${data.category}" (${data.description}).`
                    }]);
                } else {
                    setChatHistory(prev => [...prev, { id: Date.now(), role: 'bot', text: replyText }]);
                }
            } catch (err) {
                console.error(err);
                setChatHistory(prev => [...prev, {
                    id: Date.now(),
                    role: 'bot',
                    text: "Tive um problema ao conectar com a API do Gemini. Verifique sua chave nas configurações."
                }]);
            }
        } else {
            setTimeout(() => {
                const lower = userText.toLowerCase();
                const matchNumber = lower.match(/(?:r\$|\$)?\s*(\d+(?:[.,]\d+)?)/);
                const amount = matchNumber ? parseFloat(matchNumber[1].replace(',', '.')) : null;

                if (amount && (lower.includes('gastei') || lower.includes('paguei') || lower.includes('comprei') || lower.includes('despesa'))) {
                    let cat = 'Outros';
                    if (lower.includes('mercado') || lower.includes('almoço') || lower.includes('comida') || lower.includes('ifood')) cat = 'Alimentação';
                    else if (lower.includes('uber') || lower.includes('gasolina') || lower.includes('combustivel')) cat = 'Transporte';
                    else if (lower.includes('luz') || lower.includes('água') || lower.includes('aluguel')) cat = 'Casa';
                    else if (lower.includes('cinema') || lower.includes('jogo') || lower.includes('festa')) cat = 'Lazer';
                    else if (lower.includes('farmacia') || lower.includes('remedio') || lower.includes('medico')) cat = 'Saúde';

                    const desc = userText.replace(/gastei|paguei|comprei|no|na|com|de|r\$|\$/gi, '').trim() || 'Despesa Rápida';
                    const newT = {
                        id: 'tx_' + Date.now().toString(),
                        type: 'saida',
                        amount: amount,
                        category: cat,
                        date: new Date().toISOString().split('T')[0],
                        description: desc,
                        status: 'pago',
                        accountId: 'acc_main'
                    };
                    saveTransaction(newT);
                    setChatHistory(prev => [...prev, {
                        id: Date.now(),
                        role: 'bot',
                        text: `✅ Anotado! Adicionei uma despesa de ${formatCurrency(amount)} em ${cat} ("${desc}").`
                    }]);
                } else if (amount && (lower.includes('recebi') || lower.includes('ganhei') || lower.includes('salario') || lower.includes('freela'))) {
                    let cat = lower.includes('salario') ? 'Salário' : lower.includes('freela') ? 'Freelance' : 'Rendimentos';
                    const newT = {
                        id: 'tx_' + Date.now().toString(),
                        type: 'entrada',
                        amount: amount,
                        category: cat,
                        date: new Date().toISOString().split('T')[0],
                        description: 'Receita Registrada',
                        status: 'pago',
                        accountId: 'acc_main'
                    };
                    saveTransaction(newT);
                    setChatHistory(prev => [...prev, {
                        id: Date.now(),
                        role: 'bot',
                        text: `🎉 Maravilha! Registrei uma receita de ${formatCurrency(amount)} em ${cat}.`
                    }]);
                } else if (lower.includes('saldo') || lower.includes('quanto') || lower.includes('resumo')) {
                    setChatHistory(prev => [...prev, {
                        id: Date.now(),
                        role: 'bot',
                        text: `📊 Aqui está o seu resumo do mês:\n• Receitas: ${formatCurrency(totals.receitas)}\n• Despesas: ${formatCurrency(totals.despesas)}\n• Investimentos: ${formatCurrency(totals.investimentos)}\n• Saldo Total Acumulado: ${formatCurrency(totalLiquidBalance)}`
                    }]);
                } else {
                    setChatHistory(prev => [...prev, {
                        id: Date.now(),
                        role: 'bot',
                        text: `Dica financeira: Procure guardar ao menos 20% das suas receitas em investimentos de liquidez diária para reserva de emergência antes de arriscar na renda variável.`
                    }]);
                }
                setIsAiTyping(false);
            }, 500);
            return;
        }
        setIsAiTyping(false);
    };

    const handleReceiptScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsScanningReceipt(true);

        if (!geminiApiKey.trim()) {
            setTimeout(() => {
                setIsScanningReceipt(false);
                showToast("Para ler recibos por foto, adicione sua chave Gemini no Perfil!");
                setIsApiKeyModalOpen(true);
            }, 500);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];
            try {
                const prompt = `Analise este cupom/recibo fiscal. Extraia o valor total pago, o nome do estabelecimento/descrição e a categoria adequada. Retorne APENAS um JSON no formato:
{"amount": 49.90, "description": "Supermercado Extra", "category": "Alimentação"}`;

                const payload = {
                    contents: [{
                        role: "user",
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: file.type || 'image/jpeg', data: base64Image } }
                        ]
                    }],
                    generationConfig: { temperature: 0.1 }
                };

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const json = await res.json();
                const replyText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                const cleanJson = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(cleanJson);

                setFormData(prev => ({
                    ...prev,
                    type: 'saida',
                    amount: data.amount ? data.amount.toString() : prev.amount,
                    description: data.description || prev.description,
                    category: data.category || 'Alimentação'
                }));
                showToast("Recibo lido com sucesso!");
            } catch (err) {
                console.error(err);
                showToast("Não foi possível ler os dados da foto. Tente uma imagem mais clara.");
            }
            setIsScanningReceipt(false);
        };
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="font-black text-xl text-slate-800 dark:text-white">FinançasPro</p>
                <p className="text-sm text-slate-400 mt-1">Carregando painel financeiro...</p>
            </div>
        );
    }

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            {/* INDICADOR PULL-TO-REFRESH ESTILO IOS */}
            <div
                className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-200 ease-out"
                style={{
                    transform: `translateY(${pullY > 0 ? pullY - 10 : -80}px)`,
                    opacity: pullY > 10 ? 1 : 0
                }}
            >
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all">
                    {isRefreshing ? (
                        <>
                            <RefreshCw size={15} className="animate-spin text-blue-600 dark:text-blue-400" />
                            <span>Atualizando finanças...</span>
                        </>
                    ) : pullY >= 50 ? (
                        <>
                            <ArrowDown size={15} className="text-emerald-500 transition-transform duration-200 rotate-180" />
                            <span className="text-emerald-600 dark:text-emerald-400">Solte para atualizar</span>
                        </>
                    ) : (
                        <>
                            <ArrowDown size={15} className="text-blue-500 transition-transform duration-200" style={{ transform: `rotate(${Math.min(pullY * 3.6, 180)}deg)` }} />
                            <span>Puxe para atualizar</span>
                        </>
                    )}
                </div>
            </div>

            {toastMsg && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 font-bold text-sm flex items-center gap-2 border border-slate-700/50">
                    <CheckCircle2 className="text-emerald-400 dark:text-emerald-600 shrink-0" size={18} />
                    <span>{toastMsg}</span>
                </div>
            )}

            {/* LAYOUT CONTAINER PRINCIPAL */}
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col lg:flex-row transition-colors duration-300 antialiased selection:bg-blue-500 selection:text-white">

                {/* ========================================================= */}
                {/* 1. SIDEBAR LATERAL FIXA (APENAS EM DESKTOP: lg+) */}
                {/* ========================================================= */}
                <aside className="hidden lg:flex lg:w-72 xl:w-80 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex-col justify-between shrink-0 p-6 sticky top-0 h-screen z-20">
                    <div>
                        {/* Logo & Marca */}
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">FinançasPro</h1>
                                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Dashboard Executivo
                                </p>
                            </div>
                        </div>

                        {/* Botão de Lançamento Rápido em Destaque */}
                        <button
                            onClick={() => openNewForm('saida')}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-2xl transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 mb-8 active:scale-[0.98]"
                        >
                            <Plus size={20} /> Novo Lançamento
                        </button>

                        {/* Menu de Navegação */}
                        <nav className="space-y-1.5">
                            <button
                                onClick={() => setActiveTab('inicio')}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-extrabold text-sm transition-all ${activeTab === 'inicio' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                            >
                                <LayoutGrid size={20} className={activeTab === 'inicio' ? 'stroke-[2.5]' : ''} />
                                Visão Geral / Início
                            </button>

                            <button
                                onClick={() => { setActiveTab('analise'); setAnalysisView('mes'); }}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-extrabold text-sm transition-all ${activeTab === 'analise' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                            >
                                <PieChart size={20} className={activeTab === 'analise' ? 'stroke-[2.5]' : ''} />
                                Análises & Metas
                            </button>

                            <button
                                onClick={() => setActiveTab('calendario')}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-extrabold text-sm transition-all ${activeTab === 'calendario' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                            >
                                <CalendarDays size={20} className={activeTab === 'calendario' ? 'stroke-[2.5]' : ''} />
                                Agenda Financeira
                            </button>

                            <button
                                onClick={() => setActiveTab('investimentos')}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-extrabold text-sm transition-all ${activeTab === 'investimentos' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                            >
                                <TrendingUp size={20} className={activeTab === 'investimentos' ? 'stroke-[2.5]' : ''} />
                                Investimentos
                            </button>
                        </nav>

                        {/* Ferramentas e Configurações */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-1">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 mb-2">Preferências</p>

                            <button
                                onClick={() => setIsCategoryManagerOpen(true)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <Tag size={16} className="text-blue-500" /> Gerenciar Categorias
                            </button>

                            <button
                                onClick={() => setIsFamilyModalOpen(true)}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <Users size={16} className="text-emerald-500" /> Modo Família
                                </div>
                                {activeFamilyCode && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 px-2 py-0.5 rounded-full font-extrabold">{activeFamilyCode}</span>}
                            </button>

                            <button
                                onClick={() => { setApiKeyInput(geminiApiKey); setIsApiKeyModalOpen(true); }}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <Key size={16} className="text-indigo-500" /> Configurar IA Gemini
                                </div>
                                {geminiApiKey ? <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 px-2 py-0.5 rounded-full font-extrabold">Ativo</span> : null}
                            </button>

                            {isInstallable && (
                                <button
                                    onClick={handleInstallPWA}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-extrabold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition mt-2"
                                >
                                    <Download size={16} /> Instalar Aplicativo (PWA)
                                </button>
                            )}
                        </div>
                    </div>


                    {/* Rodapé da Sidebar: Dark Mode & Perfil / Supabase */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        {/* Status da Nuvem Supabase */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${supabaseUser ? 'bg-emerald-500 animate-pulse' : supabaseConfig.isConfigured ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                                    <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200">
                                        {supabaseUser ? 'Nuvem Conectada' : supabaseConfig.isConfigured ? 'Nuvem Desconectada' : 'Modo Offline'}
                                    </span>
                                </div>
                                {isCloudSyncing && <RefreshCw size={12} className="animate-spin text-blue-500" />}
                            </div>

                            {supabaseUser ? (
                                <div className="space-y-1.5 pt-1">
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{supabaseUser.email}</p>
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <button
                                            onClick={() => loadCloudData(supabaseUser)}
                                            className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 py-1.5 px-2 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 transition"
                                            title="Sincronizar dados agora"
                                        >
                                            <RefreshCw size={11} /> Sync
                                        </button>
                                        <button
                                            onClick={handleMigrateToCloud}
                                            disabled={isMigrating}
                                            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 py-1.5 px-2 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 transition"
                                            title="Subir dados locais para a nuvem"
                                        >
                                            <UploadCloud size={11} /> {isMigrating ? '...' : 'Subir'}
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-1.5 rounded-xl transition"
                                            title="Sair da conta"
                                        >
                                            <LogOut size={12} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5 pt-1">
                                    <button
                                        onClick={() => {
                                            if (!supabaseConfig.isConfigured) {
                                                setConfigUrlInput(supabaseConfig.url || '');
                                                setConfigKeyInput(supabaseConfig.key || '');
                                                setIsCloudConfigModalOpen(true);
                                            } else {
                                                setAuthMode('login');
                                                setIsAuthModalOpen(true);
                                            }
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                                    >
                                        <LogIn size={14} /> Entrar na Nuvem
                                    </button>
                                    <button
                                        onClick={() => {
                                            setConfigUrlInput(supabaseConfig.url || '');
                                            setConfigKeyInput(supabaseConfig.key || '');
                                            setIsCloudConfigModalOpen(true);
                                        }}
                                        className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1"
                                    >
                                        ⚙️ Configurar Supabase
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Modo Escuro */}

                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2">Tema {isDarkMode ? 'Escuro' : 'Claro'}</span>
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition hover:scale-105"
                                title="Alternar tema"
                            >
                                {isDarkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-indigo-500" />}
                            </button>
                        </div>


                    </div>
                </aside>

                {/* ========================================================= */}
                {/* 2. ÁREA DE CONTEÚDO PRINCIPAL (DESKTOP + MOBILE) */}
                {/* ========================================================= */}
                <main className="flex-1 min-w-0 flex flex-col pb-28 lg:pb-12">

                    {/* CABEÇALHO SUPERIOR (Responsivo) */}
                    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white pt-6 pb-20 lg:pb-8 px-4 sm:px-8 shadow-md">
                        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">

                            {/* Topo Mobile (Visível apenas em telas menores) */}
                            <div className="flex lg:hidden justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-black leading-none">FinançasPro</h1>
                                        <p className="text-[10px] text-blue-100/80">Gestão Inteligente</p>
                                    </div>
                                    {activeFamilyCode && (
                                        <span className="bg-emerald-500/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full ml-1">
                                            {activeFamilyCode}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {isInstallable && (
                                        <button
                                            onClick={handleInstallPWA}
                                            className="p-2 bg-white/20 rounded-full text-white text-xs font-bold flex items-center gap-1"
                                            title="Instalar App"
                                        >
                                            <Download size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md border border-white/30"
                                    >
                                        <User size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Saudação Desktop */}
                            <div className="hidden lg:block">
                                <h2 className="text-2xl font-black tracking-tight">
                                    {activeTab === 'inicio' && 'Painel de Controle'}
                                    {activeTab === 'analise' && 'Análises & Indicadores'}
                                    {activeTab === 'calendario' && 'Agenda Financeira'}
                                    {activeTab === 'investimentos' && 'Portfólio de Investimentos'}
                                </h2>
                                <p className="text-xs text-blue-100 font-medium mt-0.5">
                                    Controle total do seu fluxo de caixa e planejamento patrimonial.
                                </p>
                            </div>

                            {/* Controles de Mês & Ações */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {/* Seletor de Mês */}
                                <div className="flex items-center bg-white/15 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-inner">
                                    <button
                                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                        className="p-2 text-white hover:bg-white/20 rounded-xl transition"
                                        title="Mês Anterior"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="flex items-center gap-2 px-3">
                                        <CalendarIcon size={16} className="text-blue-100" />
                                        <span className="text-xs sm:text-sm font-extrabold capitalize">
                                            {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                        className="p-2 text-white hover:bg-white/20 rounded-xl transition"
                                        title="Próximo Mês"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>

                                <button
                                    onClick={exportToCSV}
                                    className="hidden sm:flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs font-extrabold border border-white/20 transition shadow-sm"
                                    title="Exportar dados do mês em CSV"
                                >
                                    <DownloadCloud size={16} /> Relatório CSV
                                </button>
                            </div>

                        </div>
                    </header>

                    {/* MENU SUSPENSO MOBILE (Profile Menu) */}
                    {showProfileMenu && (
                        <div className="lg:hidden fixed inset-0 z-50 flex items-start justify-end p-4 pt-16">
                            <div className="fixed inset-0 bg-slate-900/60" onClick={() => setShowProfileMenu(false)}></div>
                            <div className="relative bg-white dark:bg-slate-900 w-72 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-2 z-50 animate-in fade-in zoom-in-95">
                                <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-black text-slate-800 dark:text-white">Minha Conta</p>

                                    <p className="text-[10px] text-slate-400">
                                        {supabaseUser ? `Conectado: ${supabaseUser.email}` : 'Armazenamento Local'}
                                    </p>
                                </div>

                                {supabaseUser ? (
                                    <div className="space-y-1 py-1">
                                        <button
                                            onClick={() => { setShowProfileMenu(false); loadCloudData(supabaseUser); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                        >
                                            <RefreshCw size={16} /> Sincronizar Nuvem
                                        </button>
                                        <button
                                            onClick={() => { setShowProfileMenu(false); handleMigrateToCloud(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                        >
                                            <UploadCloud size={16} /> Subir Dados Locais
                                        </button>
                                        <button
                                            onClick={() => { setShowProfileMenu(false); handleSignOut(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                        >
                                            <LogOut size={16} /> Sair da Conta
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-1 py-1">
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                if (!supabaseConfig.isConfigured) {
                                                    setConfigUrlInput(supabaseConfig.url || '');
                                                    setConfigKeyInput(supabaseConfig.key || '');
                                                    setIsCloudConfigModalOpen(true);
                                                } else {
                                                    setAuthMode('login');
                                                    setIsAuthModalOpen(true);
                                                }
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                        >
                                            <LogIn size={16} /> Entrar / Criar Conta
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                setConfigUrlInput(supabaseConfig.url || '');
                                                setConfigKeyInput(supabaseConfig.key || '');
                                                setIsCloudConfigModalOpen(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <Database size={16} /> Configurar Supabase
                                        </button>
                                    </div>
                                )}

                                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                                    <button
                                        onClick={() => { setIsDarkMode(!isDarkMode); setShowProfileMenu(false); }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <span>Modo {isDarkMode ? 'Claro' : 'Escuro'}</span>
                                        {isDarkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-indigo-500" />}
                                    </button>
                                    <button
                                        onClick={() => { setShowProfileMenu(false); setIsCategoryManagerOpen(true); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <Tag size={16} className="text-blue-500" /> Categorias
                                    </button>
                                    <button
                                        onClick={() => { setShowProfileMenu(false); setIsFamilyModalOpen(true); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <Users size={16} className="text-emerald-500" /> Modo Família
                                    </button>
                                    <button
                                        onClick={() => { setShowProfileMenu(false); setApiKeyInput(geminiApiKey); setIsApiKeyModalOpen(true); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <Key size={16} className="text-indigo-500" /> Chave Gemini IA
                                    </button>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* CORPO DO DASHBOARD / TELAS */}
                    <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 -mt-12 lg:-mt-4">

                        {/* ========================================================= */}
                        {/* 4 CARDS DE KPIS EXECUTIVOS (RECEITAS, DESPESAS, INVESTIMENTOS, SALDO) */}
                        {/* ========================================================= */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            {/* Card 1: Saldo Geral */}
                            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Saldo Geral Líquido</p>
                                    <h3 className={`text-lg sm:text-xl font-black ${totalLiquidBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {formatCurrency(totalLiquidBalance)}
                                    </h3>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                                    <Wallet size={22} />
                                </div>
                            </div>

                            {/* Card 2: Receitas */}
                            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Receitas do Mês</p>
                                    <h3 className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(totals.receitas)}
                                    </h3>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                                    <ArrowUp size={22} />
                                </div>
                            </div>

                            {/* Card 3: Despesas */}
                            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Despesas do Mês</p>
                                    <h3 className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
                                        {formatCurrency(totals.despesas)}
                                    </h3>
                                </div>
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
                                    <ArrowDown size={22} />
                                </div>
                            </div>

                            {/* Card 4: Investimentos */}
                            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Aportes no Mês</p>
                                    <h3 className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(totals.investimentos)}
                                    </h3>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                                    <TrendingUp size={22} />
                                </div>
                            </div>
                        </div>

                        {/* ========================================================= */}
                        {/* ABA 1: INÍCIO / DASHBOARD MULTI-COLUNAS */}
                        {/* ========================================================= */}
                        {activeTab === 'inicio' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                                    {/* COLUNA ESQUERDA (65% width no desktop: 8 cols de 12) */}
                                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">

                                        {/* Cartões de Contas Bancárias e Cartões */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3 px-1">
                                                <h3 className="text-base font-black text-slate-800 dark:text-white">Minhas Contas & Cartões</h3>
                                                <span className="text-xs font-bold text-slate-400">{accounts.length} contas configuradas</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                                {accounts.map(acc => {
                                                    const currentBalance = accountBalances[acc.id] || 0;
                                                    const isNegativeCredit = acc.type === 'credito' && currentBalance < 0;

                                                    return (
                                                        <div
                                                            key={acc.id}
                                                            className={`rounded-3xl p-5 shadow-md bg-gradient-to-br ${acc.color} text-white relative overflow-hidden flex flex-col justify-between h-40 border border-white/10`}
                                                        >
                                                            <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none">
                                                                {acc.type === 'banco' ? <Landmark size={85} /> : acc.type === 'credito' ? <CreditCard size={85} /> : <Wallet size={85} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-white/80 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                                    {acc.type === 'banco' ? <Landmark size={13} /> : acc.type === 'credito' ? <CreditCard size={13} /> : <Wallet size={13} />}
                                                                    {acc.name}
                                                                </p>
                                                                <h2 className="text-2xl font-black tracking-tight mt-1">
                                                                    {formatCurrency(currentBalance)}
                                                                </h2>
                                                            </div>

                                                            <div className="flex items-center justify-between z-10">
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/20 text-white/90">
                                                                    {acc.type === 'credito' ? 'Fatura' : 'Saldo'}
                                                                </span>

                                                                {isNegativeCredit && (
                                                                    <button
                                                                        onClick={() => { setInvoiceAccountToPay(acc); setIsPayInvoiceModalOpen(true); }}
                                                                        className="bg-white text-slate-900 hover:bg-slate-100 text-xs font-extrabold py-1 px-3 rounded-xl transition shadow flex items-center gap-1 active:scale-95"
                                                                    >
                                                                        <CheckCircle2 size={13} className="text-rose-500" /> Pagar Fatura
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Tabela / Lista de Lançamentos Recentes */}
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800/80">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                                                <div>
                                                    <h3 className="text-base font-black text-slate-800 dark:text-white">Extrato de Movimentações</h3>
                                                    <p className="text-xs text-slate-400 font-medium">Lançamentos registrados para o mês atual</p>
                                                </div>
                                                <button
                                                    onClick={() => openNewForm('saida')}
                                                    className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 py-2 px-3 rounded-xl transition flex items-center gap-1.5"
                                                >
                                                    <Plus size={14} /> Novo Lançamento
                                                </button>
                                            </div>

                                            {/* Barra de Busca e Filtros */}
                                            <div className="space-y-3 mb-5">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                        <Search className="text-slate-400" size={16} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                                        placeholder="Filtrar por descrição ou categoria..."
                                                    />
                                                </div>

                                                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                                    <button
                                                        onClick={() => setFilterType('todos')}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'todos' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
                                                    >
                                                        Todos ({monthlyTransactions.length})
                                                    </button>
                                                    <button
                                                        onClick={() => setFilterType('entrada')}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'entrada' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
                                                    >
                                                        Receitas
                                                    </button>
                                                    <button
                                                        onClick={() => setFilterType('saida')}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'saida' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
                                                    >
                                                        Despesas
                                                    </button>
                                                    <button
                                                        onClick={() => setFilterType('investimento')}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'investimento' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
                                                    >
                                                        Investimentos
                                                    </button>
                                                    <button
                                                        onClick={() => setFilterType('pendentes')}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'pendentes' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}
                                                    >
                                                        Pendentes
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Linhas de Lançamentos */}
                                            <div className="space-y-2.5">
                                                {filteredAndSearchedTransactions.length === 0 ? (
                                                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                                                        <p className="text-sm text-slate-400 font-medium">Nenhum registro encontrado para este filtro.</p>
                                                    </div>
                                                ) : (
                                                    filteredAndSearchedTransactions.map((transaction) => {
                                                        const isIncome = transaction.type === 'entrada';
                                                        const isInvest = transaction.type === 'investimento';
                                                        const isTransfer = transaction.type === 'transferencia';

                                                        return (
                                                            <div
                                                                key={transaction.id}
                                                                className={`p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/50 ${transaction.status === 'pendente' ? 'opacity-65 border-dashed border-amber-300 dark:border-amber-700' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div
                                                                        className="p-3 rounded-2xl shrink-0"
                                                                        style={{
                                                                            backgroundColor: `${allCategoryColors[transaction.category] || '#3b82f6'}20`,
                                                                            color: allCategoryColors[transaction.category] || '#3b82f6'
                                                                        }}
                                                                    >
                                                                        {getCategoryIcon(transaction.category)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-extrabold text-slate-800 dark:text-white text-xs sm:text-sm truncate">
                                                                            {transaction.description}
                                                                        </h4>
                                                                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                                            <span className="font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700">
                                                                                {transaction.category}
                                                                            </span>
                                                                            <span>•</span>
                                                                            <span>{accounts.find(a => a.id === transaction.accountId)?.name || 'Conta'}</span>
                                                                            <span>•</span>
                                                                            <span>{new Date(transaction.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3 shrink-0">
                                                                    <div className="text-right">
                                                                        <p className={`font-black text-xs sm:text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isInvest ? 'text-indigo-600 dark:text-indigo-400' : isTransfer ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                            {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(transaction.amount)}
                                                                        </p>
                                                                        <button
                                                                            onClick={() => toggleStatus(transaction.id)}
                                                                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-0.5 inline-flex items-center gap-1 ${transaction.status === 'pago' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/50'}`}
                                                                        >
                                                                            {transaction.status === 'pago' ? 'Pago' : 'Pendente'}
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex items-center gap-1">
                                                                        {!isTransfer && (
                                                                            <button
                                                                                onClick={() => openEditForm(transaction)}
                                                                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                                                                                title="Editar"
                                                                            >
                                                                                <Edit2 size={15} />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => { setTransactionToDelete(transaction); setCancelFutureRepeats(true); }}
                                                                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                                                            title="Excluir"
                                                                        >
                                                                            <Trash2 size={15} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>

                                    </div>

                                    {/* COLUNA DIREITA (35% width no desktop: 4/5 cols de 12) */}
                                    <div className="lg:col-span-5 xl:col-span-4 space-y-6">

                                        {/* Gráfico Donut de Despesas */}
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col items-center">
                                            <div className="w-full flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-black text-slate-800 dark:text-white">Divisão de Gastos</h3>
                                                <span className="text-xs font-bold text-slate-400">{analysisData.data.length} categorias</span>
                                            </div>

                                            <div className="relative w-44 h-44 my-2">
                                                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                                                    {createPieSlices(analysisData.data)}
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Saídas</span>
                                                    <span className="text-base font-black text-slate-800 dark:text-white leading-tight">
                                                        {formatCurrency(analysisData.total)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full space-y-2 mt-4 max-h-56 overflow-y-auto pr-1">
                                                {analysisData.data.map((item) => (
                                                    <div key={item.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(item.amount)}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold ml-1.5">({item.percentage.toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Limites e Metas Rápidas */}
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800/80">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                    <Target size={16} className="text-blue-500" /> Metas de Orçamento
                                                </h3>
                                                <button
                                                    onClick={() => { setActiveTab('analise'); setAnalysisView('metas'); }}
                                                    className="text-[11px] font-extrabold text-blue-600 hover:underline"
                                                >
                                                    Ver todas
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {allCategories.saida.slice(0, 4).map(category => {
                                                    const goal = monthlyGoals[category] || 0;
                                                    const spent = analysisData.grouped[category] || 0;
                                                    const percent = goal > 0 ? Math.min((spent / goal) * 100, 100) : 0;
                                                    const progressColor = percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

                                                    return (
                                                        <div
                                                            key={category}
                                                            className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl cursor-pointer hover:border-blue-300 border border-transparent transition"
                                                            onClick={() => {
                                                                setEditingCategoryGoal(category);
                                                                setGoalAmountInput(goal ? goal.toString() : '');
                                                                setIsGoalModalOpen(true);
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-center text-xs mb-1.5">
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{category}</span>
                                                                <span className="font-black text-slate-800 dark:text-white">
                                                                    {formatCurrency(spent)} <span className="text-slate-400 font-medium">/ {goal > 0 ? formatCurrency(goal) : 'sem meta'}</span>
                                                                </span>
                                                            </div>
                                                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-700 ${progressColor}`} style={{ width: `${percent}%` }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Card Assinaturas e Fixos */}
                                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
                                            <div className="absolute right-0 top-0 opacity-10 pointer-events-none"><Repeat size={110} /></div>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Custo Automático</p>
                                                    <h3 className="text-2xl font-black mt-0.5">{formatCurrency(gastoMensalAssinaturas)} <span className="text-xs font-medium text-slate-400">/mês</span></h3>
                                                </div>
                                                <button
                                                    onClick={() => { setActiveTab('analise'); setAnalysisView('assinaturas'); }}
                                                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl font-extrabold transition"
                                                >
                                                    Detalhes
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {assinaturasAtivas.length} assinaturas e contas fixas cadastradas. Anualmente totalizam {formatCurrency(gastoAnualAssinaturas)}.
                                            </p>
                                        </div>

                                    </div>

                                </div>
                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* ABA 2: ANÁLISE / METAS / PREVISÃO */}
                        {/* ========================================================= */}
                        {activeTab === 'analise' && (
                            <div className="animate-in fade-in duration-300 space-y-6">
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                                    <button
                                        onClick={() => setAnalysisView('mes')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'mes' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <PieChart size={14} /> Resumo do Mês
                                    </button>
                                    <button
                                        onClick={() => setAnalysisView('metas')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'metas' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Target size={14} /> Metas e Limites
                                    </button>
                                    <button
                                        onClick={() => setAnalysisView('assinaturas')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'assinaturas' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Repeat size={14} /> Assinaturas & Fixos
                                    </button>
                                    <button
                                        onClick={() => setAnalysisView('previsao')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'previsao' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Sparkles size={14} /> Projeção 6 Meses
                                    </button>
                                </div>

                                {analysisView === 'mes' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">Distribuição Gráfica de Gastos</h3>
                                            <div className="relative w-56 h-56 mb-6">
                                                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                                                    {createPieSlices(analysisData.data)}
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                                                    <span className="text-xs text-slate-400 font-medium">Gasto Total</span>
                                                    <span className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                                                        {formatCurrency(analysisData.total)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-base font-black text-slate-800 dark:text-white mb-4">Detalhamento por Categoria</h3>
                                                <div className="space-y-3">
                                                    {analysisData.data.map(item => (
                                                        <div key={item.name} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(item.amount)}</span>
                                                                <span className="text-xs text-slate-400 font-bold ml-2">({item.percentage.toFixed(1)}%)</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                onClick={exportToCSV}
                                                className="mt-6 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm"
                                            >
                                                <DownloadCloud size={18} /> Baixar Relatório CSV Completo
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {analysisView === 'metas' && (
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-3xl p-5">
                                            <h3 className="font-extrabold text-blue-900 dark:text-blue-300 text-sm mb-1">Definição de Tetos Orçamentários</h3>
                                            <p className="text-xs text-blue-700 dark:text-blue-300/70">Clique nos cartões para editar ou definir novos limites para cada categoria.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {allCategories.saida.map(category => {
                                                const goal = monthlyGoals[category] || 0;
                                                const spent = analysisData.grouped[category] || 0;
                                                const percent = goal > 0 ? Math.min((spent / goal) * 100, 100) : 0;
                                                const progressColor = percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

                                                return (
                                                    <div
                                                        key={category}
                                                        className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-400 transition"
                                                        onClick={() => {
                                                            setEditingCategoryGoal(category);
                                                            setGoalAmountInput(goal ? goal.toString() : '');
                                                            setIsGoalModalOpen(true);
                                                        }}
                                                    >
                                                        <div className="flex justify-between items-end mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-slate-400">{getCategoryIcon(category)}</div>
                                                                <span className="font-extrabold text-slate-800 dark:text-white text-sm">{category}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-black text-base dark:text-white">{formatCurrency(spent)}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                                                                    {goal > 0 ? `meta: ${formatCurrency(goal)}` : 'Sem meta'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-700 ${progressColor}`} style={{ width: `${percent}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {analysisView === 'assinaturas' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-center flex flex-col justify-center">
                                            <h2 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">Custo Anual de Contas Recorrentes</h2>
                                            <h2 className="text-3xl font-black text-rose-500 mb-2">{formatCurrency(gastoAnualAssinaturas)}</h2>
                                            <p className="text-xs text-slate-400">Total de {formatCurrency(gastoMensalAssinaturas)} saindo automaticamente todo mês.</p>
                                        </div>

                                        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-base font-black text-slate-800 dark:text-white">Assinaturas Ativas</h3>
                                                <button
                                                    onClick={() => { openNewForm('saida'); setFormData(prev => ({ ...prev, isRepeating: true })); }}
                                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                                                >
                                                    <Plus size={14} /> Nova Assinatura
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {assinaturasAtivas.map(r => (
                                                    <div key={r.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-500">
                                                                {getCategoryIcon(r.category)}
                                                            </div>
                                                            <div>
                                                                <p className="font-extrabold text-slate-800 dark:text-white text-sm">{r.description}</p>
                                                                <p className="text-[11px] text-slate-400">Cobrança todo dia {r.day}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <p className="font-black text-rose-500 text-sm">-{formatCurrency(r.amount)}</p>
                                                            <button
                                                                onClick={() => { deleteRule(r.id); showToast("Assinatura removida!"); }}
                                                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {analysisView === 'previsao' && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 rounded-3xl p-6 sm:p-8 shadow-xl text-white">
                                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-200 mb-6 flex items-center gap-2">
                                                <Activity size={16} /> Projeção de Saldo Acumulado (Próximos 6 Meses)
                                            </h3>

                                            <div className="h-52 w-full flex items-end justify-between gap-3 mt-4">
                                                {futureProjectionData.map((data, idx) => {
                                                    const range = Math.max(maxFutureBalance - Math.min(minFutureBalance, 0), 10);
                                                    let heightPercent = Math.max(((data.balance - Math.min(minFutureBalance, 0)) / range) * 100, 10);

                                                    return (
                                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                                            <div className="absolute -top-10 bg-white text-slate-900 font-extrabold text-[11px] px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 shadow-xl pointer-events-none">
                                                                {formatCurrency(data.balance)}
                                                            </div>
                                                            <div className="w-full flex justify-center items-end h-full">
                                                                <div
                                                                    className={`w-3/4 rounded-t-xl transition-all duration-700 ${data.isNegative ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                                                    style={{ height: `${heightPercent}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-blue-100 capitalize">{data.month}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-2 flex items-center gap-2">
                                                <Lightbulb className="text-amber-500" size={18} /> Análise Inteligente de Cenário
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Seus hábitos atuais de ganhos e gastos projetam um saldo de <strong className={futureProjectionData[5]?.isNegative ? 'text-rose-500' : 'text-emerald-500'}>{formatCurrency(futureProjectionData[5]?.balance || 0)}</strong> no 6º mês.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* ABA 3: CALENDÁRIO / AGENDA FINANCEIRA */}
                        {/* ========================================================= */}
                        {activeTab === 'calendario' && (
                            <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <h2 className="text-center font-black text-lg text-slate-800 dark:text-white mb-6 capitalize">
                                        {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </h2>

                                    <div className="grid grid-cols-7 gap-2 mb-2">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
                                            <div key={i} className="text-center text-xs font-black text-slate-400">{d}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-2">
                                        {blanks.map(b => <div key={`b-${b}`} className="h-12"></div>)}
                                        {calendarDays.map(day => {
                                            const dayTxs = monthlyTransactions.filter(t => new Date(t.date + 'T12:00:00').getDate() === day && t.type !== 'transferencia');
                                            const hasDespesa = dayTxs.some(t => t.type === 'saida');
                                            const hasReceita = dayTxs.some(t => t.type === 'entrada');
                                            const isSelected = selectedDay === day;

                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => setSelectedDay(day)}
                                                    className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                                >
                                                    <span className="text-xs font-bold">{day}</span>
                                                    <div className="flex gap-0.5 absolute bottom-1.5">
                                                        {hasReceita && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></div>}
                                                        {hasDespesa && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`}></div>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">
                                        Lançamentos do Dia {selectedDay}
                                    </h3>
                                    <div className="space-y-3">
                                        {monthlyTransactions.filter(t => new Date(t.date + 'T12:00:00').getDate() === selectedDay).length === 0 ? (
                                            <p className="text-sm text-slate-400 py-8 text-center">Nenhum movimento registrado neste dia.</p>
                                        ) : (
                                            monthlyTransactions.filter(t => new Date(t.date + 'T12:00:00').getDate() === selectedDay).map(t => (
                                                <div key={t.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800">
                                                            {getCategoryIcon(t.category)}
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold text-slate-800 dark:text-white text-xs">{t.description}</p>
                                                            <p className="text-[10px] text-slate-400">{t.category}</p>
                                                        </div>
                                                    </div>
                                                    <p className={`font-black text-xs ${t.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {t.type === 'entrada' ? '+' : '-'}{formatCurrency(t.amount)}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* ABA 4: INVESTIMENTOS */}
                        {/* ========================================================= */}
                        {activeTab === 'investimentos' && (
                            <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                                    <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Patrimônio Investido</p>
                                    <h2 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-6">{formatCurrency(investmentData.total)}</h2>
                                    <div className="relative w-48 h-48 mb-6">
                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                            {createPieSlices(investmentData.data)}
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-indigo-600">
                                            <TrendingUp size={36} />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-base font-black text-slate-800 dark:text-white">Divisão do Portfólio</h3>
                                            <button
                                                onClick={() => openNewForm('investimento')}
                                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-2 rounded-xl"
                                            >
                                                + Novo Aporte
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {investmentData.data.map(item => (
                                                <div key={item.name} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(item.amount)}</span>
                                                        <span className="text-xs text-slate-400 font-bold ml-2">({item.percentage.toFixed(1)}%)</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                </main>

                {/* ========================================================= */}
                {/* MENU INFERIOR MOBILE (VISÍVEL APENAS EM TELAS < lg) */}
                {/* ========================================================= */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 sm:px-6 py-2 z-30 pb-safe shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
                    <div className="max-w-md mx-auto flex justify-between items-center relative">
                        <button
                            onClick={() => setActiveTab('inicio')}
                            className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === 'inicio' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                        >
                            <LayoutGrid size={22} className={activeTab === 'inicio' ? 'stroke-[2.5]' : ''} />
                            <span className="text-[10px] font-bold mt-1">Início</span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('analise'); setAnalysisView('mes'); }}
                            className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === 'analise' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                        >
                            <PieChart size={22} className={activeTab === 'analise' ? 'stroke-[2.5]' : ''} />
                            <span className="text-[10px] font-bold mt-1">Análise</span>
                        </button>

                        <div className="relative -top-6 mx-2">
                            <button
                                onClick={() => openNewForm('saida')}
                                className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white w-14 h-14 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center border-4 border-slate-50 dark:border-slate-950 active:scale-95"
                            >
                                <Plus size={28} />
                            </button>
                        </div>

                        <button
                            onClick={() => setActiveTab('calendario')}
                            className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === 'calendario' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                        >
                            <CalendarDays size={22} className={activeTab === 'calendario' ? 'stroke-[2.5]' : ''} />
                            <span className="text-[10px] font-bold mt-1">Agenda</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('investimentos')}
                            className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === 'investimentos' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
                        >
                            <TrendingUp size={22} className={activeTab === 'investimentos' ? 'stroke-[2.5]' : ''} />
                            <span className="text-[10px] font-bold mt-1">Investir</span>
                        </button>
                    </div>
                </div>

                {/* BOTÃO FLUTUANTE FINBOT */}
                {!isFormOpen && !isPayInvoiceModalOpen && !isGoalModalOpen && !isCategoryManagerOpen && !isFamilyModalOpen && (
                    <button
                        onClick={() => setIsAssistantOpen(true)}
                        className="fixed bottom-24 lg:bottom-8 right-5 lg:right-8 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-30 active:scale-95"
                        title="Assistente FinBot Copiloto"
                    >
                        <MessageSquare size={24} />
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white dark:border-slate-900"></span>
                        </span>
                    </button>
                )}

                {/* ==================================================== */}
                {/* MODAIS (CHATBOT, FORMULÁRIOS, FATURA, METAS, ETC.) */}
                {/* ==================================================== */}
                {/* Modal FinBot */}
                {isAssistantOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAssistantOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md h-[82vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300 overflow-hidden">
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                                            FinBot Copiloto
                                            <span className="bg-emerald-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">IA</span>
                                        </h3>
                                        <p className="text-[10px] text-blue-100">
                                            {geminiApiKey ? 'Conectado com Gemini Pro' : 'Modo Inteligente Offline'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAssistantOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
                                {chatHistory.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[82%] p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm shadow-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isAiTyping && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[80%] p-3 rounded-2xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-bl-sm shadow-sm flex items-center gap-2 font-bold">
                                            <Loader2 className="animate-spin text-blue-600" size={14} /> FinBot está pensando...
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef}></div>
                            </div>

                            <form onSubmit={handleBotChat} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0 pb-safe">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    disabled={isAiTyping}
                                    placeholder="Ex: 'Gastei 50 no mercado hoje'..."
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-transparent rounded-2xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={isAiTyping}
                                    className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shrink-0 transition active:scale-95 disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Formulário Lançamento */}
                {isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">
                                    {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                                </h2>
                                <div className="flex items-center gap-2">
                                    {!editingId && (
                                        <label
                                            className="p-2 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-600 dark:text-purple-400 rounded-2xl cursor-pointer transition flex items-center justify-center border border-purple-200 dark:border-purple-800"
                                            title="Escanear Recibo com Foto"
                                        >
                                            {isScanningReceipt ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleReceiptScan} disabled={isScanningReceipt} />
                                        </label>
                                    )}
                                    <button onClick={() => setIsFormOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-300 rounded-2xl transition">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto scrollbar-hide">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'saida', category: allCategories.saida[0] })}
                                        className={`flex-1 min-w-[85px] py-2.5 text-xs font-bold rounded-xl transition-all ${formData.type === 'saida' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Despesa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'entrada', category: allCategories.entrada[0] })}
                                        className={`flex-1 min-w-[85px] py-2.5 text-xs font-bold rounded-xl transition-all ${formData.type === 'entrada' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Receita
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'investimento', category: allCategories.investimento[0] })}
                                        className={`flex-1 min-w-[85px] py-2.5 text-xs font-bold rounded-xl transition-all ${formData.type === 'investimento' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Aporte
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full text-3xl font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0,00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Conta ou Cartão</label>
                                    <select
                                        value={formData.accountId}
                                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                        className="w-full text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none font-bold text-sm"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none text-sm font-medium"
                                        placeholder="Ex: Mercado, Salário, Internet..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoria</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none text-sm font-medium"
                                        >
                                            {allCategories[formData.type].map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {formData.type !== 'investimento' && !editingId && (
                                    <div className="pt-1">
                                        <label className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isRepeating}
                                                onChange={(e) => setFormData({ ...formData, isRepeating: e.target.checked })}
                                                className="w-5 h-5 rounded-lg border-blue-300 text-blue-600"
                                            />
                                            <div>
                                                <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300 block">Conta Fixa Recorrente</span>
                                                <span className="text-[11px] text-blue-600 dark:text-blue-400">Lançar automaticamente todo mês</span>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className={`w-full ${formData.type === 'investimento' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-black rounded-2xl p-4 transition-all active:scale-[0.98] text-base shadow-lg`}
                                >
                                    {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Pagar Fatura */}
                {isPayInvoiceModalOpen && invoiceAccountToPay && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPayInvoiceModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <CreditCard className="text-rose-500" size={24} /> Pagar Fatura
                                </h2>
                                <button onClick={() => setIsPayInvoiceModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 rounded-3xl p-5 mb-6 text-center">
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Valor da Fatura ({invoiceAccountToPay.name})</p>
                                <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400">
                                    {formatCurrency(Math.abs(accountBalances[invoiceAccountToPay.id] || 0))}
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-2">Ao quitar, o saldo devedor deste cartão será zerado.</p>
                            </div>

                            <form onSubmit={handlePayInvoice}>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Debitador (De qual conta sairá o valor?)</label>
                                <select
                                    value={invoiceSourceAccount}
                                    onChange={(e) => setInvoiceSourceAccount(e.target.value)}
                                    className="w-full text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none mb-6 font-bold text-sm"
                                >
                                    {accounts.filter(a => a.id !== invoiceAccountToPay.id && a.type !== 'credito').map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} (Disponível: {formatCurrency(accountBalances[acc.id] || 0)})
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="submit"
                                    className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-black rounded-2xl p-4 transition-all active:scale-[0.98] text-base flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <CheckCircle2 size={20} /> Concluir Pagamento da Fatura
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Definir Meta */}
                {isGoalModalOpen && editingCategoryGoal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsGoalModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Target className="text-blue-500" size={24} /> Meta para {editingCategoryGoal}
                                </h2>
                                <button onClick={() => setIsGoalModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const val = parseFloat(goalAmountInput) || 0;
                                setMonthlyGoals(prev => ({ ...prev, [editingCategoryGoal]: val }));

                                if (supabaseUser) {
                                    syncUpsertGoal(editingCategoryGoal, val, supabaseUser.id);
                                }

                                setIsGoalModalOpen(false);
                                showToast(`Meta de ${editingCategoryGoal} atualizada!`);
                            }}>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Teto Mensal de Gastos (R$)</label>
                                <input
                                    type="number"
                                    step="10"
                                    value={goalAmountInput}
                                    onChange={(e) => setGoalAmountInput(e.target.value)}
                                    placeholder="Ex: 1500"
                                    className="w-full text-3xl font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                                />

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMonthlyGoals(prev => {
                                                const updated = { ...prev };
                                                delete updated[editingCategoryGoal];
                                                return updated;
                                            });

                                            if (supabaseUser) {
                                                syncUpsertGoal(editingCategoryGoal, 0, supabaseUser.id);
                                            }

                                            setIsGoalModalOpen(false);
                                            showToast("Meta removida!");
                                        }}
                                        className="w-1/3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-2xl p-4 text-xs"
                                    >
                                        Remover
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl p-4 text-base shadow-lg"
                                    >
                                        Salvar Meta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Gerenciador de Categorias */}
                {isCategoryManagerOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCategoryManagerOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Tag className="text-blue-500" size={24} /> Gerenciar Categorias
                                </h2>
                                <button onClick={() => setIsCategoryManagerOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!newCatData.name.trim()) return;
                                const trimmed = newCatData.name.trim();
                                if (customCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
                                    showToast("Categoria já existe.");
                                    return;
                                }

                                const newCat = { id: 'cat_' + Date.now(), name: trimmed, type: newCatData.type, color: newCatData.color };
                                setCustomCategories(prev => [...prev, newCat]);
                                if (supabaseUser) {
                                    syncUpsertCategory(newCat, supabaseUser.id);
                                }

                                setNewCatData({ name: '', type: 'saida', color: '#3b82f6' });
                                showToast("Categoria adicionada!");
                            }} className="space-y-3 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-black uppercase text-slate-400">Criar Nova Categoria</p>
                                <input
                                    type="text"
                                    value={newCatData.name}
                                    onChange={(e) => setNewCatData({ ...newCatData, name: e.target.value })}
                                    placeholder="Nome da categoria (ex: Pet, Viagens...)"
                                    className="w-full text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={newCatData.type}
                                        onChange={(e) => setNewCatData({ ...newCatData, type: e.target.value })}
                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                                    >
                                        <option value="saida">Despesa</option>
                                        <option value="entrada">Receita</option>
                                        <option value="investimento">Investimento</option>
                                    </select>
                                    <input
                                        type="color"
                                        value={newCatData.color}
                                        onChange={(e) => setNewCatData({ ...newCatData, color: e.target.value })}
                                        className="h-10 w-full rounded-xl cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
                                    Adicionar Categoria
                                </button>
                            </form>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Suas Categorias Personalizadas</p>
                                {customCategories.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-2">Nenhuma categoria personalizada criada ainda.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {customCategories.map(cat => (
                                            <div key={cat.name} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cat.name}</span>
                                                    <span className="text-[10px] text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded capitalize">{cat.type}</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setCustomCategories(prev => prev.filter(c => c.name !== cat.name));

                                                        if (supabaseUser) {
                                                            syncDeleteCategory(cat.id || cat.name, supabaseUser.id);
                                                        }

                                                        showToast("Categoria removida.");
                                                    }}
                                                    className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Modo Família */}
                {isFamilyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFamilyModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Users className="text-emerald-500" size={24} /> Modo Família & Casal
                                </h2>
                                <button onClick={() => setIsFamilyModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                Conecte-se com seu cônjuge ou grupo familiar inserindo o mesmo código de sincronização.
                            </p>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!familyCodeInput.trim()) return;
                                const code = familyCodeInput.trim().toUpperCase();
                                setActiveFamilyCode(code);
                                localStorage.setItem('fp_family_code', code);
                                setIsFamilyModalOpen(false);
                                showToast(`Conectado ao grupo familiar: ${code}!`);
                            }}>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Código da Família</label>
                                <input
                                    type="text"
                                    value={familyCodeInput}
                                    onChange={(e) => setFamilyCodeInput(e.target.value.toUpperCase())}
                                    placeholder="Ex: FAMILIA-SILVA"
                                    className="w-full text-xl font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 tracking-widest uppercase outline-none mb-6"
                                />

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl p-4 text-sm shadow-md"
                                    >
                                        Conectar / Salvar Grupo
                                    </button>

                                    {activeFamilyCode && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveFamilyCode(null);
                                                localStorage.removeItem('fp_family_code');
                                                setIsFamilyModalOpen(false);
                                                showToast("Você saiu do grupo familiar.");
                                            }}
                                            className="w-full bg-slate-100 dark:bg-slate-800 text-rose-500 font-bold rounded-2xl p-3 text-xs"
                                        >
                                            Desconectar do Modo Família
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Chave Gemini */}
                {isApiKeyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsApiKeyModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Key className="text-indigo-500" size={24} /> Configurar Gemini API
                                </h2>
                                <button onClick={() => setIsApiKeyModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                Adicione sua chave gratuita do Google AI Studio para ativar o FinBot com IA de ponta e escaneamento visual de notas e recibos fiscais.
                            </p>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const key = apiKeyInput.trim();
                                setGeminiApiKey(key);
                                localStorage.setItem('fp_gemini_key', key);
                                setIsApiKeyModalOpen(false);
                                showToast(key ? "Chave Gemini configurada com sucesso!" : "Chave removida. Usando modo offline.");
                            }}>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full text-sm font-mono text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none mb-6"
                                />

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl p-4 text-sm shadow-md"
                                    >
                                        Salvar Chave
                                    </button>

                                    {geminiApiKey && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setGeminiApiKey('');
                                                setApiKeyInput('');
                                                localStorage.removeItem('fp_gemini_key');
                                                setIsApiKeyModalOpen(false);
                                                showToast("Chave removida.");
                                            }}
                                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl p-3 text-xs"
                                        >
                                            Limpar Chave
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}


                {/* Modal de Autenticação Supabase (Login / Cadastro / Esqueci a Senha) */}
                {isAuthModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                        <Database size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">
                                            {authMode === 'login' && 'Entrar na Nuvem'}
                                            {authMode === 'signup' && 'Criar Conta Nuvem'}
                                            {authMode === 'forgot' && 'Recuperar Senha'}
                                        </h2>
                                        <p className="text-xs text-slate-400">Acesse suas finanças de qualquer lugar</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAuthModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tabs de Seleção de Modo */}
                            {authMode !== 'forgot' && (
                                <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6">
                                    <button
                                        type="button"
                                        onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccessMsg(''); }}
                                        className={`py-2.5 text-xs font-black rounded-xl transition ${authMode === 'login' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Já tenho conta
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccessMsg(''); }}
                                        className={`py-2.5 text-xs font-black rounded-xl transition ${authMode === 'signup' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Criar nova conta
                                    </button>
                                </div>
                            )}

                            {authError && (
                                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold mb-4 flex items-center gap-2">
                                    <AlertTriangle size={16} className="shrink-0" />
                                    <span>{authError}</span>
                                </div>
                            )}

                            {authSuccessMsg && (
                                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="shrink-0" />
                                    <span>{authSuccessMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Seu E-mail</label>
                                    <input
                                        type="email"
                                        required
                                        value={authEmail}
                                        onChange={(e) => setAuthEmail(e.target.value)}
                                        placeholder="exemplo@email.com"
                                        className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {authMode !== 'forgot' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-xs font-bold text-slate-400 uppercase">Sua Senha</label>
                                            {authMode === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthSuccessMsg(''); }}
                                                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Esqueceu?
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={authPassword}
                                            onChange={(e) => setAuthPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
                                >
                                    {authLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                                    {authMode === 'login' && 'Entrar e Sincronizar'}
                                    {authMode === 'signup' && 'Cadastrar Gratuitamente'}
                                    {authMode === 'forgot' && 'Enviar E-mail de Recuperação'}
                                </button>

                                {authMode === 'forgot' && (
                                    <button
                                        type="button"
                                        onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccessMsg(''); }}
                                        className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white py-2"
                                    >
                                        ← Voltar para o Login
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Configuração do Supabase (Credenciais) */}
                {isCloudConfigModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCloudConfigModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                        <Database size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Conectar Supabase</h2>
                                        <p className="text-xs text-slate-400">Banco de Dados PostgreSQL na Nuvem</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCloudConfigModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 mb-6 text-xs space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                                <p className="font-bold text-blue-700 dark:text-blue-300">Como conectar seu projeto:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Crie um projeto gratuito em <strong>supabase.com</strong>.</li>
                                    <li>No painel do Supabase, vá em <strong>SQL Editor</strong> e execute o script <code>supabase/schema.sql</code>.</li>
                                    <li>Vá em <strong>Project Settings → API</strong> e copie a <strong>URL</strong> e a <strong>Anon Key</strong>.</li>
                                </ol>
                            </div>

                            <form onSubmit={handleSaveCloudConfig} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Project URL</label>
                                    <input
                                        type="url"
                                        required
                                        value={configUrlInput}
                                        onChange={(e) => setConfigUrlInput(e.target.value)}
                                        placeholder="https://xyzcompany.supabase.co"
                                        className="w-full text-xs font-mono text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Anon Public Key</label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={configKeyInput}
                                        onChange={(e) => setConfigKeyInput(e.target.value)}
                                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                        className="w-full text-xs font-mono text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="pt-2 space-y-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-sm shadow-md transition"
                                    >
                                        Salvar e Conectar
                                    </button>

                                    {supabaseConfig.isConfigured && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                clearSupabaseConfig();
                                                setSupabaseConfigState(getSupabaseConfig());
                                                setConfigUrlInput('');
                                                setConfigKeyInput('');
                                                setIsCloudConfigModalOpen(false);
                                                showToast("Configuração do Supabase removida.");
                                            }}
                                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-500 font-bold py-2.5 rounded-2xl text-xs transition"
                                        >
                                            Desconectar Supabase
                                        </button>
                                    )}
                                </div>
                            </form>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
