import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus, ArrowUp, ArrowDown, Wallet, Clock, TrendingUp, Home, Coffee,
    Car, Briefcase, Smartphone, CheckCircle2, Circle, Trash2,
    X, ChevronLeft, ChevronRight, Repeat, Edit2, Calendar as CalendarIcon,
    PieChart, LayoutGrid, Target, AlertTriangle, Cloud, CloudOff, Loader2,
    LineChart, Landmark, User, Search, DownloadCloud, Settings, Tag,
    CreditCard, BarChart3, Lightbulb, UploadCloud, FileText,
    CalendarDays, MessageSquare, Send, Users, Camera, Moon, Sun,
    Wifi, History, Sparkles, Activity, ArrowRightLeft, Key, Check, Info
} from 'lucide-react';

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
    { id: 'acc_main', name: 'Conta Principal (Nubank/Inter)', type: 'banco', color: 'from-blue-600 to-indigo-800' },
    { id: 'acc_wallet', name: 'Carteira Física (Dinheiro)', type: 'dinheiro', color: 'from-emerald-500 to-teal-700' },
    { id: 'acc_credit', name: 'Cartão de Crédito Black', type: 'credito', color: 'from-rose-500 to-pink-700' }
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

    // SISTEMA DE NOTIFICAÇÕES (Toasts)
    const [toastMsg, setToastMsg] = useState('');
    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3500);
    };

    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('inicio');
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

    // Salvar no LocalStorage automaticamente
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
        const timer = setTimeout(() => setIsInitializing(false), 400);
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

    // Variáveis e Lógica do Calendário (Completas)
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: totalDays }, (_, i) => i + 1);
    }, [currentDate]);

    const blanks = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
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
    };

    const deleteTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
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
    };

    const deleteRule = (ruleId) => {
        setRepeatingRules(prev => prev.filter(r => r.id !== ruleId));
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

    // Chatbot IA (com suporte a API Gemini e modo Inteligente Local)
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

        // Se o usuário configurou chave Gemini API
        if (geminiApiKey.trim()) {
            try {
                const systemPrompt = `Você é o FinBot, assistente do FinançasPro. Responda em Português do Brasil de forma amigável e concisa.
Resumo atual deste mês: Ganhos: R$ ${totals.receitas.toFixed(2)}, Gastos: R$ ${totals.despesas.toFixed(2)}, Saldo da Conta Principal: R$ ${(accountBalances['acc_main'] || 0).toFixed(2)}.
Se o usuário pedir para registrar um gasto, ganho ou aporte, retorne APENAS UM JSON no formato exato:
{"action": "add", "type": "saida" | "entrada" | "investimento", "amount": numero_sem_cifrao, "description": "nome curto", "category": "escolha_uma"}
Categorias de saída: Casa, Alimentação, Transporte, Lazer, Saúde, Educação, Assinaturas, Outros.
Entradas: Salário, Freelance, Rendimentos, Vendas.
Investimentos: Renda Fixa, Ações, Cripto, Reserva de Emergência, Fundos Imobiliários.
Caso não seja para registrar algo, apenas responda amigavelmente com conselhos e insights práticos de finanças.`;

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
                    text: "Tive um problema ao conectar com a API do Gemini. Verifique sua chave nas configurações ou continue usando normalmente."
                }]);
            }
        } else {
            // Analisador Local Inteligente (NLP Básico offline)
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
                    const totalBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0);
                    setChatHistory(prev => [...prev, {
                        id: Date.now(),
                        role: 'bot',
                        text: `📊 Aqui está o seu resumo do mês:\n• Receitas: ${formatCurrency(totals.receitas)}\n• Despesas: ${formatCurrency(totals.despesas)}\n• Investimentos: ${formatCurrency(totals.investimentos)}\n• Saldo Total Acumulado: ${formatCurrency(totalBalance)}`
                    }]);
                } else {
                    setChatHistory(prev => [...prev, {
                        id: Date.now(),
                        role: 'bot',
                        text: `Dica financeira: Para manter uma boa saúde financeira, procure seguir a regra 50-30-20 (50% para necessidades básicas, 30% para estilo de vida e 20% para reserva e investimentos).\n\n💡 Dica: Você pode cadastrar sua chave da Gemini API no menu superior para respostas ainda mais avançadas com IA!`
                    }]);
                }
                setIsAiTyping(false);
            }, 600);
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
                showToast("Para usar a leitura com IA de fotos de recibo, adicione sua chave Gemini no Perfil!");
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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                <Loader2 className="animate-spin mb-4" size={44} />
                <p className="font-extrabold text-lg text-slate-800 dark:text-white">FinançasPro</p>
                <p className="text-sm text-slate-400 mt-1">Carregando seus dados financeiros...</p>
            </div>
        );
    }

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            {toastMsg && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 font-bold text-sm flex items-center gap-2 border border-slate-700/50">
                    <CheckCircle2 className="text-emerald-400 dark:text-emerald-600 shrink-0" size={18} />
                    <span>{toastMsg}</span>
                </div>
            )}

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-28 relative overflow-x-hidden transition-colors duration-300">

                {/* --- CABEÇALHO --- */}
                <div className={`${activeTab === 'investimentos' ? 'bg-gradient-to-r from-indigo-700 to-purple-800' : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700'} pt-8 pb-32 px-5 rounded-b-[2.5rem] shadow-lg relative transition-all duration-500`}>
                    <div className="max-w-xl mx-auto">
                        <header className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                                    <Wallet className="text-white" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-white tracking-tight leading-none">FinançasPro</h1>
                                    <p className="text-[11px] text-blue-100/80 font-medium mt-0.5">Gestão Inteligente</p>
                                </div>
                                {activeFamilyCode && (
                                    <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm ml-2">
                                        <Users size={11} /> {activeFamilyCode}
                                    </span>
                                )}
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold backdrop-blur-md border border-white/30 hover:bg-white/30 transition shadow-sm"
                                    title="Menu e Configurações"
                                >
                                    <User size={20} />
                                </button>

                                {showProfileMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                                        <div className="absolute right-0 top-12 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Perfil Local</p>
                                                    <p className="text-sm font-extrabold text-slate-800 dark:text-white">Meu Controle</p>
                                                </div>
                                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                                    <Cloud size={18} />
                                                </div>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                <button
                                                    onClick={() => { setIsDarkMode(!isDarkMode); setShowProfileMenu(false); }}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isDarkMode ? <Sun className="text-amber-500" size={18} /> : <Moon className="text-indigo-500" size={18} />}
                                                        Modo {isDarkMode ? 'Claro' : 'Escuro'}
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => { setShowProfileMenu(false); setIsCategoryManagerOpen(true); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition"
                                                >
                                                    <Tag className="text-blue-500" size={18} />
                                                    Gerenciar Categorias
                                                </button>

                                                <button
                                                    onClick={() => { setShowProfileMenu(false); setIsFamilyModalOpen(true); }}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-2xl transition"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Users size={18} /> Modo Família
                                                    </div>
                                                    {activeFamilyCode && <CheckCircle2 size={16} />}
                                                </button>

                                                <button
                                                    onClick={() => { setShowProfileMenu(false); setApiKeyInput(geminiApiKey); setIsApiKeyModalOpen(true); }}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-2xl transition"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Key size={18} /> Chave Gemini IA
                                                    </div>
                                                    {geminiApiKey ? <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">Ativo</span> : null}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </header>

                        {/* Seletor de Mês */}
                        <div className="flex justify-between items-center bg-white/15 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                className="p-2 text-white hover:bg-white/20 rounded-xl transition active:scale-95"
                                title="Mês Anterior"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="text-white/80" size={18} />
                                <span className="text-sm font-bold text-white capitalize tracking-wide">
                                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                className="p-2 text-white hover:bg-white/20 rounded-xl transition active:scale-95"
                                title="Próximo Mês"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* CONTEÚDO PRINCIPAL */}
                <div className="max-w-xl mx-auto px-4 -mt-20 relative z-10">

                    {/* ========================================== */}
                    {/* ABA 1: INÍCIO */}
                    {/* ========================================== */}
                    {activeTab === 'inicio' && (
                        <div className="animate-in fade-in duration-300">
                            {/* Carrossel de Cartões de Contas */}
                            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                                {accounts.map(acc => {
                                    const currentBalance = accountBalances[acc.id] || 0;
                                    const isNegativeCredit = acc.type === 'credito' && currentBalance < 0;

                                    return (
                                        <div
                                            key={acc.id}
                                            className={`snap-center shrink-0 w-64 rounded-3xl p-5 shadow-xl bg-gradient-to-br ${acc.color} text-white relative overflow-hidden flex flex-col justify-between h-44 border border-white/10`}
                                        >
                                            <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none">
                                                {acc.type === 'banco' ? <Landmark size={90} /> : acc.type === 'credito' ? <CreditCard size={90} /> : <Wallet size={90} />}
                                            </div>
                                            <div>
                                                <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                    {acc.type === 'banco' ? <Landmark size={14} /> : acc.type === 'credito' ? <CreditCard size={14} /> : <Wallet size={14} />}
                                                    {acc.name}
                                                </p>
                                                <h2 className="text-2xl font-black tracking-tight mt-1">
                                                    {formatCurrency(currentBalance)}
                                                </h2>
                                            </div>

                                            <div className="flex items-center justify-between z-10 mt-2">
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-black/20 text-white/90">
                                                    {acc.type === 'credito' ? 'Fatura Aberta' : 'Saldo Atual'}
                                                </span>

                                                {isNegativeCredit && (
                                                    <button
                                                        onClick={() => { setInvoiceAccountToPay(acc); setIsPayInvoiceModalOpen(true); }}
                                                        className="bg-white text-slate-900 hover:bg-slate-100 text-xs font-extrabold py-1.5 px-3 rounded-xl transition shadow-md flex items-center gap-1.5 active:scale-95"
                                                    >
                                                        <CheckCircle2 size={14} className="text-rose-500" /> Pagar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Resumo Rápido do Mês */}
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                                        <ArrowUp size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entradas</p>
                                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.receitas)}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl">
                                        <ArrowDown size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saídas</p>
                                        <p className="text-base font-black text-rose-600 dark:text-rose-400">{formatCurrency(totals.despesas)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Lançamentos Recentes */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">Lançamentos do Mês</h3>
                                    <span className="text-xs font-bold text-slate-400">{filteredAndSearchedTransactions.length} registros</span>
                                </div>

                                <div className="mb-4 space-y-3">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Search className="text-slate-400" size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white"
                                            placeholder="Buscar por descrição ou categoria..."
                                        />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                        <button
                                            onClick={() => setFilterType('todos')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'todos' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            onClick={() => setFilterType('entrada')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'entrada' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                        >
                                            Receitas
                                        </button>
                                        <button
                                            onClick={() => setFilterType('saida')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'saida' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                        >
                                            Despesas
                                        </button>
                                        <button
                                            onClick={() => setFilterType('investimento')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'investimento' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                        >
                                            Investimentos
                                        </button>
                                        <button
                                            onClick={() => setFilterType('pendentes')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterType === 'pendentes' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                        >
                                            Pendentes
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {filteredAndSearchedTransactions.length === 0 ? (
                                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Nenhum registro encontrado para este filtro.</p>
                                            <button
                                                onClick={() => openNewForm('saida')}
                                                className="mt-3 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                            >
                                                <Plus size={14} /> Adicionar lançamento
                                            </button>
                                        </div>
                                    ) : (
                                        filteredAndSearchedTransactions.map((transaction) => {
                                            const isIncome = transaction.type === 'entrada';
                                            const isInvest = transaction.type === 'investimento';
                                            const isTransfer = transaction.type === 'transferencia';

                                            return (
                                                <div
                                                    key={transaction.id}
                                                    className={`bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col gap-3 transition-all hover:shadow-md ${transaction.status === 'pendente' ? 'opacity-65 border-dashed border-amber-300 dark:border-amber-700' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3 flex-1 pr-2">
                                                            <div
                                                                className="p-3 rounded-2xl shrink-0"
                                                                style={{
                                                                    backgroundColor: `${allCategoryColors[transaction.category] || '#3b82f6'}20`,
                                                                    color: allCategoryColors[transaction.category] || '#3b82f6'
                                                                }}
                                                            >
                                                                {getCategoryIcon(transaction.category)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm leading-tight">
                                                                    {transaction.description}
                                                                </h4>
                                                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                                                    <span className="font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                                                                        {transaction.category}
                                                                    </span>
                                                                    {isTransfer ? (
                                                                        <span className="font-medium flex items-center gap-0.5 text-blue-500">
                                                                            <ArrowRightLeft size={10} /> Transferência
                                                                        </span>
                                                                    ) : (
                                                                        <span className="font-medium flex items-center gap-0.5">
                                                                            <CreditCard size={10} /> {accounts.find(a => a.id === transaction.accountId)?.name || 'Conta'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className={`font-black text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isInvest ? 'text-indigo-600 dark:text-indigo-400' : isTransfer ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(transaction.amount)}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                                                                {new Date(transaction.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                                                        <button
                                                            onClick={() => toggleStatus(transaction.id)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${transaction.status === 'pago' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100'}`}
                                                        >
                                                            {transaction.status === 'pago' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                                            {transaction.status === 'pago' ? 'Concluído' : 'Efetivar'}
                                                        </button>

                                                        <div className="flex items-center gap-1">
                                                            {!isTransfer && (
                                                                <button
                                                                    onClick={() => openEditForm(transaction)}
                                                                    className="p-2 text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition"
                                                                    title="Editar"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => { setTransactionToDelete(transaction); setCancelFutureRepeats(true); }}
                                                                className="p-2 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={16} />
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
                    )}

                    {/* ========================================== */}
                    {/* ABA 2: ANÁLISE */}
                    {/* ========================================== */}
                    {activeTab === 'analise' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
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
                                    <Repeat size={14} /> Assinaturas
                                </button>
                                <button
                                    onClick={() => setAnalysisView('previsao')}
                                    className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'previsao' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                >
                                    <Sparkles size={14} /> Projeção Futura
                                </button>
                            </div>

                            {/* Visão 1: Resumo em Gráfico Donut */}
                            {analysisView === 'mes' && (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center animate-in fade-in">
                                    <h2 className="text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider text-xs mb-6">
                                        Divisão de Gastos por Categoria
                                    </h2>
                                    <div className="relative w-52 h-52 mb-6">
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

                                    <div className="w-full space-y-3">
                                        {analysisData.data.length === 0 ? (
                                            <p className="text-center text-sm text-slate-400 py-4">Nenhuma despesa paga neste mês.</p>
                                        ) : (
                                            analysisData.data.map((item) => (
                                                <div key={item.name} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }}></div>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-black text-slate-800 dark:text-white block">{formatCurrency(item.amount)}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">{item.percentage.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <button
                                        onClick={exportToCSV}
                                        className="mt-8 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
                                    >
                                        <DownloadCloud size={18} /> Baixar Relatório CSV
                                    </button>
                                </div>
                            )}

                            {/* Visão 2: Metas de Gastos */}
                            {analysisView === 'metas' && (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-3xl p-5">
                                        <div className="flex items-start gap-3">
                                            <Target className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                                            <div>
                                                <h3 className="font-extrabold text-blue-900 dark:text-blue-300 text-sm mb-1">Limites Orçamentários</h3>
                                                <p className="text-xs text-blue-700 dark:text-blue-300/70 leading-relaxed">
                                                    Clique em qualquer categoria para definir ou ajustar o teto máximo de gastos.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {allCategories.saida.map(category => {
                                            const goal = monthlyGoals[category] || 0;
                                            const spent = analysisData.grouped[category] || 0;
                                            const percent = goal > 0 ? Math.min((spent / goal) * 100, 100) : 0;
                                            const progressColor = percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

                                            return (
                                                <div
                                                    key={category}
                                                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition"
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
                                                                {goal > 0 ? `meta: ${formatCurrency(goal)}` : 'Sem meta definida'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
                                                            style={{ width: `${goal > 0 ? percent : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Visão 3: Assinaturas e Contas Fixas */}
                            {analysisView === 'assinaturas' && (
                                <div className="animate-in fade-in space-y-6">
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none"><Repeat size={100} /></div>
                                        <h2 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">Custo Anual Recorrente</h2>
                                        <h2 className="text-3xl font-black tracking-tight text-rose-500 mb-2">
                                            {formatCurrency(gastoAnualAssinaturas)}
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            Representa {formatCurrency(gastoMensalAssinaturas)} saindo da sua conta todos os meses no automático.
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-4 px-1">
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white">Assinaturas e Gastos Fixos</h3>
                                            <button
                                                onClick={() => {
                                                    openNewForm('saida');
                                                    setFormData(prev => ({ ...prev, isRepeating: true }));
                                                }}
                                                className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                                            >
                                                <Plus size={14} /> Nova Assinatura
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {assinaturasAtivas.length === 0 ? (
                                                <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                                                    <p className="text-sm text-slate-400">Você ainda não tem assinaturas configuradas.</p>
                                                </div>
                                            ) : (
                                                assinaturasAtivas.map(r => (
                                                    <div key={r.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-300">
                                                                {getCategoryIcon(r.category)}
                                                            </div>
                                                            <div>
                                                                <p className="font-extrabold text-slate-800 dark:text-white text-sm">{r.description}</p>
                                                                <p className="text-[11px] text-slate-400">Todo dia {r.day}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <p className="font-black text-rose-500 text-sm">-{formatCurrency(r.amount)}</p>
                                                            <button
                                                                onClick={() => { deleteRule(r.id); showToast("Assinatura removida!"); }}
                                                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                                                title="Excluir regra"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Visão 4: Máquina do Tempo / Previsão */}
                            {analysisView === 'previsao' && (
                                <div className="animate-in fade-in space-y-6">
                                    <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                                        <div className="absolute right-0 top-0 opacity-10 pointer-events-none"><Sparkles size={120} /></div>
                                        <h2 className="text-blue-200 font-bold uppercase tracking-wider text-xs mb-6 flex items-center gap-2">
                                            <Activity size={16} /> Projeção para os Próximos 6 Meses
                                        </h2>

                                        <div className="h-44 w-full flex items-end justify-between gap-2 mt-4 relative z-10">
                                            {futureProjectionData.map((data, idx) => {
                                                const range = Math.max(maxFutureBalance - Math.min(minFutureBalance, 0), 10);
                                                let heightPercent = 10;
                                                if (range > 0) {
                                                    heightPercent = Math.max(((data.balance - Math.min(minFutureBalance, 0)) / range) * 100, 10);
                                                }
                                                return (
                                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                                        <div className="absolute -top-10 bg-white text-slate-900 font-extrabold text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 shadow-xl pointer-events-none">
                                                            {formatCurrency(data.balance)}
                                                        </div>
                                                        <div className="w-full flex justify-center items-end h-full">
                                                            <div
                                                                className={`w-4/5 rounded-t-lg transition-all duration-700 shadow-sm ${data.isNegative ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                                                style={{ height: `${heightPercent}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-blue-100 capitalize">{data.month}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                        <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-2 flex items-center gap-2">
                                            <Lightbulb className="text-amber-500 shrink-0" size={18} /> Análise Preditiva
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Mantendo o ritmo médio atual de despesas e receitas, sua estimativa de patrimônio daqui a 6 meses é de <strong className={futureProjectionData[5]?.isNegative ? 'text-rose-500 font-black' : 'text-emerald-500 font-black'}>{formatCurrency(futureProjectionData[5]?.balance || 0)}</strong>.
                                            {futureProjectionData[5]?.isNegative ? " ⚠️ Atenção aos gastos fixos para evitar o saldo negativo." : " 🚀 Parabéns pelo controle! Continue investindo a sobra mensal."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================== */}
                    {/* ABA 3: CALENDÁRIO / AGENDA */}
                    {/* ========================================== */}
                    {activeTab === 'calendario' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 mb-6">
                                <h2 className="text-center font-black text-lg text-slate-800 dark:text-white mb-6 capitalize">
                                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                                </h2>

                                <div className="grid grid-cols-7 gap-2 mb-2">
                                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                        <div key={i} className="text-center text-xs font-black text-slate-400">{d}</div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {blanks.map(b => <div key={`b-${b}`} className="h-10"></div>)}
                                    {calendarDays.map(day => {
                                        const dayTxs = monthlyTransactions.filter(t => {
                                            const dt = new Date(t.date + 'T12:00:00');
                                            return dt.getDate() === day && t.type !== 'transferencia';
                                        });
                                        const hasDespesa = dayTxs.some(t => t.type === 'saida');
                                        const hasReceita = dayTxs.some(t => t.type === 'entrada');
                                        const hasInvest = dayTxs.some(t => t.type === 'investimento');
                                        const isSelected = selectedDay === day;
                                        const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDay(day)}
                                                className={`h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : isToday ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold border border-blue-200 dark:border-blue-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                            >
                                                <span className="text-xs font-bold">{day}</span>
                                                <div className="flex gap-0.5 absolute bottom-1.5">
                                                    {hasReceita && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></div>}
                                                    {hasDespesa && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`}></div>}
                                                    {hasInvest && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`}></div>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">
                                    Movimentações do Dia {selectedDay}
                                </h3>
                                <div className="space-y-3">
                                    {monthlyTransactions.filter(t => new Date(t.date + 'T12:00:00').getDate() === selectedDay).length === 0 ? (
                                        <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                                            <p className="text-sm text-slate-400">Nenhum movimento registrado neste dia.</p>
                                        </div>
                                    ) : (
                                        monthlyTransactions.filter(t => new Date(t.date + 'T12:00:00').getDate() === selectedDay).map(t => {
                                            const isTransfer = t.type === 'transferencia';
                                            const isIncome = t.type === 'entrada';
                                            const isInvest = t.type === 'investimento';

                                            return (
                                                <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${isTransfer ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-500' : isIncome ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' : isInvest ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'}`}>
                                                            {getCategoryIcon(t.category)}
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold text-slate-800 dark:text-white text-sm">{t.description}</p>
                                                            <p className="text-[10px] text-slate-400">{t.category}</p>
                                                        </div>
                                                    </div>
                                                    <p className={`font-black text-sm ${isTransfer ? 'text-blue-500' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : isInvest ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                        {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(t.amount)}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================== */}
                    {/* ABA 4: INVESTIMENTOS */}
                    {/* ========================================== */}
                    {activeTab === 'investimentos' && (
                        <div className="animate-in fade-in duration-300 space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                                <h2 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">Patrimônio Investido Acumulado</h2>
                                <h2 className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 mb-6">
                                    {formatCurrency(investmentData.total)}
                                </h2>
                                <div className="relative w-52 h-52 mb-6">
                                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                                        {createPieSlices(investmentData.data)}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-indigo-600 dark:text-indigo-400">
                                        <TrendingUp size={36} strokeWidth={2} />
                                    </div>
                                </div>

                                <div className="w-full space-y-3">
                                    {investmentData.data.length === 0 ? (
                                        <div className="text-center py-6">
                                            <p className="text-sm text-slate-400 font-medium">Ainda não há aportes registrados.</p>
                                        </div>
                                    ) : (
                                        investmentData.data.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }}></div>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-slate-800 dark:text-white block">{formatCurrency(item.amount)}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{item.percentage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <button
                                    onClick={() => openNewForm('investimento')}
                                    className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-md active:scale-[0.98]"
                                >
                                    <Plus size={18} /> Registrar Novo Aporte
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* --- MENU INFERIOR NAVEGAÇÃO --- */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 sm:px-6 py-2 z-30 pb-safe shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
                    <div className="max-w-md mx-auto flex justify-between items-center relative">
                        <button
                            onClick={() => setActiveTab('inicio')}
                            className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === 'inicio' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <LayoutGrid size={22} className={activeTab === 'inicio' ? 'stroke-[2.5]' : 'stroke-2'} />
                            <span className="text-[10px] font-bold mt-1">Início</span>
                        </button>

                        <button
                            onClick={() => { setActiveTab('analise'); setAnalysisView('mes'); }}
                            className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === 'analise' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <PieChart size={22} className={activeTab === 'analise' ? 'stroke-[2.5]' : 'stroke-2'} />
                            <span className="text-[10px] font-bold mt-1">Análise</span>
                        </button>

                        <div className="relative -top-6 mx-2">
                            <button
                                onClick={() => openNewForm('saida')}
                                className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white w-14 h-14 rounded-full shadow-2xl shadow-blue-600/40 hover:scale-105 transition-all transform active:scale-95 flex items-center justify-center border-4 border-slate-50 dark:border-slate-950"
                                title="Novo Lançamento"
                            >
                                <Plus size={28} />
                            </button>
                        </div>

                        <button
                            onClick={() => setActiveTab('calendario')}
                            className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === 'calendario' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <CalendarDays size={22} className={activeTab === 'calendario' ? 'stroke-[2.5]' : 'stroke-2'} />
                            <span className="text-[10px] font-bold mt-1">Agenda</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('investimentos')}
                            className={`flex flex-col items-center p-2 flex-1 transition-colors ${activeTab === 'investimentos' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <TrendingUp size={22} className={activeTab === 'investimentos' ? 'stroke-[2.5]' : 'stroke-2'} />
                            <span className="text-[10px] font-bold mt-1">Investir</span>
                        </button>
                    </div>
                </div>

                {/* --- BOTÃO FLUTUANTE DO ASSISTENTE IA (FinBot) --- */}
                {!isFormOpen && !isPayInvoiceModalOpen && !isGoalModalOpen && !isCategoryManagerOpen && !isFamilyModalOpen && (
                    <button
                        onClick={() => setIsAssistantOpen(true)}
                        className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-30 active:scale-95"
                        title="Assistente FinBot"
                    >
                        <MessageSquare size={24} />
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white dark:border-slate-900"></span>
                        </span>
                    </button>
                )}

                {/* ==================================================== */}
                {/* MODAL 1: ASSISTENTE FINBOT (IA GEMINI / NLP) */}
                {/* ==================================================== */}
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

                {/* ==================================================== */}
                {/* MODAL 2: FORMULÁRIO DE LANÇAMENTO (Com Câmera OCR) */}
                {/* ==================================================== */}
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

                            {isScanningReceipt && (
                                <div className="mb-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold">
                                    <Loader2 className="animate-spin" size={16} /> A IA está analisando a foto do recibo...
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto scrollbar-hide">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'entrada', category: allCategories.entrada[0] })}
                                        className={`flex-1 min-w-[85px] py-2.5 text-xs font-bold rounded-xl transition-all ${formData.type === 'entrada' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Receita
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'saida', category: allCategories.saida[0] })}
                                        className={`flex-1 min-w-[85px] py-2.5 text-xs font-bold rounded-xl transition-all ${formData.type === 'saida' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Despesa
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
                                        placeholder="Ex: Supermercado, Salário, Internet..."
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

                {/* ==================================================== */}
                {/* MODAL 3: PAGAR FATURA DO CARTÃO */}
                {/* ==================================================== */}
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

                {/* ==================================================== */}
                {/* MODAL 4: DEFINIR META DE CATEGORIA */}
                {/* ==================================================== */}
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
                                            setIsGoalModalOpen(false);
                                            showToast("Meta removida!");
                                        }}
                                        className="w-1/3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-2xl p-4 text-xs"
                                    >
                                        Remover Meta
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

                {/* ==================================================== */}
                {/* MODAL 5: GERENCIADOR DE CATEGORIAS */}
                {/* ==================================================== */}
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
                                setCustomCategories(prev => [...prev, { name: trimmed, type: newCatData.type, color: newCatData.color }]);
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

                {/* ==================================================== */}
                {/* MODAL 6: MODO FAMÍLIA (COMPARTILHAMENTO) */}
                {/* ==================================================== */}
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

                {/* ==================================================== */}
                {/* MODAL 7: CHAVE GEMINI API KEY */}
                {/* ==================================================== */}
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

                {/* ==================================================== */}
                {/* MODAL 8: CONFIRMAÇÃO DE EXCLUSÃO */}
                {/* ==================================================== */}
                {transactionToDelete && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setTransactionToDelete(null)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-2xl">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 dark:text-white">Excluir Registro?</h3>
                                    <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-extrabold text-slate-800 dark:text-white">{transactionToDelete.description}</p>
                                <p className="text-xs text-slate-500">{transactionToDelete.category} • {formatCurrency(transactionToDelete.amount)}</p>
                            </div>

                            {transactionToDelete.isFromRepeatRule && (
                                <div className="mb-4">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cancelFutureRepeats}
                                            onChange={(e) => setCancelFutureRepeats(e.target.checked)}
                                            className="w-4 h-4 rounded text-rose-600"
                                        />
                                        Cancelar também os lançamentos automáticos futuros desta assinatura
                                    </label>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTransactionToDelete(null)}
                                    className="w-1/2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-2xl p-3.5 text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl p-3.5 text-sm shadow-md"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}