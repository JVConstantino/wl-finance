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
    Download, ShieldCheck, Layers, ChevronDown, Database, LogIn, LogOut, RefreshCw,
    Lock, Unlock, Shield, Heart, Copy, ShoppingCart, PiggyBank, Bell, CheckSquare, Square, Flame,
    Mic, MicOff, Scale, Share2, Trophy, Award, Medal, Printer, FileDown, Star,
    Zap, Compass, Rocket, Bot, Sliders, Play, RotateCcw
} from 'lucide-react';
import {
    getSupabase, getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig,
    authSignUp, authSignIn, authSignOut, authResetPassword,
    fetchAllUserData, syncUpsertTransaction, syncDeleteTransaction,
    syncUpsertAccount, syncDeleteAccount, syncUpsertRule, syncDeleteRule,
    syncUpsertGoal, syncUpsertCategory, syncDeleteCategory, migrateAllLocalData,
    fetchUserFamily, joinOrCreateFamily, leaveFamily,
    syncUpsertSavingsGoal, syncDeleteSavingsGoal, syncUpsertShoppingItem, syncDeleteShoppingItem,
    deleteAllUserCloudData
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

const initialChallenges = [
    {
        id: 'ch_1',
        title: 'Semana Zero Delivery 🍕',
        category: 'Alimentação',
        description: 'Cozinhem juntos todas as refeições por 7 dias sem pedir delivery.',
        targetDays: 7,
        currentDays: 0,
        status: 'nao_iniciado',
        points: 60,
        rewardIcon: '👨‍🍳'
    },
    {
        id: 'ch_2',
        title: 'Desafio dos R$ 10 Diários 💰',
        category: 'Poupança',
        description: 'Guardem R$ 10 por dia no cofrinho durante 30 dias (R$ 300 acumulados).',
        targetDays: 30,
        currentDays: 0,
        status: 'nao_iniciado',
        points: 100,
        rewardIcon: '🏦'
    },
    {
        id: 'ch_3',
        title: 'Mercado com Lista Fechada 🛒',
        category: 'Controle',
        description: 'Fazer as compras do mês 100% fiéis à lista de mercado sem itens extras.',
        targetDays: 4,
        currentDays: 0,
        status: 'nao_iniciado',
        points: 80,
        rewardIcon: '🎯'
    },
    {
        id: 'ch_4',
        title: 'Contas no Mínimo 💡',
        category: 'Economia',
        description: 'Reduzir as contas de consumo (água, energia ou internet) no mês.',
        targetDays: 1,
        currentDays: 0,
        status: 'nao_iniciado',
        points: 75,
        rewardIcon: '⚡'
    },
    {
        id: 'ch_5',
        title: 'Blindagem de 1 Mês de Reserva 🛡️',
        category: 'Patrimônio',
        description: 'Guardar o equivalente a pelo menos 1 mês de custo de vida no cofrinho.',
        targetDays: 1,
        currentDays: 0,
        status: 'nao_iniciado',
        points: 150,
        rewardIcon: '💎'
    }
];

// Helper para leitura segura do LocalStorage
const safeGet = (key, fallback) => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return fallback;
        const saved = localStorage.getItem(key);
        if (!saved) return fallback;
        const parsed = JSON.parse(saved);
        return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (e) {
        return fallback;
    }
};

let globalCurrency = 'USD';
try {
    const saved = localStorage.getItem('fp_currency');
    if (saved) globalCurrency = JSON.parse(saved);
} catch (e) { }

export const formatCurrency = (value, currency = null) => {
    const curr = currency || globalCurrency || 'USD';
    if (curr === 'BRL') {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
};

// Funções de Processamento de Áudio WAV nativo para compatibilidade com iPhone/Safari/Android
function flattenFloatBuffers(buffers) {
    let length = 0;
    for (let i = 0; i < buffers.length; i++) {
        length += buffers[i].length;
    }
    const result = new Float32Array(length);
    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
        result.set(buffers[i], offset);
        offset += buffers[i].length;
    }
    return result;
}

function downsampleFloatBuffer(buffer, inRate, outRate) {
    if (outRate >= inRate) return buffer;
    const ratio = inRate / outRate;
    const newLen = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLen);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
        const nextOffset = Math.round((offsetResult + 1) * ratio);
        let sum = 0, count = 0;
        for (let i = offsetBuffer; i < nextOffset && i < buffer.length; i++) {
            sum += buffer[i];
            count++;
        }
        result[offsetResult] = count > 0 ? sum / count : 0;
        offsetResult++;
        offsetBuffer = nextOffset;
    }
    return result;
}

function encodeFloatToWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (v, offset, str) => {
        for (let i = 0; i < str.length; i++) {
            v.setUint8(offset + i, str.charCodeAt(i));
        }
    };
    writeStr(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(view, 8, 'WAVE');
    writeStr(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([view], { type: 'audio/wav' });
}

export default function App() {
    // 1. Estados Gerais de UI e Tema
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => safeGet('fp_theme', false));
    const [toastMsg, setToastMsg] = useState('');
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    // 2. Estados de Navegação e Filtros
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('inicio'); // 'inicio' | 'analise' | 'calendario' | 'investimentos'
    const [analysisView, setAnalysisView] = useState('mes');
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('todos');

    // 3. Modais e Formulários
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
    const [familyNameInput, setFamilyNameInput] = useState('');
    const [activeFamilyCode, setActiveFamilyCode] = useState(() => {
        try { return localStorage.getItem('fp_family_code') || null; } catch (e) { return null; }
    });
    const [familyData, setFamilyData] = useState(null);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState(() => {
        try { return localStorage.getItem('fp_gemini_key') || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42STBHQnBFNVVJbUVRVEEzSXNZSVFzaW5NdThXMVNfZTFOTVFLQWFkZnYxNUE=') : ''); } catch (e) { return (typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42STBHQnBFNVVJbUVRVEEzSXNZSVFzaW5NdThXMVNfZTFOTVFLQWFkZnYxNUE=') : ''); }
    });
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [isPayInvoiceModalOpen, setIsPayInvoiceModalOpen] = useState(false);
    const [invoiceAccountToPay, setInvoiceAccountToPay] = useState(null);
    const [invoiceSourceAccount, setInvoiceSourceAccount] = useState('acc_main');

    // 4. Escaneamento de Recibos
    const [isScanningReceipt, setIsScanningReceipt] = useState(false);

    // 5. Estados de Dados Principais (com persistência LocalStorage segura)
    const [transactions, setTransactions] = useState(() => safeGet('fp_transactions', []));
    const [repeatingRules, setRepeatingRules] = useState(() => safeGet('fp_rules', []));
    const [monthlyGoals, setMonthlyGoals] = useState(() => safeGet('fp_goals', {}));
    const [customCategories, setCustomCategories] = useState(() => safeGet('fp_custom_categories', []));
    const [accounts, setAccounts] = useState(() => safeGet('fp_accounts', defaultAccounts));
    const [formData, setFormData] = useState({
        type: 'saida',
        amount: '',
        category: 'Casa',
        date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'pago',
        isRepeating: false,
        repeatDurationMode: 'indefinite', // 'indefinite' | 'fixed'
        repeatDurationMonths: '4',
        accountId: 'acc_main',
        paidBy: 'conjunto' // 'marido' | 'esposa' | 'conjunto'
    });

    // 5.5 Estados para Gestão de Contas Fixas & Contratos com Vigência
    const [isFixedBillsModalOpen, setIsFixedBillsModalOpen] = useState(false);
    const [fixedBillEditing, setFixedBillEditing] = useState(null);
    const [fixedBillForm, setFixedBillForm] = useState({
        id: '',
        type: 'saida',
        amount: '',
        category: 'Casa',
        description: '',
        day: '1',
        accountId: 'acc_main',
        paidBy: 'conjunto',
        durationMode: 'indefinite', // 'indefinite' | 'fixed'
        durationMonths: '4',
        startMonth: new Date().toISOString().slice(0, 7) // 'YYYY-MM'
    });
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [renewingBill, setRenewingBill] = useState(null);
    const [renewFormData, setRenewFormData] = useState({
        newAmount: '',
        extendMonths: '4'
    });

    // 5.6 Estado do Banner de Contas a Vencer (Arrastar para dispensar na sessão atual)
    const [isDueBannerDismissed, setIsDueBannerDismissed] = useState(false);
    const [bannerSwipeX, setBannerSwipeX] = useState(0);
    const [isDraggingBanner, setIsDraggingBanner] = useState(false);
    const bannerTouchStartX = useRef(0);

    // 6. Estados do Supabase (Nuvem & Auth)
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

    // 7. Segurança e Bloqueio por PIN (App Lock)
    const [appPin, setAppPin] = useState(() => safeGet('fp_app_pin', ''));
    const [isAppLocked, setIsAppLocked] = useState(() => Boolean(safeGet('fp_app_pin', '')));
    const [enteredPin, setEnteredPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [newPinInput, setNewPinInput] = useState('');
    const [confirmPinInput, setConfirmPinInput] = useState('');

    // 8. Cofrinhos & Sonhos do Casal
    const [savingsGoals, setSavingsGoals] = useState(() => safeGet('fp_savings_goals', []));
    const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [selectedSavingsGoal, setSelectedSavingsGoal] = useState(null);
    const [depositActionType, setDepositActionType] = useState('deposit'); // 'deposit' | 'withdraw'
    const [savingsDepositInput, setSavingsDepositInput] = useState('');
    const [newGoalData, setNewGoalData] = useState({ title: '', targetAmount: '', currentAmount: '0', deadline: '', icon: '🎯', color: 'from-blue-600 to-indigo-600' });

    // 9. Lista de Mercado / Compras Compartilhada
    const [shoppingItems, setShoppingItems] = useState(() => safeGet('fp_shopping_items', []));
    const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
    const [newShopItem, setNewShopItem] = useState({ name: '', quantity: '1 un', estimatedPrice: '', category: 'Geral', addedBy: 'conjunto' });

    // 10. Diagnóstico Mensal com IA
    const [isAiDiagnosisOpen, setIsAiDiagnosisOpen] = useState(false);
    const [aiDiagnosisText, setAiDiagnosisText] = useState('');
    const [isGeneratingDiagnosis, setIsGeneratingDiagnosis] = useState(false);

    // 13. Comando de Voz / Áudio com IA
    const [isListeningVoice, setIsListeningVoice] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [manualVoiceInput, setManualVoiceInput] = useState('');
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const audioContextRef = useRef(null);
    const audioProcessorRef = useRef(null);
    const audioSourceRef = useRef(null);
    const audioStreamRef = useRef(null);
    const audioBuffersRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // 14. Relatório Executivo para Impressão / PDF
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // 16. Simulador de Liberdade Financeira (FIRE)
    const [fireMonthlyContribution, setFireMonthlyContribution] = useState(() => safeGet('fp_fire_contribution', 1000));
    const [fireMonthlyExpenseCustom, setFireMonthlyExpenseCustom] = useState(() => safeGet('fp_fire_expense', 3500));
    const [fireRealReturnRate, setFireRealReturnRate] = useState(() => safeGet('fp_fire_rate', 6.0));
    const [fireCoupleAge, setFireCoupleAge] = useState(() => safeGet('fp_fire_age', 30));

    // 17. Desafios Financeiros do Casal
    const [coupleChallenges, setCoupleChallenges] = useState(() => safeGet('fp_couple_challenges', initialChallenges));

    // 18. Chat Interativo com FinBot IA
    const [isFinbotChatOpen, setIsFinbotChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState(() => safeGet('fp_finbot_chat', [
        {
            id: 'msg_welcome',
            sender: 'finbot',
            text: 'Olá! Sou o FinBot, consultor financeiro do casal 🤖✨ Conheço todas as finanças de vocês em tempo real. Pode me perguntar sobre metas, onde economizar ou como acelerar a independência financeira!',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
    ]));
    const [finbotChatInput, setFinbotChatInput] = useState('');
    const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
    const chatMessagesEndRef = useRef(null);

    // 19.5 Moeda do Sistema (Dólar USD padrão / Real BRL)
    const [selectedCurrency, setSelectedCurrency] = useState(() => safeGet('fp_currency', 'USD'));

    // 20. Módulo de Financiamentos & Dívidas do Casal
    const [financings, setFinancings] = useState(() => safeGet('fp_financings', []));
    const [isFinancingModalOpen, setIsFinancingModalOpen] = useState(false);
    const [isContractAnalysisModalOpen, setIsContractAnalysisModalOpen] = useState(false);
    const [contractFileBase64, setContractFileBase64] = useState(null);
    const [contractFileMimeType, setContractFileMimeType] = useState('application/pdf');
    const [contractFileName, setContractFileName] = useState('');
    const [contractTextInput, setContractTextInput] = useState('');
    const [isAnalyzingContract, setIsAnalyzingContract] = useState(false);
    const [contractAnalysisResult, setContractAnalysisResult] = useState(null);
    const [selectedFinancingForAmortization, setSelectedFinancingForAmortization] = useState(null);
    const [amortizationPrepayCount, setAmortizationPrepayCount] = useState(1);
    const [isAmortizationModalOpen, setIsAmortizationModalOpen] = useState(false);
    const [newFinancingData, setNewFinancingData] = useState({
        title: '',
        type: 'veiculo',
        installmentAmount: '',
        totalInstallments: '',
        paidInstallments: '0',
        dueDay: '10',
        accountId: 'acc_main',
        paidBy: 'conjunto',
        interestRateAnnual: '',
        icon: '🚗',
        autoDebit: true
    });

    // 21. Custos Complementares do Carro nos EUA (TCO)
    const [carExtraCosts, setCarExtraCosts] = useState(() => safeGet('fp_car_extra_costs', {
        insurance: 0,
        gasMonthly: 0,
        maintenance: 0,
        tolls: 0
    }));
    const [isCarCostsModalOpen, setIsCarCostsModalOpen] = useState(false);

    // 22. Conexão Bancária Automática nos EUA (Plaid & Apple Pay)
    const [connectedCards, setConnectedCards] = useState(() => safeGet('fp_connected_cards', []));
    const [plaidConfig, setPlaidConfig] = useState(() => safeGet('fp_plaid_config', {
        clientId: '6a92133c948ab6000daa24fb',
        secret: typeof atob !== 'undefined' ? atob('ZDU0ZWRkMjI4MDM4OGQ3MzQzNjg5MDM4MGNlYjcz') : '',
        environment: 'sandbox'
    }));
    const [isPlaidModalOpen, setIsPlaidModalOpen] = useState(false);
    const [plaidActiveTab, setPlaidActiveTab] = useState('cards'); // 'cards' | 'add' | 'applepay' | 'config'
    const [isSyncingPlaid, setIsSyncingPlaid] = useState(false);
    const [newCardForm, setNewCardForm] = useState({
        institution: 'Chase',
        mask: '',
        type: 'credit',
        owner: 'marido',
        initialBalance: ''
    });

    // 23. Estados Pull-to-Refresh
    const [pullY, setPullY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const touchStartRef = useRef(0);
    const isPullingRef = useRef(false);

    // =========================================================================
    // FUNÇÕES AUXILIARES & SUPABASE
    // =========================================================================
    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3500);
    };

    const loadCloudData = async (user) => {
        if (!user) return;
        try {
            setIsCloudSyncing(true);
            const cloudData = await fetchAllUserData();
            if (cloudData) {
                const cloudTxs = cloudData.transactions || [];
                const cloudAccs = (cloudData.accounts && cloudData.accounts.length > 0) ? cloudData.accounts : defaultAccounts;
                const cloudRules = cloudData.repeatingRules || [];
                const cloudGoals = cloudData.monthlyGoals || {};
                const cloudCats = cloudData.customCategories || [];
                const cloudSavings = cloudData.savingsGoals || [];
                const cloudShopping = cloudData.shoppingItems || [];

                setTransactions(cloudTxs);
                setAccounts(cloudAccs);
                setRepeatingRules(cloudRules);
                setMonthlyGoals(cloudGoals);
                setCustomCategories(cloudCats);
                setSavingsGoals(cloudSavings);
                setShoppingItems(cloudShopping);

                localStorage.setItem('fp_transactions', JSON.stringify(cloudTxs));
                localStorage.setItem('fp_accounts', JSON.stringify(cloudAccs));
                localStorage.setItem('fp_rules', JSON.stringify(cloudRules));
                localStorage.setItem('fp_goals', JSON.stringify(cloudGoals));
                localStorage.setItem('fp_custom_categories', JSON.stringify(cloudCats));
                localStorage.setItem('fp_savings_goals', JSON.stringify(cloudSavings));
                localStorage.setItem('fp_shopping_items', JSON.stringify(cloudShopping));
            }
            // Buscar dados da família / casal
            try {
                const fam = await fetchUserFamily(user.id);
                if (fam) {
                    setFamilyData(fam);
                    setActiveFamilyCode(fam.familyId);
                    localStorage.setItem('fp_family_code', fam.familyId);
                }
            } catch (errFam) {
                console.warn('Grupo familiar não encontrado:', errFam);
            }
        } catch (err) {
            console.error('Erro ao sincronizar com nuvem:', err);
        } finally {
            setIsCloudSyncing(false);
        }
    };

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

    // =========================================================================
    // HOOKS USEEFFECT
    // =========================================================================

    // PWA Install Prompt Hook
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    // Pull-to-Refresh Touch Hook
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
                    try { navigator.vibrate(25); } catch (e) { }
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

    // App Lock Visibility Listener (Bloqueia ao alternar de aplicativo se o PIN estiver ativo)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const currentPin = safeGet('fp_app_pin', '');
                if (currentPin) {
                    setIsAppLocked(true);
                    setEnteredPin('');
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const handlePinKeyPress = (digit) => {
        if (enteredPin.length >= 4) return;
        const newPin = enteredPin + digit;
        setEnteredPin(newPin);
        if (navigator.vibrate) {
            try { navigator.vibrate(15); } catch (e) { }
        }
        if (newPin.length === 4) {
            if (newPin === appPin) {
                if (navigator.vibrate) {
                    try { navigator.vibrate([25, 40, 25]); } catch (e) { }
                }
                setTimeout(() => {
                    setIsAppLocked(false);
                    setEnteredPin('');
                    setPinError(false);
                }, 150);
            } else {
                setPinError(true);
                if (navigator.vibrate) {
                    try { navigator.vibrate([80, 40, 80]); } catch (e) { }
                }
                setTimeout(() => {
                    setEnteredPin('');
                    setPinError(false);
                }, 700);
            }
        }
    };

    const handlePinDelete = () => {
        setEnteredPin(prev => prev.slice(0, -1));
        if (navigator.vibrate) {
            try { navigator.vibrate(10); } catch (e) { }
        }
    };

    const handleSetNewPin = (e) => {
        e.preventDefault();
        if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
            showToast("O PIN deve conter exatamente 4 dígitos numéricos.");
            return;
        }
        if (newPinInput !== confirmPinInput) {
            showToast("Os PINs digitados não conferem.");
            return;
        }
        setAppPin(newPinInput);
        localStorage.setItem('fp_app_pin', newPinInput);
        setNewPinInput('');
        setConfirmPinInput('');
        setIsPinModalOpen(false);
        showToast("🔒 PIN de segurança ativado com sucesso!");
    };

    const handleRemoveAppPin = () => {
        setAppPin('');
        localStorage.removeItem('fp_app_pin');
        setIsAppLocked(false);
        setIsPinModalOpen(false);
        showToast("Bloqueio por PIN desativado.");
    };

    const handleJoinOrCreateFamily = async (e) => {
        e.preventDefault();
        if (!familyCodeInput.trim()) return;
        const code = familyCodeInput.trim().toUpperCase();
        try {
            if (supabaseUser) {
                const res = await joinOrCreateFamily(code, familyNameInput || `Casal ${code}`, supabaseUser);
                setActiveFamilyCode(res.familyId);
                localStorage.setItem('fp_family_code', res.familyId);
                const fam = await fetchUserFamily(supabaseUser.id);
                if (fam) setFamilyData(fam);
                await loadCloudData(supabaseUser);
                showToast(`Conectado ao grupo familiar: ${code}!`);
            } else {
                setActiveFamilyCode(code);
                localStorage.setItem('fp_family_code', code);
                showToast(`Código ${code} salvo localmente!`);
            }
            setIsFamilyModalOpen(false);
        } catch (err) {
            console.error(err);
            showToast("Erro ao conectar ao grupo: " + (err.message || 'verifique a conexão.'));
        }
    };

    const handleLeaveFamilyGroup = async () => {
        if (!activeFamilyCode) return;
        try {
            if (supabaseUser) {
                await leaveFamily(activeFamilyCode, supabaseUser.id);
            }
            setActiveFamilyCode(null);
            setFamilyData(null);
            localStorage.removeItem('fp_family_code');
            setIsFamilyModalOpen(false);
            if (supabaseUser) await loadCloudData(supabaseUser);
            showToast("Você desconectou do modo casal/família.");
        } catch (err) {
            console.error(err);
            showToast("Erro ao sair do grupo.");
        }
    };

    // Inicialização do Supabase & Monitoramento de Sessão
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase) return;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setSupabaseUser(session.user);
                loadCloudData(session.user);
            }
        });

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

    // Subscrição em Tempo Real (Realtime & Auto-Sync ao focar a janela)
    useEffect(() => {
        const supabase = getSupabase();
        if (!supabase || !supabaseUser) return;

        const channel = supabase
            .channel('db-changes-all')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
                loadCloudData(supabaseUser);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
                loadCloudData(supabaseUser);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_goals' }, () => {
                loadCloudData(supabaseUser);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_goals' }, () => {
                loadCloudData(supabaseUser);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => {
                loadCloudData(supabaseUser);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'repeating_rules' }, () => {
                loadCloudData(supabaseUser);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_categories' }, () => {
                loadCloudData(supabaseUser);
            })
            .subscribe();

        // Auto-Sync quando o usuário volta para a aba no PC ou desbloqueia o celular
        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === 'visible') {
                loadCloudData(supabaseUser);
            }
        };

        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
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
        setAuthMode('login');
        setIsAuthModalOpen(true);
        showToast('✅ Supabase configurado! Agora faça login ou crie sua conta.');
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
        localStorage.setItem('fp_savings_goals', JSON.stringify(savingsGoals));
    }, [savingsGoals]);

    useEffect(() => {
        localStorage.setItem('fp_shopping_items', JSON.stringify(shoppingItems));
    }, [shoppingItems]);

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

    // Categorias Combinadas (Seguro contra qualquer formato de categoria)
    const allCategories = useMemo(() => {
        const combined = {
            entrada: [...baseCategories.entrada],
            saida: [...baseCategories.saida],
            investimento: [...baseCategories.investimento]
        };
        (customCategories || []).forEach(cat => {
            if (!cat) return;
            const catType = typeof cat === 'object' ? (cat.type || 'saida') : 'saida';
            const catName = typeof cat === 'object' ? (cat.name || '') : String(cat);
            if (catName && combined[catType] && !combined[catType].includes(catName)) {
                combined[catType].push(catName);
            }
        });
        return combined;
    }, [customCategories]);

    const allCategoryColors = useMemo(() => {
        const combined = { ...baseCategoryColors };
        (customCategories || []).forEach(cat => {
            if (!cat) return;
            const catName = typeof cat === 'object' ? cat.name : String(cat);
            const catColor = typeof cat === 'object' ? (cat.color || '#3b82f6') : '#3b82f6';
            if (catName) {
                combined[catName] = catColor;
            }
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

    const monthlySummary = useMemo(() => {
        const receitas = totals.receitas;
        const despesas = totals.despesas;
        const investimentos = totals.investimentos;
        const saldoLiquido = receitas - despesas - investimentos;
        const taxaPoupanca = receitas > 0 ? Math.max(0, ((receitas - despesas) / receitas) * 100) : 0;
        return {
            receitas,
            despesas,
            investimentos,
            saldoLiquido,
            taxaPoupanca
        };
    }, [totals]);

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

    // 5. Alerta de Contas a Vencer no Topo (Anti-Juros)
    const upcomingDueBills = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const in7Days = new Date(today);
        in7Days.setDate(in7Days.getDate() + 7);

        return monthlyTransactions.filter(t => {
            if (t.type !== 'saida' || t.status !== 'pendente') return false;
            const tDate = new Date((t.date || '') + 'T12:00:00');
            return !isNaN(tDate.getTime()) && tDate <= in7Days;
        });
    }, [monthlyTransactions]);

    const totalUpcomingDue = useMemo(() => {
        return upcomingDueBills.reduce((acc, curr) => acc + curr.amount, 0);
    }, [upcomingDueBills]);

    const upcomingDueData = useMemo(() => {
        return {
            bills: upcomingDueBills,
            total: totalUpcomingDue,
            count: upcomingDueBills.length
        };
    }, [upcomingDueBills, totalUpcomingDue]);

    const pendingShoppingCount = useMemo(() => {
        return shoppingItems.filter(i => !i.completed).length;
    }, [shoppingItems]);

    // 16. CÁLCULO E PROJEÇÃO DO SIMULADOR FIRE (LIBERDADE FINANCEIRA)
    const fireSimulationData = useMemo(() => {
        const totalLiquid = Object.values(accountBalances).reduce((a, b) => a + b, 0);
        const totalInvestments = transactions.filter(t => t.type === 'investimento' && t.status === 'pago').reduce((a, b) => a + b.amount, 0);
        const totalSavings = savingsGoals.reduce((a, b) => a + (b.currentAmount || 0), 0);
        const currentNetWorth = Math.max(0, totalLiquid + totalInvestments + totalSavings);

        const monthlyExpense = Math.max(500, fireMonthlyExpenseCustom || (totals.despesas || 3500));
        const fireTarget = monthlyExpense * 300; // Regra dos 4% (300x o gasto mensal)

        const monthlyContribution = Math.max(50, fireMonthlyContribution || 1000);
        const annualRate = Math.max(0.01, (fireRealReturnRate || 6.0) / 100);
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

        let months = 0;
        if (currentNetWorth >= fireTarget) {
            months = 0;
        } else {
            const numerator = fireTarget * monthlyRate + monthlyContribution;
            const denominator = currentNetWorth * monthlyRate + monthlyContribution;
            if (numerator > 0 && denominator > 0) {
                months = Math.ceil(Math.log(numerator / denominator) / Math.log(1 + monthlyRate));
            } else {
                months = 1200;
            }
        }

        const yearsRemaining = Math.floor(months / 12);
        const monthsExtra = months % 12;
        const retirementAge = (fireCoupleAge || 30) + yearsRemaining;
        const progressPct = fireTarget > 0 ? Math.min(100, Math.round((currentNetWorth / fireTarget) * 100)) : 0;

        // Efeito acelerador com +R$ 300/mês
        const fasterContribution = monthlyContribution + 300;
        const numFaster = fireTarget * monthlyRate + fasterContribution;
        const denFaster = currentNetWorth * monthlyRate + fasterContribution;
        const fasterMonths = (numFaster > 0 && denFaster > 0) ? Math.ceil(Math.log(numFaster / denFaster) / Math.log(1 + monthlyRate)) : months;
        const monthsSaved = Math.max(0, months - fasterMonths);
        const yearsSaved = (monthsSaved / 12).toFixed(1);

        // Marcos de conquista patrimonial
        const milestones = [
            { pct: 25, label: 'Primeiro Degrau', amount: fireTarget * 0.25, reached: currentNetWorth >= fireTarget * 0.25 },
            { pct: 50, label: 'Meio Caminho (Coast FIRE)', amount: fireTarget * 0.50, reached: currentNetWorth >= fireTarget * 0.50 },
            { pct: 75, label: 'Quase Livres (Lean FIRE)', amount: fireTarget * 0.75, reached: currentNetWorth >= fireTarget * 0.75 },
            { pct: 100, label: 'Liberdade Plena (Full FIRE)', amount: fireTarget, reached: currentNetWorth >= fireTarget }
        ];

        return {
            currentNetWorth,
            monthlyExpense,
            fireTarget,
            monthlyContribution,
            annualRate,
            months,
            yearsRemaining,
            monthsExtra,
            retirementAge,
            progressPct,
            monthsSaved,
            yearsSaved,
            milestones
        };
    }, [accountBalances, transactions, savingsGoals, fireMonthlyExpenseCustom, totals.despesas, fireMonthlyContribution, fireRealReturnRate, fireCoupleAge]);

    // 17. COMPARATIVO MÊS A MÊS & RAIO-X DE GASTOS INVISÍVEIS
    const comparativeData = useMemo(() => {
        const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth();

        const prevMonthTransactions = transactions.filter(t => {
            const d = new Date(t.date + 'T00:00:00');
            return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
        });

        const prevTotals = prevMonthTransactions.reduce((acc, curr) => {
            if (curr.status === 'pago') {
                if (curr.type === 'entrada') acc.receitas += curr.amount;
                if (curr.type === 'saida') acc.despesas += curr.amount;
                if (curr.type === 'investimento') acc.investimentos += curr.amount;
            }
            return acc;
        }, { receitas: 0, despesas: 0, investimentos: 0 });

        const diffReceitas = totals.receitas - prevTotals.receitas;
        const pctReceitas = prevTotals.receitas > 0 ? ((totals.receitas - prevTotals.receitas) / prevTotals.receitas) * 100 : 0;

        const diffDespesas = totals.despesas - prevTotals.despesas;
        const pctDespesas = prevTotals.despesas > 0 ? ((totals.despesas - prevTotals.despesas) / prevTotals.despesas) * 100 : 0;

        const currentSavings = monthlySummary.saldoLiquido;
        const prevSavings = prevTotals.receitas - prevTotals.despesas - prevTotals.investimentos;
        const diffSavings = currentSavings - prevSavings;

        // Comparativo por categoria
        const currentExpGrouped = monthlyTransactions.filter(t => t.type === 'saida' && t.status === 'pago').reduce((acc, curr) => {
            const cat = curr.category || 'Outros';
            acc[cat] = (acc[cat] || 0) + curr.amount;
            return acc;
        }, {});

        const prevExpGrouped = prevMonthTransactions.filter(t => t.type === 'saida' && t.status === 'pago').reduce((acc, curr) => {
            const cat = curr.category || 'Outros';
            acc[cat] = (acc[cat] || 0) + curr.amount;
            return acc;
        }, {});

        const allCats = Array.from(new Set([...Object.keys(currentExpGrouped), ...Object.keys(prevExpGrouped)]));
        const categoryComparison = allCats.map(cat => {
            const currentAmount = currentExpGrouped[cat] || 0;
            const prevAmount = prevExpGrouped[cat] || 0;
            const diff = currentAmount - prevAmount;
            const pct = prevAmount > 0 ? ((currentAmount - prevAmount) / prevAmount) * 100 : (currentAmount > 0 ? 100 : 0);
            return {
                category: cat,
                currentAmount,
                prevAmount,
                diff,
                pct,
                color: allCategoryColors[cat] || '#94a3b8'
            };
        }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

        // Detector de Gastos Invisíveis (microgastos <= R$ 35 pagos)
        const microExpenses = monthlyTransactions.filter(t => t.type === 'saida' && t.status === 'pago' && t.amount <= 35);
        const totalMicroAmount = microExpenses.reduce((a, b) => a + b.amount, 0);
        const countMicro = microExpenses.length;
        const annualMicroProjected = totalMicroAmount * 12;
        const fiveYearInvestedAt10 = totalMicroAmount > 0 ? (totalMicroAmount * ((Math.pow(1 + 0.10 / 12, 60) - 1) / (0.10 / 12))) : 0;

        return {
            prevDate,
            prevTotals,
            diffReceitas,
            pctReceitas,
            diffDespesas,
            pctDespesas,
            diffSavings,
            categoryComparison,
            microExpenses,
            totalMicroAmount,
            countMicro,
            annualMicroProjected,
            fiveYearInvestedAt10
        };
    }, [currentDate, transactions, monthlyTransactions, totals, monthlySummary, allCategoryColors]);

    // 22. Raio-X de Supermercados nos EUA (Costco, Walmart, Target, Publix, Trader Joe's)
    const groceryAnalysisData = useMemo(() => {
        const isGrocery = (t) => {
            const cat = (t.category || '').toLowerCase();
            const desc = (t.description || '').toLowerCase();
            return cat.includes('aliment') || cat.includes('mercado') || cat.includes('supermercado') || cat.includes('grocery') ||
                desc.includes('costco') || desc.includes('walmart') || desc.includes('target') || desc.includes('publix') || desc.includes('trader') || desc.includes('aldi') || desc.includes('kroger') || desc.includes('sam');
        };
        const currentMonthGrocery = (monthlyTransactions || []).filter(t => t.type === 'saida' && isGrocery(t));
        const totalCurrent = currentMonthGrocery.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const countCurrent = currentMonthGrocery.length;
        const avgTicket = countCurrent > 0 ? totalCurrent / countCurrent : 0;

        // Mês anterior
        const prevMonthGrocery = (transactions || []).filter(t => {
            if (t.type !== 'saida' || !isGrocery(t)) return false;
            const [y, m] = (t.date || '').split('-');
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth(); // 0-11
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            const prevMonth = currentMonth === 0 ? 12 : currentMonth; // 1-12
            return Number(y) === prevYear && Number(m) === prevMonth;
        });
        const totalPrev = prevMonthGrocery.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const diffPct = totalPrev > 0 ? ((totalCurrent - totalPrev) / totalPrev) * 100 : 0;

        return {
            totalCurrent,
            countCurrent,
            avgTicket,
            totalPrev,
            diffPct,
            transactions: currentMonthGrocery
        };
    }, [monthlyTransactions, transactions, currentDate]);

    // 23. Poupança de Centavos (Efeito Round-Up / Acorns Automático)
    const roundUpData = useMemo(() => {
        let totalCents = 0;
        let eligibleCount = 0;
        (monthlyTransactions || []).forEach(t => {
            if (t.type === 'saida' && t.amount > 0) {
                const decimal = t.amount % 1;
                if (decimal > 0.001) {
                    const diff = 1 - decimal;
                    totalCents += diff;
                    eligibleCount++;
                }
            }
        });
        const roundedTotal = Math.round(totalCents * 100) / 100;
        const projectedAnnual = roundedTotal * 12;
        const projected5Years = projectedAnnual * 5;
        return {
            totalMonthly: roundedTotal,
            eligibleCount,
            projectedAnnual,
            projected5Years
        };
    }, [monthlyTransactions]);

    const handleDepositRoundUp = (goalId) => {
        if (!roundUpData.totalMonthly || roundUpData.totalMonthly <= 0) {
            showToast("Nenhum centavo de troco acumulado este mês ainda.");
            return;
        }
        const targetGoal = savingsGoals.find(g => g.id === goalId) || savingsGoals[0];
        if (!targetGoal) {
            showToast("Crie um cofrinho primeiro para depositar o troco.");
            return;
        }
        const amountToAdd = roundUpData.totalMonthly;
        setSavingsGoals(prev => prev.map(g => {
            if (g.id === targetGoal.id) {
                return { ...g, currentAmount: (Number(g.currentAmount) || 0) + amountToAdd };
            }
            return g;
        }));
        showToast(`🪙 Troco de ${formatCurrency(amountToAdd)} guardado no cofrinho "${targetGoal.title}"! 🎉`);
    };

    // Handlers de Desafios do Casal
    const handleAdvanceChallenge = (challengeId) => {
        setCoupleChallenges(prev => prev.map(ch => {
            if (ch.id === challengeId) {
                const nextDays = (ch.currentDays || 0) + 1;
                const isCompleted = nextDays >= ch.targetDays;
                if (isCompleted && ch.status !== 'concluido') {
                    showToast(`🎉 Parabéns! Desafio "${ch.title}" concluído com sucesso (+${ch.points} pts)!`);
                }
                return {
                    ...ch,
                    currentDays: nextDays,
                    status: isCompleted ? 'concluido' : 'em_progresso'
                };
            }
            return ch;
        }));
    };

    const handleResetChallenge = (challengeId) => {
        setCoupleChallenges(prev => prev.map(ch => {
            if (ch.id === challengeId) {
                return { ...ch, currentDays: 0, status: 'nao_iniciado' };
            }
            return ch;
        }));
        showToast("Desafio reiniciado.");
    };

    // Handler de Envio de Mensagem no Chat do FinBot
    const handleSendFinbotChatMessage = async (presetText = null) => {
        const messageToSend = typeof presetText === 'string' ? presetText : finbotChatInput.trim();
        if (!messageToSend || isSendingChatMessage) return;

        if (!geminiApiKey.trim()) {
            showToast("Configure sua chave Gemini no FinBot primeiro.");
            setIsApiKeyModalOpen(true);
            return;
        }

        const userMsg = {
            id: 'msg_' + Date.now(),
            sender: 'user',
            text: messageToSend,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => [...prev, userMsg]);
        setFinbotChatInput('');
        setIsSendingChatMessage(true);

        try {
            const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            const categoriesList = analysisData.data.map(d => `${d.name}: ${formatCurrency(d.amount)} (${d.percentage.toFixed(0)}%)`).join(', ');
            const cofrinhosList = savingsGoals.map(g => `${g.title}: ${formatCurrency(g.currentAmount)} de meta ${formatCurrency(g.targetAmount)}`).join(', ');

            const systemPrompt = `Você é o FinBot, consultor financeiro pessoal de elite e copiloto inteligente do casal.
Você está conversando diretamente com o casal. Responda de forma estratégica, calorosa, motivadora e muito prática em português do Brasil.

DADOS FINANCEIROS REAIS DO CASAL NESTE MOMENTO (${monthName}):
- Receitas do Mês: ${formatCurrency(monthlySummary.receitas)}
- Despesas Pagas do Mês: ${formatCurrency(monthlySummary.despesas)}
- Investimentos Aportados: ${formatCurrency(monthlySummary.investimentos)}
- Saldo Líquido do Mês: ${formatCurrency(monthlySummary.saldoLiquido)}
- Taxa de Poupança do Mês: ${monthlySummary.taxaPoupanca.toFixed(1)}%
- Patrimônio Total Líquido (Contas + Investimentos + Cofrinhos): ${formatCurrency(fireSimulationData.currentNetWorth)}
- Despesas por Categoria: ${categoriesList || 'Nenhuma'}
- Divisão do Casal (50/50): ${coupleSplitData.settlementText} (Você pagou ${formatCurrency(coupleSplitData.totalMarido)}, Esposa pagou ${formatCurrency(coupleSplitData.totalEsposa)})
- Contas a Vencer nos Próximos 7 Dias: ${formatCurrency(upcomingDueData.total)} (${upcomingDueData.count} contas)
- Cofrinhos e Metas Ativas: ${cofrinhosList || 'Nenhum'}
- Gastos Invisíveis (Microgastos <= R$35): ${formatCurrency(comparativeData.totalMicroAmount)} (${comparativeData.countMicro} compras)
- Estimativa de Aposentadoria FIRE: Liberdade em ${fireSimulationData.yearsRemaining} anos e ${fireSimulationData.monthsExtra} meses (Meta FIRE: ${formatCurrency(fireSimulationData.fireTarget)})

REGRA DE LANÇAMENTO AUTOMÁTICO DE TRANSAÇÃO:
Se o casal pedir explicitamente para lançar/anotar/registrar um gasto, ganho ou aporte (ex: "Gastei 50 no mercado", "Comprei pizza 85", "Recebi 1200 de freela", "Investi 300 em ações"):
Retorne APENAS um bloco JSON no seguinte formato:
\`\`\`json
{"action": "add_transaction", "type": "saida" | "entrada" | "investimento", "amount": 00.00, "description": "nome curto", "category": "categoria_adequada", "responseMessage": "texto caloroso confirmando o lançamento"}
\`\`\`
Categorias de saída: Casa, Alimentação, Transporte, Lazer, Saúde, Educação, Assinaturas, Outros.
Entradas: Salário, Freelance, Rendimentos, Vendas.
Investimentos: Renda Fixa, Ações, Cripto, Reserva de Emergência, Fundos Imobiliários.

CASO CONTRÁRIO (perguntas, dúvidas, conselhos, análises financeiras, planejamento):
Responda de forma humanizada, direta e acolhedora (1 a 3 parágrafos diretos ao ponto com emojis).

Mensagem do casal:
"${messageToSend}"`;

            const payload = {
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 600
                }
            };

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            const rawResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawResponse) throw new Error(json.error?.message || "Sem resposta da IA");

            if (rawResponse.includes('"action"') && rawResponse.includes('"add_transaction"')) {
                const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const parsedData = JSON.parse(jsonMatch[0]);
                        const newT = {
                            id: 'tx_' + Date.now().toString(),
                            type: parsedData.type || 'saida',
                            amount: parseFloat(parsedData.amount) || 0,
                            category: parsedData.category || 'Outros',
                            date: new Date().toISOString().split('T')[0],
                            description: parsedData.description || 'Lançamento via FinBot',
                            status: 'pago',
                            accountId: 'acc_main',
                            paidBy: 'conjunto'
                        };
                        saveTransaction(newT);
                        const confirmMsg = parsedData.responseMessage || `✅ Lançamento registrado com sucesso! ${parsedData.type === 'entrada' ? 'Receita' : parsedData.type === 'investimento' ? 'Investimento' : 'Despesa'} de ${formatCurrency(parsedData.amount)} em "${parsedData.category}" (${parsedData.description}).`;
                        const botMsg = {
                            id: 'msg_bot_' + Date.now(),
                            sender: 'finbot',
                            text: confirmMsg,
                            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        };
                        setChatMessages(prev => [...prev, botMsg]);
                        return;
                    } catch (e) {
                        console.warn("Falha ao parsear JSON de transação do bot:", e);
                    }
                }
            }

            const botMsg = {
                id: 'msg_bot_' + Date.now(),
                sender: 'finbot',
                text: rawResponse,
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            };

            setChatMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error(err);
            const errorMsg = {
                id: 'msg_err_' + Date.now(),
                sender: 'finbot',
                text: 'Desculpe, tive uma oscilação na conexão com a IA. Pode perguntar novamente?',
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            };
            setChatMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsSendingChatMessage(false);
        }
    };

    // Sincronização LocalStorage para novas features
    useEffect(() => {
        localStorage.setItem('fp_fire_contribution', JSON.stringify(fireMonthlyContribution));
        localStorage.setItem('fp_fire_expense', JSON.stringify(fireMonthlyExpenseCustom));
        localStorage.setItem('fp_fire_rate', JSON.stringify(fireRealReturnRate));
        localStorage.setItem('fp_fire_age', JSON.stringify(fireCoupleAge));
    }, [fireMonthlyContribution, fireMonthlyExpenseCustom, fireRealReturnRate, fireCoupleAge]);

    useEffect(() => {
        localStorage.setItem('fp_couple_challenges', JSON.stringify(coupleChallenges));
    }, [coupleChallenges]);

    useEffect(() => {
        localStorage.setItem('fp_finbot_chat', JSON.stringify(chatMessages));
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isFinbotChatOpen]);

    // Sincronização da Moeda Selecionada
    useEffect(() => {
        globalCurrency = selectedCurrency;
        localStorage.setItem('fp_currency', JSON.stringify(selectedCurrency));
    }, [selectedCurrency]);

    // Sincronização LocalStorage para Financiamentos e Custos Veiculares
    useEffect(() => {
        localStorage.setItem('fp_financings', JSON.stringify(financings));
    }, [financings]);

    useEffect(() => {
        localStorage.setItem('fp_car_extra_costs', JSON.stringify(carExtraCosts));
    }, [carExtraCosts]);

    useEffect(() => {
        localStorage.setItem('fp_connected_cards', JSON.stringify(connectedCards));
    }, [connectedCards]);

    useEffect(() => {
        localStorage.setItem('fp_plaid_config', JSON.stringify(plaidConfig));
    }, [plaidConfig]);

    const handleSyncPlaidCard = async (cardId, explicitAccessToken) => {
        setIsSyncingPlaid(true);
        const card = connectedCards.find(c => c.id === cardId);
        const ownerName = card?.owner === 'marido' ? 'Marido' : (card?.owner === 'esposa' ? 'Esposa' : 'Conjunto');
        const token = explicitAccessToken || card?.accessToken;

        if (token) {
            try {
                const res = await fetch('/api/plaid/sync-transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_token: token,
                        owner: card?.owner || 'conjunto',
                        customClientId: plaidConfig.clientId || undefined,
                        customSecret: plaidConfig.secret || undefined,
                        customEnv: plaidConfig.environment || 'sandbox'
                    })
                });

                const data = await res.json();
                if (res.ok && data.transactions && data.transactions.length > 0) {
                    setTransactions(prev => {
                        const existingIds = new Set(prev.map(t => t.id));
                        const newOnes = data.transactions.filter(t => !existingIds.has(t.id));
                        return [...newOnes, ...prev];
                    });
                    setConnectedCards(prev => prev.map(c => c.id === cardId ? { ...c, lastSync: 'Agora mesmo' } : c));
                    showToast(`✅ ${data.transactions.length} transações sincronizadas do ${card?.institution || ''}!`);
                    setIsSyncingPlaid(false);
                    return;
                } else if (res.ok) {
                    showToast(`ℹ️ Nenhuma nova transação encontrada no ${card?.institution || 'banco'}.`);
                    setIsSyncingPlaid(false);
                    return;
                }
            } catch (err) {
                console.error("Erro na sincronização da API Plaid:", err);
            }
        }

        setIsSyncingPlaid(false);
        showToast("Configure suas chaves do Plaid na aba 'Plaid API' para sincronizar compras reais.");
    };

    const handleOpenOfficialPlaidLink = async (owner = 'marido') => {
        setIsSyncingPlaid(true);
        try {
            if (!window.Plaid) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const tokenRes = await fetch('/api/plaid/create-link-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser?.id || 'wl_user_' + Date.now(),
                    customClientId: plaidConfig.clientId || undefined,
                    customSecret: plaidConfig.secret || undefined,
                    customEnv: plaidConfig.environment || 'sandbox'
                })
            });

            const tokenData = await tokenRes.json();

            if (!tokenRes.ok || !tokenData.link_token) {
                throw new Error(tokenData.message || tokenData.error || 'Configure suas chaves do Plaid para conectar ao banco oficial.');
            }

            const handler = window.Plaid.create({
                token: tokenData.link_token,
                onSuccess: async (public_token, metadata) => {
                    showToast("Conectando ao banco seguro...");
                    try {
                        const exchangeRes = await fetch('/api/plaid/exchange-token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                public_token,
                                customClientId: plaidConfig.clientId || undefined,
                                customSecret: plaidConfig.secret || undefined,
                                customEnv: plaidConfig.environment || 'sandbox'
                            })
                        });
                        const exchangeData = await exchangeRes.json();

                        const instName = metadata.institution?.name || 'Banco Conectado';
                        const firstAcc = exchangeData.accounts?.[0] || metadata.accounts?.[0] || {};
                        const newCard = {
                            id: 'card_plaid_' + Date.now(),
                            institution: instName,
                            mask: firstAcc.mask || '••••',
                            type: firstAcc.subtype === 'credit card' ? 'credit' : 'banco',
                            owner: owner,
                            accessToken: exchangeData.access_token,
                            itemId: exchangeData.item_id,
                            balance: Number(firstAcc.balances?.current) || 0,
                            lastSync: 'Agora mesmo',
                            status: 'active',
                            logo: '💳',
                            color: 'from-blue-700 to-indigo-900'
                        };

                        setConnectedCards(prev => [...prev, newCard]);
                        setPlaidActiveTab('cards');
                        showToast(`🎉 ${instName} vinculado com sucesso!`);

                        if (exchangeData.access_token) {
                            handleSyncPlaidCard(newCard.id, exchangeData.access_token);
                        }
                    } catch (err) {
                        console.error('Erro no exchange:', err);
                        showToast("Erro ao finalizar conexão bancária.");
                    }
                },
                onExit: (err, metadata) => {
                    setIsSyncingPlaid(false);
                    if (err) console.error('Plaid Link exit with error:', err);
                }
            });

            handler.open();
        } catch (err) {
            console.error('Erro Plaid Link:', err);
            showToast(err.message || "Configure suas chaves do Plaid na aba 'Plaid API'.");
        } finally {
            setIsSyncingPlaid(false);
        }
    };

    const handleAddConnectedCard = (e) => {
        e.preventDefault();
        if (!newCardForm.institution.trim()) {
            showToast("Informe o nome do banco ou cartão.");
            return;
        }
        const colorPalette = [
            'from-blue-700 to-indigo-900',
            'from-amber-600 to-yellow-800',
            'from-emerald-700 to-teal-900',
            'from-purple-700 to-pink-900',
            'from-slate-800 to-slate-950'
        ];
        const randomColor = colorPalette[connectedCards.length % colorPalette.length];
        const newCard = {
            id: 'card_' + Date.now(),
            institution: newCardForm.institution.trim(),
            mask: newCardForm.mask.trim() || '••••',
            type: newCardForm.type,
            owner: newCardForm.owner,
            balance: Number(newCardForm.initialBalance) || 0,
            lastSync: 'Agora mesmo',
            status: 'active',
            logo: '💳',
            color: randomColor
        };
        setConnectedCards(prev => [...prev, newCard]);
        setNewCardForm({ institution: 'Chase', mask: '', type: 'credit', owner: 'marido', initialBalance: '' });
        setPlaidActiveTab('cards');
        showToast("💳 Cartão vinculado com sucesso ao sistema!");
    };

    const handleRemoveConnectedCard = (cardId) => {
        setConnectedCards(prev => prev.filter(c => c.id !== cardId));
        showToast("Cartão desvinculado.");
    };

    const handleResetAllData = async () => {
        if (!window.confirm("⚠️ ATENÇÃO: Deseja apagar todos os lançamentos, cartões, financiamentos e metas de exemplo para começar a usar o aplicativo do zero com suas informações reais?")) {
            return;
        }

        setTransactions([]);
        setRepeatingRules([]);
        setFinancings([]);
        setSavingsGoals([]);
        setShoppingItems([]);
        setConnectedCards([]);
        setMonthlyGoals({});
        setChatMessages([{
            id: 'msg_welcome_fresh',
            sender: 'bot',
            text: 'Olá! Sou o FinBot IA, seu copiloto financeiro. O aplicativo foi zerado com sucesso e está pronto para o seu dia a dia real!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setAccounts([
            { id: 'acc_main', name: 'Conta Principal', type: 'banco', color: 'from-blue-600 to-indigo-800' },
            { id: 'acc_credit', name: 'Cartão de Crédito', type: 'credito', color: 'from-rose-500 to-pink-700' },
            { id: 'acc_wallet', name: 'Carteira / Dinheiro', type: 'dinheiro', color: 'from-emerald-500 to-teal-700' }
        ]);

        localStorage.setItem('fp_transactions', JSON.stringify([]));
        localStorage.setItem('fp_rules', JSON.stringify([]));
        localStorage.setItem('fp_financings', JSON.stringify([]));
        localStorage.setItem('fp_savings_goals', JSON.stringify([]));
        localStorage.setItem('fp_shopping_items', JSON.stringify([]));
        localStorage.setItem('fp_connected_cards', JSON.stringify([]));
        localStorage.setItem('fp_goals', JSON.stringify({}));
        localStorage.setItem('fp_accounts', JSON.stringify([
            { id: 'acc_main', name: 'Conta Principal', type: 'banco', color: 'from-blue-600 to-indigo-800' },
            { id: 'acc_credit', name: 'Cartão de Crédito', type: 'credito', color: 'from-rose-500 to-pink-700' },
            { id: 'acc_wallet', name: 'Carteira / Dinheiro', type: 'dinheiro', color: 'from-emerald-500 to-teal-700' }
        ]));

        if (supabaseUser) {
            try {
                await deleteAllUserCloudData(supabaseUser.id);
                const baseAccs = [
                    { id: 'acc_main', name: 'Conta Principal', type: 'banco', color: 'from-blue-600 to-indigo-800' },
                    { id: 'acc_credit', name: 'Cartão de Crédito', type: 'credito', color: 'from-rose-500 to-pink-700' },
                    { id: 'acc_wallet', name: 'Carteira / Dinheiro', type: 'dinheiro', color: 'from-emerald-500 to-teal-700' }
                ];
                for (const acc of baseAccs) {
                    await syncUpsertAccount(acc, supabaseUser.id, activeFamilyCode);
                }
            } catch (errCloud) {
                console.error('Erro ao zerar dados na nuvem:', errCloud);
            }
        }

        showToast("✨ Aplicativo e Nuvem 100% zerados! Comece cadastrando seus dados reais.");
    };

    // 24. Custo Total do Veículo nos EUA (Total Cost of Ownership - TCO)
    const carTcoData = useMemo(() => {
        const vehicleFinancings = (financings || []).filter(f => f.type === 'veiculo' && (Number(f.totalInstallments) || 0) > (Number(f.paidInstallments) || 0));
        const totalVehicleInstallment = vehicleFinancings.reduce((acc, f) => acc + (Number(f.installmentAmount) || 0), 0);

        const insurance = Number(carExtraCosts.insurance) || 0;
        const gas = Number(carExtraCosts.gasMonthly) || 0;
        const maintenance = Number(carExtraCosts.maintenance) || 0;
        const tolls = Number(carExtraCosts.tolls) || 0;

        const monthlyTotal = totalVehicleInstallment + insurance + gas + maintenance + tolls;
        const annualTotal = monthlyTotal * 12;

        return {
            hasVehicle: vehicleFinancings.length > 0,
            vehicleCount: vehicleFinancings.length,
            installment: totalVehicleInstallment,
            insurance,
            gas,
            maintenance,
            tolls,
            monthlyTotal,
            annualTotal
        };
    }, [financings, carExtraCosts]);

    // Resumo Geral de Financiamentos
    const financingsSummary = useMemo(() => {
        const list = financings || [];
        let totalFinanced = 0;
        let totalPaid = 0;
        let totalRemaining = 0;
        let monthlyInstallmentsTotal = 0;

        list.forEach(f => {
            const installment = Number(f.installmentAmount) || 0;
            const totalInst = Number(f.totalInstallments) || 1;
            const paidInst = Math.min(totalInst, Number(f.paidInstallments) || 0);
            const remInst = Math.max(0, totalInst - paidInst);

            totalFinanced += installment * totalInst;
            totalPaid += installment * paidInst;
            totalRemaining += installment * remInst;
            if (remInst > 0) {
                monthlyInstallmentsTotal += installment;
            }
        });

        const percentPaid = totalFinanced > 0 ? Math.min(100, Math.round((totalPaid / totalFinanced) * 100)) : 0;
        return {
            list,
            totalFinanced,
            totalPaid,
            totalRemaining,
            monthlyInstallmentsTotal,
            percentPaid,
            activeCount: list.filter(f => (Number(f.totalInstallments) || 0) > (Number(f.paidInstallments) || 0)).length
        };
    }, [financings]);

    // Auto-provisionamento de parcelas de financiamento no mês ativo
    useEffect(() => {
        if (!financings || financings.length === 0) return;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        financings.forEach(fin => {
            if (!fin.autoDebit) return;
            const totalInst = Number(fin.totalInstallments) || 1;
            const paidInst = Number(fin.paidInstallments) || 0;
            if (paidInst >= totalInst) return;

            const currentInstNumber = paidInst + 1;
            const day = String(fin.dueDay || 10).padStart(2, '0');
            const monthStr = String(month + 1).padStart(2, '0');
            const targetDate = `${year}-${monthStr}-${day}`;
            const installmentTag = `(Parcela ${currentInstNumber}/${totalInst})`;

            const alreadyExists = transactions.some(t =>
                t.financingId === fin.id &&
                t.date &&
                t.date.startsWith(`${year}-${monthStr}`)
            );

            if (!alreadyExists) {
                const autoTx = {
                    id: `tx_fin_${fin.id}_${year}_${monthStr}`,
                    financingId: fin.id,
                    type: 'saida',
                    amount: Number(fin.installmentAmount) || 0,
                    category: fin.type === 'veiculo' ? 'Transporte' : (fin.type === 'imovel' ? 'Casa' : 'Outros'),
                    date: targetDate,
                    description: `${fin.title} ${installmentTag}`,
                    status: 'pago',
                    accountId: fin.accountId || 'acc_main',
                    paidBy: fin.paidBy || 'conjunto'
                };
                setTransactions(prev => [autoTx, ...prev]);
            }
        });
    }, [currentDate, financings]);

    // Handlers de Financiamentos & Contratos
    const handleSaveFinancing = (e) => {
        e.preventDefault();
        const instAmt = parseFloat(newFinancingData.installmentAmount);
        const totalInst = parseInt(newFinancingData.totalInstallments, 10);
        const paidInst = parseInt(newFinancingData.paidInstallments, 10) || 0;
        if (!newFinancingData.title.trim() || isNaN(instAmt) || instAmt <= 0 || isNaN(totalInst) || totalInst <= 0) {
            showToast("Preencha o título, valor da parcela e total de parcelas válidos.");
            return;
        }

        const newFin = {
            id: 'fin_' + Date.now(),
            title: newFinancingData.title.trim(),
            type: newFinancingData.type || 'veiculo',
            installmentAmount: instAmt,
            totalInstallments: totalInst,
            paidInstallments: Math.min(totalInst, paidInst),
            dueDay: parseInt(newFinancingData.dueDay, 10) || 10,
            accountId: newFinancingData.accountId || 'acc_main',
            paidBy: newFinancingData.paidBy || 'conjunto',
            interestRateAnnual: parseFloat(newFinancingData.interestRateAnnual) || null,
            startDate: new Date().toISOString().split('T')[0],
            icon: newFinancingData.icon || (newFinancingData.type === 'imovel' ? '🏠' : (newFinancingData.type === 'veiculo' ? '🚗' : '💳')),
            autoDebit: true
        };

        setFinancings(prev => [newFin, ...prev]);
        setNewFinancingData({
            title: '',
            type: 'veiculo',
            installmentAmount: '',
            totalInstallments: '',
            paidInstallments: '0',
            dueDay: '10',
            accountId: 'acc_main',
            paidBy: 'conjunto',
            interestRateAnnual: '',
            icon: '🚗',
            autoDebit: true
        });
        setIsFinancingModalOpen(false);
        showToast(`🚗 Financiamento "${newFin.title}" cadastrado com sucesso!`);
    };

    const handleDeleteFinancing = (id) => {
        if (window.confirm("Deseja realmente remover este financiamento?")) {
            setFinancings(prev => prev.filter(f => f.id !== id));
            showToast("Financiamento removido.");
        }
    };

    const handlePrepayInstallment = (financingId, count = 1) => {
        setFinancings(prev => prev.map(f => {
            if (f.id === financingId) {
                const currentPaid = Number(f.paidInstallments) || 0;
                const total = Number(f.totalInstallments) || 1;
                const newPaid = Math.min(total, currentPaid + count);
                const remaining = total - newPaid;

                const amortTx = {
                    id: 'tx_amort_' + Date.now(),
                    type: 'saida',
                    amount: (Number(f.installmentAmount) || 0) * count,
                    category: f.type === 'veiculo' ? 'Transporte' : (f.type === 'imovel' ? 'Casa' : 'Outros'),
                    date: new Date().toISOString().split('T')[0],
                    description: `⚡ Amortização ${f.title} (${count} ${count > 1 ? 'parcelas antecipadas' : 'parcela antecipada'})`,
                    status: 'pago',
                    accountId: f.accountId || 'acc_main',
                    paidBy: f.paidBy || 'conjunto'
                };
                setTransactions(tPrev => [amortTx, ...tPrev]);

                showToast(`🎉 ${count} parcela(s) amortizada(s) com sucesso! Restam ${remaining} parcelas.`);
                return {
                    ...f,
                    paidInstallments: newPaid
                };
            }
            return f;
        }));
        setIsAmortizationModalOpen(false);
    };

    const handleAnalyzeContractWithAI = async () => {
        if (!contractTextInput.trim() && !contractFileBase64) {
            showToast("Envie um PDF, foto do contrato ou cole o texto.");
            return;
        }
        if (!geminiApiKey.trim()) {
            showToast("Configure sua chave Gemini no FinBot primeiro.");
            setIsApiKeyModalOpen(true);
            return;
        }

        setIsAnalyzingContract(true);
        setContractAnalysisResult(null);

        try {
            const promptInstruction = `Você é um perito financeiro especialista em contratos bancários, cédulas de crédito (CCB) e financiamentos de veículos e imóveis.
Analise detalhadamente o documento anexado (PDF ou imagem) ou texto deste contrato e retorne OBRIGATORIAMENTE um objeto JSON com as seguintes chaves numéricas e textuais:
{
  "institution": "Nome do Banco ou Financeira",
  "asset": "Descrição do Bem (ex: Veículo Honda Civic ou Imóvel)",
  "type": "veiculo",
  "installmentAmount": 1250.00,
  "totalInstallments": 48,
  "paidInstallments": 14,
  "remainingInstallments": 34,
  "dueDay": 10,
  "interestRateMonthly": 1.45,
  "interestRateAnnual": 18.9,
  "cetAnnual": 21.5,
  "totalFinanced": 45000.00,
  "totalToPay": 60000.00,
  "totalInterestPayable": 15000.00,
  "amortizationSavingsTips": "Dica prática de quanto o casal economiza adiantando parcelas de trás para frente.",
  "summaryText": "Diagnóstico do contrato e avaliação das taxas em 2 parágrafos."
}`;

            let parts = [];
            if (contractFileBase64) {
                const base64Data = contractFileBase64.split(',')[1] || contractFileBase64;
                const mime = contractFileMimeType || (contractFileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
                parts.push({
                    inlineData: {
                        mimeType: mime,
                        data: base64Data
                    }
                });
            }
            if (contractTextInput.trim()) {
                parts.push({ text: `Dados/Texto Adicional do Contrato:\n${contractTextInput.trim()}` });
            }
            parts.push({ text: promptInstruction });

            const payload = {
                contents: [{ parts }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 4096,
                    responseMimeType: "application/json"
                }
            };

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error(json.error?.message || "Sem resposta da IA");

            let cleanText = rawText.trim();
            cleanText = cleanText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                cleanText = cleanText.slice(firstBrace, lastBrace + 1);
            }

            let parsed;
            try {
                parsed = JSON.parse(cleanText);
            } catch (parseErr) {
                console.warn("Falha no JSON.parse direto, construindo objeto seguro:", parseErr);
                parsed = {
                    institution: "Financeira / Banco",
                    asset: "Financiamento",
                    type: "veiculo",
                    installmentAmount: 0,
                    totalInstallments: 48,
                    paidInstallments: 0,
                    remainingInstallments: 48,
                    dueDay: 10,
                    interestRateMonthly: 1.5,
                    interestRateAnnual: 19.5,
                    cetAnnual: 22.0,
                    totalFinanced: 0,
                    totalToPay: 0,
                    totalInterestPayable: 0,
                    amortizationSavingsTips: "A amortização extraordinária de parcelas finais reduz significativamente os juros do contrato.",
                    summaryText: rawText
                };
            }

            setContractAnalysisResult(parsed);
            showToast("📄 Contrato analisado com sucesso pelo FinBot IA!");
        } catch (err) {
            console.error(err);
            showToast("Erro ao analisar contrato: " + (err.message || "Tente novamente"));
        } finally {
            setIsAnalyzingContract(false);
        }
    };

    const handleApplyContractAnalysisToForm = () => {
        if (!contractAnalysisResult) return;
        setNewFinancingData({
            title: contractAnalysisResult.asset || contractAnalysisResult.institution || 'Financiamento Veículo',
            type: contractAnalysisResult.type || 'veiculo',
            installmentAmount: contractAnalysisResult.installmentAmount ? String(contractAnalysisResult.installmentAmount) : '',
            totalInstallments: contractAnalysisResult.totalInstallments ? String(contractAnalysisResult.totalInstallments) : '48',
            paidInstallments: contractAnalysisResult.paidInstallments ? String(contractAnalysisResult.paidInstallments) : '0',
            dueDay: contractAnalysisResult.dueDay ? String(contractAnalysisResult.dueDay) : '10',
            accountId: 'acc_main',
            paidBy: 'conjunto',
            interestRateAnnual: contractAnalysisResult.interestRateAnnual ? String(contractAnalysisResult.interestRateAnnual) : '',
            icon: contractAnalysisResult.type === 'imovel' ? '🏠' : (contractAnalysisResult.type === 'veiculo' ? '🚗' : '💳'),
            autoDebit: true
        });
        setIsContractAnalysisModalOpen(false);
        setIsFinancingModalOpen(true);
        showToast("Dados do contrato preenchidos automaticamente no formulário!");
    };

    // Handlers para Cofrinhos & Sonhos do Casal
    const handleSaveSavingsGoal = (e) => {
        e.preventDefault();
        const targetAmt = parseFloat(newGoalData.targetAmount);
        const currentAmt = parseFloat(newGoalData.currentAmount) || 0;
        if (!newGoalData.title.trim() || isNaN(targetAmt) || targetAmt <= 0) {
            showToast("Preencha o título e um valor alvo válido.");
            return;
        }

        const newGoal = {
            id: 'sg_' + Date.now(),
            title: newGoalData.title.trim(),
            targetAmount: targetAmt,
            currentAmount: currentAmt,
            deadline: newGoalData.deadline || null,
            icon: newGoalData.icon || '🎯',
            color: newGoalData.color || 'from-blue-600 to-indigo-600'
        };

        setSavingsGoals(prev => [newGoal, ...prev]);
        if (supabaseUser) {
            syncUpsertSavingsGoal(newGoal, supabaseUser.id, activeFamilyCode);
        }
        setNewGoalData({ title: '', targetAmount: '', currentAmount: '0', deadline: '', icon: '🎯', color: 'from-blue-600 to-indigo-600' });
        setIsSavingsModalOpen(false);
        showToast("Novo cofrinho criado com sucesso!");
    };

    const handleDepositToSavingsGoal = (e) => {
        e.preventDefault();
        if (!selectedSavingsGoal) return;
        const val = parseFloat(savingsDepositInput);
        if (isNaN(val) || val <= 0) {
            showToast("Digite um valor válido.");
            return;
        }

        const delta = depositActionType === 'withdraw' ? -val : val;
        const updatedGoal = {
            ...selectedSavingsGoal,
            currentAmount: Math.max(0, (selectedSavingsGoal.currentAmount || 0) + delta)
        };

        setSavingsGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        if (supabaseUser) {
            syncUpsertSavingsGoal(updatedGoal, supabaseUser.id, activeFamilyCode);
        }
        setIsDepositModalOpen(false);
        setSavingsDepositInput('');
        showToast(depositActionType === 'withdraw' ? `Resgate de ${formatCurrency(val)} realizado!` : `Depósito de ${formatCurrency(val)} guardado no cofrinho! 🎉`);
    };

    const handleDeleteSavingsGoal = (id) => {
        setSavingsGoals(prev => prev.filter(g => g.id !== id));
        if (supabaseUser) {
            syncDeleteSavingsGoal(id, supabaseUser.id);
        }
        showToast("Cofrinho removido.");
    };

    // Handlers para Lista de Mercado Compartilhada
    const handleAddShoppingItem = (e) => {
        e.preventDefault();
        if (!newShopItem.name.trim()) return;

        const newItem = {
            id: 'shop_' + Date.now(),
            name: newShopItem.name.trim(),
            quantity: newShopItem.quantity || '1 un',
            estimatedPrice: parseFloat(newShopItem.estimatedPrice) || 0,
            completed: false,
            category: newShopItem.category || 'Geral',
            addedBy: newShopItem.addedBy || 'conjunto'
        };

        setShoppingItems(prev => [newItem, ...prev]);
        if (supabaseUser) {
            syncUpsertShoppingItem(newItem, supabaseUser.id, activeFamilyCode);
        }
        setNewShopItem({ name: '', quantity: '1 un', estimatedPrice: '', category: 'Geral', addedBy: 'conjunto' });
        showToast(`"${newItem.name}" adicionado à lista!`);
    };

    const handleToggleShoppingItem = (id) => {
        setShoppingItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, completed: !item.completed };
                if (supabaseUser) {
                    syncUpsertShoppingItem(updated, supabaseUser.id, activeFamilyCode);
                }
                return updated;
            }
            return item;
        }));
        if (navigator.vibrate) {
            try { navigator.vibrate(15); } catch (e) { }
        }
    };

    const handleDeleteShoppingItem = (id) => {
        setShoppingItems(prev => prev.filter(i => i.id !== id));
        if (supabaseUser) {
            syncDeleteShoppingItem(id, supabaseUser.id);
        }
    };

    const handleCheckoutShoppingToTransactions = () => {
        const totalSpent = shoppingItems.reduce((acc, curr) => acc + (curr.estimatedPrice || 0), 0);
        setIsShoppingModalOpen(false);
        setFormData({
            type: 'saida',
            amount: totalSpent > 0 ? totalSpent.toString() : '',
            category: 'Alimentação',
            date: new Date().toISOString().split('T')[0],
            description: `Compras de Supermercado (${shoppingItems.length} itens)`,
            status: 'pago',
            isRepeating: false,
            accountId: 'acc_main',
            paidBy: 'conjunto'
        });
        setIsFormOpen(true);
    };

    // Handler para Diagnóstico Mensal com IA (Gemini 3.6 Flash)
    const handleGenerateAiDiagnosis = async () => {
        if (!geminiApiKey.trim()) {
            showToast("Configure sua chave Gemini no FinBot primeiro.");
            setIsApiKeyModalOpen(true);
            return;
        }

        setIsGeneratingDiagnosis(true);
        setIsAiDiagnosisOpen(true);
        try {
            const currentMonthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            const promptText = `Você é o FinBot, consultor financeiro pessoal e do casal. Analise os seguintes dados do mês de ${currentMonthName} e gere um diagnóstico completo, elegante, direto, profissional e acolhedor em Português (moeda atual: ${globalCurrency}):
- Total Receitas: ${formatCurrency(totals.receitas)}
- Total Despesas: ${formatCurrency(totals.despesas)}
- Total Investimentos: ${formatCurrency(totals.investimentos)}
- Saldo Líquido do Mês: ${formatCurrency(totals.receitas - totals.despesas)}
- Taxa de Poupança: ${totals.receitas > 0 ? (((totals.receitas - totals.despesas) / totals.receitas) * 100).toFixed(1) : 0}%
- Top Categorias de Gastos: ${(analysisData.data || []).slice(0, 5).map(c => `${c.name}: ${formatCurrency(c.amount)} (${c.percentage.toFixed(1)}%)`).join(', ')}
- Cofrinhos e Metas do Casal: ${savingsGoals.map(g => `${g.title}: ${formatCurrency(g.currentAmount)} de ${formatCurrency(g.targetAmount)}`).join(', ')}

Estruture a resposta com tópicos claros usando emojis:
1. 🏆 **Destaques & Conquistas do Casal** (aproveitamento do orçamento e percentual guardado)
2. ⚠️ **Pontos de Atenção** (gastos mais elevados e onde economizar)
3. 💡 **3 Ações Práticas para o Próximo Mês**
4. 🎯 **Evolução dos Cofrinhos & Sonhos**`;

            const payload = {
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.3 }
            };

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (!res.ok || json.error) {
                throw new Error(json.error?.message || `Erro ${res.status}`);
            }

            const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "Diagnóstico gerado com sucesso!";
            setAiDiagnosisText(text);
        } catch (err) {
            console.error(err);
            setAiDiagnosisText(`Erro ao gerar diagnóstico: ${err.message || 'Verifique a chave Gemini.'}`);
        } finally {
            setIsGeneratingDiagnosis(false);
        }
    };

    // =========================================================================
    // 2. DIVISÃO & ACERTO DE CONTAS DO CASAL E GRUPO
    // =========================================================================
    const coupleSplitData = useMemo(() => {
        const expenses = monthlyTransactions.filter(t => t.type === 'saida' && t.status === 'pago');

        let totalMarido = 0;
        let totalEsposa = 0;
        let totalConjunto = 0;

        expenses.forEach(t => {
            const paidBy = t.paidBy || 'conjunto';
            if (paidBy === 'marido') totalMarido += t.amount;
            else if (paidBy === 'esposa') totalEsposa += t.amount;
            else totalConjunto += t.amount;
        });

        const totalIndividual = totalMarido + totalEsposa;
        const totalGeral = totalIndividual + totalConjunto;

        const diff = totalMarido - totalEsposa;
        let settlementText = '';
        let whoOwesWho = 'balanced'; // 'esposa_owes_marido' | 'marido_owes_esposa' | 'balanced'
        let settlementAmount = 0;

        if (diff > 0.01) {
            whoOwesWho = 'esposa_owes_marido';
            settlementAmount = diff / 2;
            settlementText = `A Esposa deve transferir ${formatCurrency(settlementAmount)} para Você para equilibrar os gastos 50/50.`;
        } else if (diff < -0.01) {
            whoOwesWho = 'marido_owes_esposa';
            settlementAmount = Math.abs(diff) / 2;
            settlementText = `Você deve transferir ${formatCurrency(settlementAmount)} para a Esposa para equilibrar os gastos 50/50.`;
        } else {
            settlementText = `Os gastos individuais estão perfeitamente equilibrados!`;
        }

        const pctMarido = totalIndividual > 0 ? (totalMarido / totalIndividual) * 100 : 50;
        const pctEsposa = totalIndividual > 0 ? (totalEsposa / totalIndividual) * 100 : 50;

        return {
            totalMarido,
            totalEsposa,
            totalConjunto,
            totalIndividual,
            totalGeral,
            pctMarido,
            pctEsposa,
            settlementAmount,
            whoOwesWho,
            settlementText,
            expenses
        };
    }, [monthlyTransactions]);

    const handleRegisterSettlement = () => {
        if (coupleSplitData.settlementAmount <= 0) {
            showToast("As contas já estão equilibradas!");
            return;
        }

        const isMaridoReceiving = coupleSplitData.whoOwesWho === 'esposa_owes_marido';
        const payer = isMaridoReceiving ? 'Esposa' : 'Você';
        const receiver = isMaridoReceiving ? 'Você' : 'Esposa';

        setFormData({
            type: isMaridoReceiving ? 'entrada' : 'saida',
            amount: coupleSplitData.settlementAmount.toFixed(2),
            category: 'Outros',
            date: new Date().toISOString().split('T')[0],
            description: `Acerto de Contas do Casal (${payer} → ${receiver})`,
            status: 'pago',
            isRepeating: false,
            accountId: 'acc_main',
            paidBy: 'conjunto'
        });
        setIsFormOpen(true);
    };

    const handleCopySettlementSummary = () => {
        const currentMonthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const text = `📊 *Balanço do Casal - ${currentMonthName}*\n\n` +
            `👦 *Você pagou:* ${formatCurrency(coupleSplitData.totalMarido)} (${coupleSplitData.pctMarido.toFixed(0)}%)\n` +
            `👧 *Esposa pagou:* ${formatCurrency(coupleSplitData.totalEsposa)} (${coupleSplitData.pctEsposa.toFixed(0)}%)\n` +
            `👥 *Conta Conjunta:* ${formatCurrency(coupleSplitData.totalConjunto)}\n` +
            `💳 *Total Individual:* ${formatCurrency(coupleSplitData.totalIndividual)}\n\n` +
            `⚖️ *Acerto 50/50:* ${coupleSplitData.settlementText}`;

        navigator.clipboard.writeText(text);
        showToast("Resumo do acerto copiado para o WhatsApp!");
    };

    // =========================================================================
    // 1. LANÇAMENTO POR VOZ / ÁUDIO UNIVERSAL COM GEMINI IA
    // =========================================================================
    // =========================================================================
    // 1. LANÇAMENTO POR VOZ / ÁUDIO COM WEBAUDIO (100% COMPATÍVEL COM IPHONE/PWA/ANDROID)
    // =========================================================================
    const handleStartVoiceRecording = async () => {
        if (!geminiApiKey.trim()) {
            showToast("Configure sua chave Gemini no FinBot primeiro.");
            setIsApiKeyModalOpen(true);
            return;
        }

        setVoiceTranscript('');
        setIsVoiceModalOpen(true);
        setRecordingSeconds(0);

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                showToast("Áudio não suportado neste navegador.");
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            audioBuffersRef.current = [];

            const audioCtx = new AudioContextClass();
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            audioSourceRef.current = source;

            // Buffer size 4096 para captura limpa e leve
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            audioProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                audioBuffersRef.current.push(new Float32Array(inputData));
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);

            setIsListeningVoice(true);

            // Timer de contagem
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = setInterval(() => {
                setRecordingSeconds(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Erro ao acessar microfone:', err);
            setIsListeningVoice(false);
            showToast("Permissão de microfone negada. Libere nas configurações do Safari!");
        }
    };

    const handleStopVoiceRecording = async () => {
        setIsListeningVoice(false);
        clearInterval(recordingTimerRef.current);

        try {
            if (audioProcessorRef.current) {
                audioProcessorRef.current.disconnect();
                audioProcessorRef.current = null;
            }
            if (audioSourceRef.current) {
                audioSourceRef.current.disconnect();
                audioSourceRef.current = null;
            }
            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach(t => t.stop());
                audioStreamRef.current = null;
            }

            const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }

            const flattened = flattenFloatBuffers(audioBuffersRef.current);
            if (flattened.length === 0) {
                showToast("Nenhum som detectado. Tente falar novamente.");
                return;
            }

            // Downsample para 16kHz WAV mono (ótimo para voz e super leve para o Gemini)
            const targetRate = 16000;
            const downsampled = downsampleFloatBuffer(flattened, sampleRate, targetRate);
            const wavBlob = encodeFloatToWAV(downsampled, targetRate);

            await processAudioBlobWithAI(wavBlob);
        } catch (e) {
            console.error('Erro ao finalizar áudio:', e);
            showToast("Erro ao processar gravação de voz.");
        }
    };

    const processAudioBlobWithAI = async (audioBlob) => {
        setIsProcessingVoice(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const reader = new FileReader();

            const base64Data = await new Promise((resolve, reject) => {
                reader.onloadend = () => {
                    const result = reader.result;
                    const base64 = typeof result === 'string' && result.includes(',') ? result.split(',')[1] : result;
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(audioBlob);
            });

            const mimeType = (audioBlob.type || 'audio/webm').split(';')[0];

            const prompt = `Ouça o áudio gravado em português do Brasil e extraia os dados para lançamento financeiro.

Categorias disponíveis:
- Saída: Casa, Alimentação, Transporte, Lazer, Saúde, Educação, Assinaturas, Outros
- Entrada: Salário, Freelance, Rendimentos, Vendas, Outros
- Investimento: Renda Fixa, Ações, Cripto, Reserva de Emergência, Fundos Imobiliários

Contas disponíveis:
- acc_main (Conta Principal / Banco / Pix / Débito)
- acc_wallet (Dinheiro Físico / Carteira)
- acc_credit (Cartão de Crédito)

Responda ESTRITAMENTE um objeto JSON no formato:
{
  "type": "saida" | "entrada" | "investimento",
  "amount": number (ex: 45.50),
  "category": string (uma das categorias acima),
  "description": string (descrição concisa e limpa),
  "date": "YYYY-MM-DD" (use ${todayStr} se não especificada outra data),
  "paidBy": "marido" | "esposa" | "conjunto",
  "accountId": "acc_main" | "acc_wallet" | "acc_credit",
  "transcription": string (o que a pessoa falou no áudio)
}`;

            const payload = {
                contents: [{
                    parts: [
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        },
                        { text: prompt }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    response_mime_type: "application/json"
                }
            };

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error(json.error?.message || "IA não retornou resposta do áudio");

            const parsed = JSON.parse(rawText);
            setVoiceTranscript(parsed.transcription || '');

            setFormData({
                type: parsed.type || 'saida',
                amount: parsed.amount ? String(parsed.amount) : '',
                category: parsed.category || 'Outros',
                date: parsed.date || todayStr,
                description: parsed.description || parsed.transcription || 'Lançamento por Voz',
                status: 'pago',
                isRepeating: false,
                accountId: parsed.accountId || 'acc_main',
                paidBy: parsed.paidBy || 'conjunto'
            });

            setIsVoiceModalOpen(false);
            setIsFormOpen(true);
            showToast(`Entendido por Voz: ${parsed.description || 'Lançamento'} (${formatCurrency(parsed.amount)})!`);
        } catch (err) {
            console.error(err);
            showToast("Erro ao processar áudio: " + (err.message || 'tente falar novamente'));
        } finally {
            setIsProcessingVoice(false);
        }
    };

    const processVoiceExpenseWithAI = async (spokenText) => {
        if (!geminiApiKey.trim()) {
            showToast("Configure sua chave Gemini no FinBot primeiro.");
            setIsApiKeyModalOpen(true);
            return;
        }

        setIsProcessingVoice(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const prompt = `Analise a seguinte frase falada pelo usuário para registrar um lançamento financeiro:
"${spokenText}"

Categorias disponíveis:
- Saída: Casa, Alimentação, Transporte, Lazer, Saúde, Educação, Assinaturas, Outros
- Entrada: Salário, Freelance, Rendimentos, Vendas, Outros
- Investimento: Renda Fixa, Ações, Cripto, Reserva de Emergência, Fundos Imobiliários

Contas disponíveis:
- acc_main (Conta Principal / Banco / Pix / Débito)
- acc_wallet (Dinheiro Físico / Carteira)
- acc_credit (Cartão de Crédito)

Responda ESTRITAMENTE um objeto JSON no formato:
{
  "type": "saida" | "entrada" | "investimento",
  "amount": number (ex: 45.50),
  "category": string (uma das categorias acima),
  "description": string (descrição concisa e limpa),
  "date": "YYYY-MM-DD" (use ${todayStr} se não especificada outra data),
  "paidBy": "marido" | "esposa" | "conjunto",
  "accountId": "acc_main" | "acc_wallet" | "acc_credit"
}`;

            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    response_mime_type: "application/json"
                }
            };

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error("IA não retornou resposta");

            const parsed = JSON.parse(rawText);

            setFormData({
                type: parsed.type || 'saida',
                amount: parsed.amount ? String(parsed.amount) : '',
                category: parsed.category || 'Outros',
                date: parsed.date || todayStr,
                description: parsed.description || spokenText,
                status: 'pago',
                isRepeating: false,
                accountId: parsed.accountId || 'acc_main',
                paidBy: parsed.paidBy || 'conjunto'
            });

            setIsVoiceModalOpen(false);
            setIsFormOpen(true);
            showToast(`Entendido por Voz: ${parsed.description || 'Lançamento'} (${formatCurrency(parsed.amount)})!`);
        } catch (err) {
            console.error(err);
            showToast("Erro ao processar frase: " + (err.message || 'tente novamente'));
        } finally {
            setIsProcessingVoice(false);
        }
    };

    // =========================================================================
    // 3. CONQUISTAS & MEDALHAS DO CASAL (GAMIFICAÇÃO FINANCEIRA)
    // =========================================================================
    const coupleAchievements = useMemo(() => {
        const totalTxs = transactions.length;
        const hasGoals = savingsGoals.length > 0;
        const totalSavedInGoals = savingsGoals.reduce((acc, g) => acc + (g.currentAmount || 0), 0);
        const totalInvestedOverall = transactions.filter(t => t.type === 'investimento').reduce((acc, t) => acc + t.amount, 0);
        const totalSavingsPlusInvestments = totalSavedInGoals + totalInvestedOverall;

        const overdueBillsCount = monthlyTransactions.filter(t => t.type === 'saida' && t.status === 'pendente' && new Date(t.date + 'T12:00:00') < new Date()).length;
        const hasCompletedShopping = shoppingItems.some(i => i.completed);

        const hasHusbandExpense = monthlyTransactions.some(t => t.paidBy === 'marido');
        const hasWifeExpense = monthlyTransactions.some(t => t.paidBy === 'esposa');
        const hasCoupleSync = hasHusbandExpense && hasWifeExpense;

        const currentIncome = monthlySummary.receitas;
        const currentExpense = monthlySummary.despesas;
        const currentSavingsRate = currentIncome > 0 ? Math.max(0, ((currentIncome - currentExpense) / currentIncome) * 100) : 0;
        const isSuperSaver = currentSavingsRate >= 20;

        const hasInvestedThisMonth = monthlySummary.investimentos > 0;
        const isPositiveBalance = monthlySummary.saldoLiquido > 0;

        const badges = [
            {
                id: 'b1',
                title: 'Primeiro Passo',
                desc: 'Registrar pelo menos 5 lançamentos no app.',
                icon: '🚀',
                color: 'from-blue-500 to-indigo-600',
                unlocked: totalTxs >= 5,
                progress: Math.min(100, Math.round((totalTxs / 5) * 100)),
                progressLabel: `${Math.min(totalTxs, 5)}/5 lançamentos`
            },
            {
                id: 'b2',
                title: 'Sonhadores Focados',
                desc: 'Criar o primeiro Cofrinho do Casal.',
                icon: '🎯',
                color: 'from-amber-500 to-orange-600',
                unlocked: hasGoals,
                progress: hasGoals ? 100 : 0,
                progressLabel: hasGoals ? '1 cofrinho criado' : '0/1 cofrinho'
            },
            {
                id: 'b3',
                title: 'Blindagem Financeira',
                desc: 'Acumular mais de R$ 3.000 em cofrinhos ou investimentos.',
                icon: '🛡️',
                color: 'from-emerald-500 to-teal-700',
                unlocked: totalSavingsPlusInvestments >= 3000,
                progress: Math.min(100, Math.round((totalSavingsPlusInvestments / 3000) * 100)),
                progressLabel: `${formatCurrency(totalSavingsPlusInvestments)} / ${formatCurrency(3000)}`
            },
            {
                id: 'b4',
                title: 'Pontualidade Anti-Juros',
                desc: 'Sem nenhuma conta pendente em atraso neste mês.',
                icon: '⚡',
                color: 'from-yellow-400 to-amber-600',
                unlocked: overdueBillsCount === 0 && monthlyTransactions.length > 0,
                progress: overdueBillsCount === 0 ? 100 : 0,
                progressLabel: overdueBillsCount === 0 ? '100% em dia' : `${overdueBillsCount} conta(s) em atraso`
            },
            {
                id: 'b5',
                title: 'Mestres do Mercado',
                desc: 'Concluir compras na lista compartilhada.',
                icon: '🛒',
                color: 'from-purple-500 to-pink-600',
                unlocked: hasCompletedShopping,
                progress: hasCompletedShopping ? 100 : 0,
                progressLabel: hasCompletedShopping ? 'Itens comprados' : 'Nenhum item marcado'
            },
            {
                id: 'b6',
                title: 'Sintonia do Casal',
                desc: 'Marido e Esposa com lançamentos ativos no mesmo mês.',
                icon: '💖',
                color: 'from-rose-500 to-pink-600',
                unlocked: hasCoupleSync,
                progress: (hasHusbandExpense ? 50 : 0) + (hasWifeExpense ? 50 : 0),
                progressLabel: hasCoupleSync ? 'Os dois lançando juntos!' : hasHusbandExpense ? 'Apenas Marido lançou' : hasWifeExpense ? 'Apenas Esposa lançou' : 'Nenhum lançamento'
            },
            {
                id: 'b7',
                title: 'Super Poupadores',
                desc: 'Economizar mais de 20% da renda no mês atual.',
                icon: '💰',
                color: 'from-green-500 to-emerald-700',
                unlocked: isSuperSaver,
                progress: Math.min(100, Math.round((currentSavingsRate / 20) * 100)),
                progressLabel: `${currentSavingsRate.toFixed(1)}% economizado (meta: 20%)`
            },
            {
                id: 'b8',
                title: 'Investidores Inteligentes',
                desc: 'Fazer aportes em investimentos neste mês.',
                icon: '📈',
                color: 'from-indigo-600 to-blue-700',
                unlocked: hasInvestedThisMonth,
                progress: hasInvestedThisMonth ? 100 : 0,
                progressLabel: hasInvestedThisMonth ? `Aportado: ${formatCurrency(monthlySummary.investimentos)}` : 'R$ 0 aportados'
            },
            {
                id: 'b9',
                title: 'Casal no Azul',
                desc: 'Fechar o mês com saldo líquido positivo.',
                icon: '👑',
                color: 'from-cyan-500 to-blue-600',
                unlocked: isPositiveBalance,
                progress: isPositiveBalance ? 100 : 0,
                progressLabel: isPositiveBalance ? `Saldo: +${formatCurrency(monthlySummary.saldoLiquido)}` : 'Saldo negativo'
            }
        ];

        const unlockedCount = badges.filter(b => b.unlocked).length;
        const totalBadges = badges.length;
        const levelScore = Math.min(10, Math.max(1, Math.floor((unlockedCount / totalBadges) * 10)));

        let levelTitle = 'Iniciantes';
        if (unlockedCount >= 8) levelTitle = 'Casal Mestre das Finanças 👑';
        else if (unlockedCount >= 6) levelTitle = 'Casal Investidor & Blindado 💎';
        else if (unlockedCount >= 4) levelTitle = 'Casal Organizado & Focado 🌟';
        else if (unlockedCount >= 2) levelTitle = 'Casal em Evolução 🚀';

        return {
            badges,
            unlockedCount,
            totalBadges,
            levelScore,
            levelTitle,
            percentComplete: Math.round((unlockedCount / totalBadges) * 100)
        };
    }, [transactions, savingsGoals, shoppingItems, monthlyTransactions, monthlySummary]);

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

    // Função para calcular vigência, meses restantes e status de contas fixas / contratos
    const getRuleValidity = (rule) => {
        if (!rule.durationMonths || Number(rule.durationMonths) <= 0 || !rule.startDate) {
            return {
                isIndefinite: true,
                text: 'Recorrência Contínua (Sem data final)',
                shortText: 'Indeterminado',
                remainingMonths: null,
                isExpired: false,
                isExpiringSoon: false,
                progressPercent: 100
            };
        }

        const [sYear, sMonth] = rule.startDate.split('-').map(Number);
        const dur = Number(rule.durationMonths);
        
        // Data final
        const endMonthIndex = (sMonth - 1) + dur - 1;
        const endYear = sYear + Math.floor(endMonthIndex / 12);
        const endMonthNormalized = (endMonthIndex % 12) + 1;
        const endDateObj = new Date(endYear, endMonthNormalized - 1, 1);
        const endMonthStr = endDateObj.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });

        // Mês atual
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;

        const elapsedMonths = (curYear - sYear) * 12 + (curMonth - sMonth);
        const remainingMonths = dur - elapsedMonths;

        const progressPercent = Math.min(100, Math.max(0, Math.round(((elapsedMonths + 1) / dur) * 100)));

        if (remainingMonths <= 0) {
            return {
                isIndefinite: false,
                text: `Expirou em ${endMonthStr}`,
                shortText: 'Expirado',
                remainingMonths: 0,
                isExpired: true,
                isExpiringSoon: false,
                endMonthStr,
                progressPercent: 100
            };
        } else if (remainingMonths === 1) {
            return {
                isIndefinite: false,
                text: `Vence neste mês (${endMonthStr})!`,
                shortText: 'Vence este mês',
                remainingMonths: 1,
                isExpired: false,
                isExpiringSoon: true,
                endMonthStr,
                progressPercent
            };
        } else {
            return {
                isIndefinite: false,
                text: `Restam ${remainingMonths} meses (Até ${endMonthStr})`,
                shortText: `${remainingMonths} meses rest.`,
                remainingMonths,
                isExpired: false,
                isExpiringSoon: false,
                endMonthStr,
                progressPercent
            };
        }
    };

    const assinaturasAtivas = repeatingRules.filter(r => r.type === 'saida');
    const gastoMensalAssinaturas = assinaturasAtivas.reduce((acc, r) => acc + (r.amount || 0), 0);
    const gastoAnualAssinaturas = gastoMensalAssinaturas * 12;

    const futureProjectionData = useMemo(() => {
        const currentTotalBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0);
        let cumulativeBalance = currentTotalBalance;

        return Array.from({ length: 6 }).map((_, i) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 1);
            const projYear = date.getFullYear();
            const projMonth = date.getMonth() + 1; // 1-12

            const ganhoMensal = repeatingRules.filter(r => {
                if (r.type !== 'entrada') return false;
                if (!r.durationMonths || Number(r.durationMonths) <= 0 || !r.startDate) return true;
                const [sY, sM] = r.startDate.split('-').map(Number);
                const diff = (projYear - sY) * 12 + (projMonth - sM);
                return diff >= 0 && diff < Number(r.durationMonths);
            }).reduce((a, b) => a + (b.amount || 0), 0) || totals.receitas;

            const gastoMensal = repeatingRules.filter(r => {
                if (r.type !== 'saida') return false;
                if (!r.durationMonths || Number(r.durationMonths) <= 0 || !r.startDate) return true;
                const [sY, sM] = r.startDate.split('-').map(Number);
                const diff = (projYear - sY) * 12 + (projMonth - sM);
                return diff >= 0 && diff < Number(r.durationMonths);
            }).reduce((a, b) => a + (b.amount || 0), 0) || totals.despesas;

            const netMensal = ganhoMensal - gastoMensal;
            cumulativeBalance += netMensal;

            return {
                month: date.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
                balance: cumulativeBalance,
                isNegative: cumulativeBalance < 0
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
            syncUpsertTransaction(tData, supabaseUser.id, activeFamilyCode, supabaseUser.email);
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
            syncUpsertRule(rData, supabaseUser.id, activeFamilyCode);
        }
    };

    const deleteRule = (ruleId) => {
        setRepeatingRules(prev => prev.filter(r => r.id !== ruleId));

        if (supabaseUser) {
            syncDeleteRule(ruleId, supabaseUser.id);
        }
    };

    const handleSaveFixedBill = (e) => {
        e.preventDefault();
        const amt = parseFloat(fixedBillForm.amount);
        if (isNaN(amt) || amt <= 0 || !fixedBillForm.description.trim()) {
            showToast('Informe um valor válido e uma descrição.');
            return;
        }

        const isFixed = fixedBillForm.durationMode === 'fixed';
        const durMonths = isFixed ? (parseInt(fixedBillForm.durationMonths, 10) || 4) : null;
        const startMonthStr = fixedBillForm.startMonth || new Date().toISOString().slice(0, 7);
        const startDate = `${startMonthStr}-01`;

        let endDate = null;
        if (isFixed && durMonths) {
            const [sYear, sMonth] = startMonthStr.split('-').map(Number);
            const endMonthIndex = (sMonth - 1) + durMonths - 1;
            const endYear = sYear + Math.floor(endMonthIndex / 12);
            const endMonthNorm = (endMonthIndex % 12) + 1;
            const padMonth = String(endMonthNorm).padStart(2, '0');
            endDate = `${endYear}-${padMonth}-01`;
        }

        const ruleId = fixedBillForm.id || ('rule_' + Date.now().toString());
        const ruleData = {
            id: ruleId,
            type: fixedBillForm.type,
            amount: amt,
            category: fixedBillForm.category,
            description: fixedBillForm.description.trim(),
            day: parseInt(fixedBillForm.day, 10) || 1,
            accountId: fixedBillForm.accountId || 'acc_main',
            paidBy: fixedBillForm.paidBy || 'conjunto',
            durationMonths: durMonths,
            startDate: startDate,
            endDate: endDate
        };

        saveRule(ruleData);
        setIsFixedBillsModalOpen(false);
        setFixedBillEditing(null);
        showToast(fixedBillForm.id ? 'Conta fixa atualizada!' : 'Conta fixa cadastrada com sucesso!');
    };

    const handleRenewFixedBill = (e) => {
        e.preventDefault();
        if (!renewingBill) return;

        const newAmt = parseFloat(renewFormData.newAmount);
        const extendMonths = parseInt(renewFormData.extendMonths, 10) || 4;

        if (isNaN(newAmt) || newAmt <= 0) {
            showToast('Informe o valor da renovação.');
            return;
        }

        const now = new Date();
        const startMonthStr = now.toISOString().slice(0, 7);
        const startDate = `${startMonthStr}-01`;

        const [sYear, sMonth] = startMonthStr.split('-').map(Number);
        const endMonthIndex = (sMonth - 1) + extendMonths - 1;
        const endYear = sYear + Math.floor(endMonthIndex / 12);
        const endMonthNorm = (endMonthIndex % 12) + 1;
        const padMonth = String(endMonthNorm).padStart(2, '0');
        const endDate = `${endYear}-${padMonth}-01`;

        const updatedRule = {
            ...renewingBill,
            amount: newAmt,
            durationMonths: extendMonths,
            startDate: startDate,
            endDate: endDate
        };

        saveRule(updatedRule);
        setIsRenewModalOpen(false);
        setRenewingBill(null);
        showToast(`🎉 Contrato de ${renewingBill.description} renovado por mais ${extendMonths} meses!`);
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
                accountId: formData.accountId,
                paidBy: formData.paidBy || existing?.paidBy || 'conjunto'
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
                accountId: formData.accountId,
                paidBy: formData.paidBy || 'conjunto'
            };

            if (formData.isRepeating) {
                const ruleId = 'rule_' + Date.now().toString();
                newT.isFromRepeatRule = ruleId;

                const isFixed = formData.repeatDurationMode === 'fixed';
                const durMonths = isFixed ? (parseInt(formData.repeatDurationMonths, 10) || 4) : null;
                const startMonthStr = formData.date.slice(0, 7);
                const startDate = `${startMonthStr}-01`;
                let endDate = null;
                if (isFixed && durMonths) {
                    const [sYear, sMonth] = startMonthStr.split('-').map(Number);
                    const endMonthIndex = (sMonth - 1) + durMonths - 1;
                    const endYear = sYear + Math.floor(endMonthIndex / 12);
                    const endMonthNorm = (endMonthIndex % 12) + 1;
                    const padMonth = String(endMonthNorm).padStart(2, '0');
                    endDate = `${endYear}-${padMonth}-01`;
                }

                const newRule = {
                    id: ruleId,
                    type: formData.type,
                    amount: amt,
                    category: formData.category,
                    description: formData.description.trim(),
                    day: new Date(formData.date + 'T12:00:00').getDate(),
                    accountId: formData.accountId,
                    paidBy: formData.paidBy || 'conjunto',
                    durationMonths: durMonths,
                    startDate: startDate,
                    endDate: endDate
                };
                saveRule(newRule);
            }

            saveTransaction(newT);
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
            const headers = ["Data", "Tipo", "Categoria", "Descrição", "Valor ($)", "Estado", "Conta"];
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
            repeatDurationMode: 'indefinite',
            repeatDurationMonths: '4',
            accountId: 'acc_main',
            paidBy: 'conjunto'
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
            accountId: transaction.accountId || 'acc_main',
            paidBy: transaction.paidBy || 'conjunto'
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

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey.trim()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const json = await res.json();
                if (!res.ok || json.error) {
                    throw new Error(json.error?.message || `Erro ${res.status}`);
                }

                const replyText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                const jsonMatch = replyText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error("Não foi possível identificar os dados no recibo.");
                }

                const data = JSON.parse(jsonMatch[0]);

                setFormData(prev => ({
                    ...prev,
                    type: 'saida',
                    amount: data.amount ? data.amount.toString() : prev.amount,
                    description: data.description || prev.description,
                    category: data.category || 'Alimentação'
                }));
                showToast(`Recibo lido: ${data.description || ''} (${formatCurrency(data.amount || 0)})!`);
            } catch (err) {
                console.error(err);
                showToast("Erro ao processar recibo: " + (err.message || 'tente uma foto mais nítida.'));
            }
            setIsScanningReceipt(false);
        };
    };

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
                                onClick={() => {
                                    setFixedBillEditing(null);
                                    setFixedBillForm({
                                        id: '',
                                        type: 'saida',
                                        amount: '',
                                        category: 'Casa',
                                        description: '',
                                        day: '1',
                                        accountId: 'acc_main',
                                        paidBy: 'conjunto',
                                        durationMode: 'indefinite',
                                        durationMonths: '4',
                                        startMonth: new Date().toISOString().slice(0, 7)
                                    });
                                    setIsFixedBillsModalOpen(true);
                                }}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-amber-500" /> Contas Fixas & Contratos
                                </div>
                                {repeatingRules.length > 0 && <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-600 px-2 py-0.5 rounded-full font-extrabold">{repeatingRules.length}</span>}
                            </button>

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

                            <button
                                onClick={handleResetAllData}
                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            >
                                <Trash2 size={16} className="text-rose-500" /> Zerar Dados & Começar do Zero
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
                                    <button
                                        onClick={handleStartVoiceRecording}
                                        className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-xs font-bold flex items-center justify-center transition backdrop-blur-md border border-white/20 animate-pulse"
                                        title="Lançar por Voz com IA"
                                    >
                                        <Mic size={17} className="text-amber-300" />
                                    </button>
                                    <button
                                        onClick={() => setIsShoppingModalOpen(true)}
                                        className="relative p-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-xs font-bold flex items-center justify-center transition backdrop-blur-md border border-white/20"
                                        title="Lista de Compras / Mercado"
                                    >
                                        <ShoppingCart size={17} />
                                        {pendingShoppingCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                                                {pendingShoppingCount}
                                            </span>
                                        )}
                                    </button>
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
                                {/* Botão Falar com IA Desktop */}
                                <button
                                    onClick={handleStartVoiceRecording}
                                    className="hidden sm:flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border border-white/20 transition shadow-sm text-white"
                                    title="Lançar por Comando de Voz"
                                >
                                    <Mic size={16} className="text-amber-300" /> Falar com IA
                                </button>

                                {/* Botão Relatório PDF Desktop */}
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="hidden md:flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border border-white/20 transition shadow-sm text-white"
                                    title="Relatório Executivo PDF / Impressão"
                                >
                                    <FileDown size={16} className="text-emerald-300" /> Relatório PDF
                                </button>

                                {/* Botão Lista de Mercado Desktop */}
                                <button
                                    onClick={() => setIsShoppingModalOpen(true)}
                                    className="hidden sm:flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border border-white/20 transition shadow-sm relative"
                                    title="Lista de Compras Compartilhada"
                                >
                                    <ShoppingCart size={16} /> Lista de Mercado
                                    {pendingShoppingCount > 0 && (
                                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                            {pendingShoppingCount}
                                        </span>
                                    )}
                                </button>

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
                                        onClick={() => { setShowProfileMenu(false); setIsPinModalOpen(true); }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Lock size={16} className={appPin ? "text-emerald-500" : "text-slate-400"} />
                                            Bloqueio com PIN
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${appPin ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            {appPin ? 'Ativo' : 'Desativado'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => { setShowProfileMenu(false); setIsFamilyModalOpen(true); }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Heart size={16} className={activeFamilyCode ? "text-pink-500" : "text-slate-400"} />
                                            Modo Casal & Família
                                        </span>
                                        {activeFamilyCode && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-pink-100 dark:bg-pink-950 text-pink-600">
                                                Conectado
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setShowProfileMenu(false); setIsShoppingModalOpen(true); }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <span className="flex items-center gap-2">
                                            <ShoppingCart size={16} className="text-amber-500" />
                                            Lista de Mercado
                                        </span>
                                        {pendingShoppingCount > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-600">
                                                {pendingShoppingCount} itens
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setShowProfileMenu(false); setIsSavingsModalOpen(true); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <PiggyBank size={16} className="text-amber-500" /> Cofrinhos & Sonhos
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            setFixedBillEditing(null);
                                            setFixedBillForm({
                                                id: '',
                                                type: 'saida',
                                                amount: '',
                                                category: 'Casa',
                                                description: '',
                                                day: '1',
                                                accountId: 'acc_main',
                                                paidBy: 'conjunto',
                                                durationMode: 'indefinite',
                                                durationMonths: '4',
                                                startMonth: new Date().toISOString().slice(0, 7)
                                            });
                                            setIsFixedBillsModalOpen(true);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Clock size={16} className="text-amber-500" /> Contas Fixas & Contratos
                                        </span>
                                        {repeatingRules.length > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-600">
                                                {repeatingRules.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setShowProfileMenu(false); setIsCategoryManagerOpen(true); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <Tag size={16} className="text-blue-500" /> Categorias
                                    </button>
                                    <button
                                        onClick={() => { setShowProfileMenu(false); setApiKeyInput(geminiApiKey); setIsApiKeyModalOpen(true); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <Key size={16} className="text-indigo-500" /> Chave Gemini IA
                                    </button>
                                </div>

                                {/* SELETOR DE MOEDA (USD vs BRL) */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 px-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Moeda do App</span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCurrency('USD');
                                                showToast("Moeda alterada para Dólar Americano ($ USD)");
                                            }}
                                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${selectedCurrency === 'USD' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            🇺🇸 Dólar ($)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCurrency('BRL');
                                                showToast("Moeda alterada para Real Brasileiro (R$ BRL)");
                                            }}
                                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${selectedCurrency === 'BRL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            🇧🇷 Real (R$)
                                        </button>
                                    </div>
                                </div>

                                {/* RESET / COMEÇAR DO ZERO */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => { setShowProfileMenu(false); handleResetAllData(); }}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition"
                                    >
                                        <Trash2 size={15} /> Zerar Dados & Começar do Zero
                                    </button>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* CORPO DO DASHBOARD / TELAS */}
                    <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 -mt-12 lg:-mt-4">

                        {/* BANNER DE CONTAS A VENCER NO TOPO (ANTI-JUROS - ARRASTAR PARA DISPENSAR) */}
                        {!isDueBannerDismissed && upcomingDueBills.length > 0 && (
                            <div
                                onTouchStart={e => {
                                    bannerTouchStartX.current = e.touches[0].clientX;
                                    setIsDraggingBanner(true);
                                }}
                                onTouchMove={e => {
                                    const deltaX = e.touches[0].clientX - bannerTouchStartX.current;
                                    setBannerSwipeX(deltaX);
                                }}
                                onTouchEnd={() => {
                                    setIsDraggingBanner(false);
                                    if (Math.abs(bannerSwipeX) > 75) {
                                        setBannerSwipeX(bannerSwipeX > 0 ? 500 : -500);
                                        setTimeout(() => {
                                            setIsDueBannerDismissed(true);
                                            setBannerSwipeX(0);
                                        }, 200);
                                    } else {
                                        setBannerSwipeX(0);
                                    }
                                }}
                                onMouseDown={e => {
                                    bannerTouchStartX.current = e.clientX;
                                    setIsDraggingBanner(true);
                                }}
                                onMouseMove={e => {
                                    if (!isDraggingBanner) return;
                                    const deltaX = e.clientX - bannerTouchStartX.current;
                                    setBannerSwipeX(deltaX);
                                }}
                                onMouseUp={() => {
                                    if (!isDraggingBanner) return;
                                    setIsDraggingBanner(false);
                                    if (Math.abs(bannerSwipeX) > 75) {
                                        setBannerSwipeX(bannerSwipeX > 0 ? 500 : -500);
                                        setTimeout(() => {
                                            setIsDueBannerDismissed(true);
                                            setBannerSwipeX(0);
                                        }, 200);
                                    } else {
                                        setBannerSwipeX(0);
                                    }
                                }}
                                onMouseLeave={() => {
                                    if (isDraggingBanner) {
                                        setIsDraggingBanner(false);
                                        setBannerSwipeX(0);
                                    }
                                }}
                                style={{
                                    transform: `translateX(${bannerSwipeX}px)`,
                                    opacity: isDraggingBanner ? Math.max(0.1, 1 - Math.abs(bannerSwipeX) / 200) : (bannerSwipeX !== 0 ? 0 : 1),
                                    transition: isDraggingBanner ? 'none' : 'transform 0.22s ease-out, opacity 0.22s ease-out'
                                }}
                                className="mb-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl shadow-indigo-950/20 rounded-3xl p-4 flex items-center justify-between gap-3 backdrop-blur-xl cursor-grab active:cursor-grabbing select-none relative overflow-hidden"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25 pointer-events-none">
                                        <Bell size={20} className="animate-pulse" />
                                    </div>
                                    <div className="pointer-events-none">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs sm:text-sm font-black text-white tracking-tight">Lembrete de Vencimento</span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                {upcomingDueBills.length} {upcomingDueBills.length === 1 ? 'conta' : 'contas'} • {formatCurrency(totalUpcomingDue)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] sm:text-xs text-slate-300/90 font-medium mt-0.5">
                                            Contas com vencimento nos próximos 7 dias para você manter seu fluxo em dia.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] font-bold text-slate-400 hidden sm:inline-block">
                                        ↔ Arraste para dispensar
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDueBannerDismissed(true);
                                        }}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition"
                                        title="Dispensar aviso"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

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
                                            <div className="flex flex-wrap justify-between items-center gap-2 mb-3 px-1">
                                                <div>
                                                    <h3 className="text-base font-black text-slate-800 dark:text-white">Minhas Contas & Cartões</h3>
                                                    <span className="text-xs font-bold text-slate-400">{accounts.length} contas configuradas</span>
                                                </div>
                                                <button
                                                    onClick={() => setIsPlaidModalOpen(true)}
                                                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 active:scale-95"
                                                >
                                                    <Zap size={14} className="text-amber-300" /> 💳 Sincronizar Cartões EUA
                                                </button>
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
                                                                            {transaction.paidBy && transaction.paidBy !== 'conjunto' && (
                                                                                <>
                                                                                    <span>•</span>
                                                                                    <span className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] ${transaction.paidBy === 'marido' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300'}`}>
                                                                                        {transaction.paidBy === 'marido' ? '👦 Você' : '👧 Esposa'}
                                                                                    </span>
                                                                                </>
                                                                            )}
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

                                        {/* CARD DE COFRINHOS & SONHOS DO CASAL */}
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800/80">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                        <PiggyBank size={18} className="text-amber-500" /> Cofrinhos & Sonhos do Casal
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400 font-medium">Metas e economias conjuntas</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsSavingsModalOpen(true)}
                                                    className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 py-1.5 px-2.5 rounded-xl transition flex items-center gap-1"
                                                >
                                                    <Plus size={13} /> Novo
                                                </button>
                                            </div>

                                            {/* BANNER ROUND-UP (POUPANÇA AUTOMÁTICA DE TROCO / ACORNS) */}
                                            <div className="mb-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-amber-500/30">
                                                        🪙
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-slate-800 dark:text-white">Troco Automático (Round-Up)</span>
                                                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white">Efeito Acorns</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                                                            <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(roundUpData.totalMonthly)}</strong> em centavos de {roundUpData.eligibleCount} compras • Projeção: <span className="font-bold">{formatCurrency(roundUpData.projectedAnnual)}/ano</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                {savingsGoals.length > 0 && (
                                                    <button
                                                        type="button"
                                                        disabled={roundUpData.totalMonthly <= 0}
                                                        onClick={() => handleDepositRoundUp(savingsGoals[0]?.id)}
                                                        className="w-full sm:w-auto px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                                                    >
                                                        📥 Guardar {formatCurrency(roundUpData.totalMonthly)}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                {savingsGoals.length === 0 ? (
                                                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                                        Nenhum cofrinho criado ainda. Clique em "+ Novo" para planejar uma viagem, reserva ou sonho a dois!
                                                    </div>
                                                ) : (
                                                    savingsGoals.map(goal => {
                                                        const percent = Math.min(100, Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100));
                                                        const remaining = Math.max(0, (goal.targetAmount || 0) - (goal.currentAmount || 0));

                                                        return (
                                                            <div
                                                                key={goal.id}
                                                                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition hover:border-amber-200 dark:hover:border-amber-900/50 group"
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xl">{goal.icon || '🎯'}</span>
                                                                        <div>
                                                                            <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">{goal.title}</h4>
                                                                            <p className="text-[10px] text-slate-400">
                                                                                Meta: {formatCurrency(goal.targetAmount)} {goal.deadline ? `• até ${new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(goal.currentAmount)}</span>
                                                                        <span className="text-[10px] font-black text-amber-500 block">{percent}%</span>
                                                                    </div>
                                                                </div>

                                                                {/* Barra de Progresso */}
                                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2.5">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${goal.color || 'from-amber-500 to-orange-500'}`}
                                                                        style={{ width: `${percent}%` }}
                                                                    ></div>
                                                                </div>

                                                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
                                                                    <span className="text-slate-400 font-medium">
                                                                        {remaining === 0 ? '🎉 Meta Conquistada!' : `Faltam ${formatCurrency(remaining)}`}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <button
                                                                            onClick={() => { setSelectedSavingsGoal(goal); setDepositActionType('deposit'); setSavingsDepositInput(''); setIsDepositModalOpen(true); }}
                                                                            className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-black hover:bg-emerald-200 transition"
                                                                        >
                                                                            + Guardar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setSelectedSavingsGoal(goal); setDepositActionType('withdraw'); setSavingsDepositInput(''); setIsDepositModalOpen(true); }}
                                                                            className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black hover:bg-slate-300 transition"
                                                                        >
                                                                            Resgatar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteSavingsGoal(goal.id)}
                                                                            className="p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                                                                            title="Excluir Cofrinho"
                                                                        >
                                                                            <Trash2 size={12} />
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

                                </div>
                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* ABA 2: ANÁLISE / METAS / PREVISÃO */}
                        {/* ========================================================= */}
                        {activeTab === 'analise' && (
                            <div className="animate-in fade-in duration-300 space-y-6">
                                {/* BANNER DE DIAGNÓSTICO INTELIGENTE COM IA */}
                                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
                                            <Sparkles size={24} className="text-amber-300 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black tracking-tight">Diagnóstico Mensal do Casal com FinBot IA</h3>
                                            <p className="text-xs text-blue-100 font-medium">Análise executiva de fluxo, metas e dicas práticas com IA para o casal</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerateAiDiagnosis}
                                        disabled={isGeneratingDiagnosis}
                                        className="w-full sm:w-auto px-5 py-3 bg-white text-slate-900 font-black text-xs rounded-2xl shadow-md hover:bg-blue-50 transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
                                    >
                                        {isGeneratingDiagnosis ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin text-blue-600" /> Analisando Finanças...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} className="text-amber-500" /> Gerar Diagnóstico com IA
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                                    <button
                                        onClick={() => setAnalysisView('mes')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'mes' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <PieChart size={14} /> Resumo do Mês
                                    </button>
                                    <button
                                        onClick={() => setAnalysisView('comparativo')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'comparativo' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <BarChart3 size={14} /> Comparativo & Gastos Invisíveis
                                    </button>
                                    <button
                                        onClick={() => setAnalysisView('liberdade')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'liberdade' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Rocket size={14} className="text-amber-400" /> Liberdade FIRE
                                    </button>
                                    <button
                                        onClick={() => setAnalysisView('desafios')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'desafios' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Flame size={14} className="text-orange-400" /> Desafios ({coupleChallenges.filter(c => c.status === 'concluido').length}/{coupleChallenges.length})
                                    </button>
                                    <button
                                        onClick={() => setAnalysisView('divisao')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'divisao' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Scale size={14} /> Divisão do Casal
                                    </button>
                                    <button
                                        onClick={() => setAnalysisView('conquistas')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'conquistas' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Trophy size={14} className="text-amber-400" /> Conquistas ({coupleAchievements.unlockedCount}/{coupleAchievements.totalBadges})
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
                                    <button
                                        onClick={() => setAnalysisView('financiamentos')}
                                        className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 ${analysisView === 'financiamentos' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <Car size={14} className="text-blue-400" /> Financiamentos & Dívidas ({financingsSummary.activeCount})
                                    </button>
                                    <button
                                        onClick={() => setIsFinbotChatOpen(true)}
                                        className="px-4 py-2.5 text-xs font-black rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-700 hover:to-indigo-700 active:scale-95"
                                    >
                                        <Bot size={14} className="text-amber-300" /> Chat FinBot IA
                                    </button>
                                    <button
                                        onClick={() => setIsReportModalOpen(true)}
                                        className="px-4 py-2.5 text-xs font-black rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md hover:from-emerald-700 hover:to-teal-800 active:scale-95 ml-auto"
                                    >
                                        <FileDown size={14} /> Relatório PDF
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
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                                <span className="text-[11px] font-black uppercase text-slate-400 block mb-1">Gasto Mensal Fixo</span>
                                                <h3 className="text-2xl font-black text-rose-500">{formatCurrency(gastoMensalAssinaturas)}</h3>
                                                <p className="text-xs text-slate-400 mt-1">Saindo todo mês de forma automática</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                                <span className="text-[11px] font-black uppercase text-slate-400 block mb-1">Custo Anual Projetado</span>
                                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(gastoAnualAssinaturas)}</h3>
                                                <p className="text-xs text-slate-400 mt-1">Impacto anual no orçamento familiar</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 shadow-lg text-white flex flex-col justify-between">
                                                <div>
                                                    <span className="text-[11px] font-black uppercase text-amber-200 block mb-1">Contas & Contratos</span>
                                                    <h3 className="text-2xl font-black">{repeatingRules.length} cadastradas</h3>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setFixedBillEditing(null);
                                                        setFixedBillForm({
                                                            id: '',
                                                            type: 'saida',
                                                            amount: '',
                                                            category: 'Casa',
                                                            description: '',
                                                            day: '1',
                                                            accountId: 'acc_main',
                                                            paidBy: 'conjunto',
                                                            durationMode: 'indefinite',
                                                            durationMonths: '4',
                                                            startMonth: new Date().toISOString().slice(0, 7)
                                                        });
                                                        setIsFixedBillsModalOpen(true);
                                                    }}
                                                    className="mt-3 w-full bg-white text-slate-900 hover:bg-amber-50 font-black py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus size={14} /> Nova Conta / Contrato
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h3 className="text-base font-black text-slate-800 dark:text-white">Contas Fixas & Contratos com Vigência</h3>
                                                    <p className="text-xs text-slate-400">Gerencie aluguéis, seguros com tempo determinado e assinaturas</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setFixedBillEditing(null);
                                                        setFixedBillForm({
                                                            id: '',
                                                            type: 'saida',
                                                            amount: '',
                                                            category: 'Casa',
                                                            description: '',
                                                            day: '1',
                                                            accountId: 'acc_main',
                                                            paidBy: 'conjunto',
                                                            durationMode: 'indefinite',
                                                            durationMonths: '4',
                                                            startMonth: new Date().toISOString().slice(0, 7)
                                                        });
                                                        setIsFixedBillsModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                                                >
                                                    <Plus size={14} /> Adicionar
                                                </button>
                                            </div>

                                            {repeatingRules.length === 0 ? (
                                                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                                    <Clock size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                                    <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">Nenhuma conta fixa ou contrato cadastrado</p>
                                                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">Cadastre seu aluguel contínuo, seguro do carro com vigência de 4 meses ou assinaturas de serviços.</p>
                                                    <button
                                                        onClick={() => {
                                                            setFixedBillEditing(null);
                                                            setFixedBillForm({
                                                                id: '',
                                                                type: 'saida',
                                                                amount: '',
                                                                category: 'Casa',
                                                                description: '',
                                                                day: '1',
                                                                accountId: 'acc_main',
                                                                paidBy: 'conjunto',
                                                                durationMode: 'indefinite',
                                                                durationMonths: '4',
                                                                startMonth: new Date().toISOString().slice(0, 7)
                                                            });
                                                            setIsFixedBillsModalOpen(true);
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
                                                    >
                                                        Cadastrar Primeira Conta Fixa
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {repeatingRules.map(r => {
                                                        const validity = getRuleValidity(r);
                                                        const isExpiring = validity.isExpiringSoon;
                                                        const isExpired = validity.isExpired;

                                                        return (
                                                            <div
                                                                key={r.id}
                                                                className={`p-5 rounded-2xl border transition-all ${
                                                                    isExpiring
                                                                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 ring-2 ring-amber-400/20'
                                                                        : isExpired
                                                                        ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-75'
                                                                        : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 shadow-sm'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300">
                                                                            {getCategoryIcon(r.category)}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">{r.description}</h4>
                                                                            <span className="text-[11px] text-slate-400 font-medium">Vence todo dia {r.day} • {r.category}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className={`font-black text-base ${r.type === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                            {r.type === 'entrada' ? '+' : '-'}{formatCurrency(r.amount)}
                                                                        </p>
                                                                        <span className="text-[10px] uppercase font-bold text-slate-400">
                                                                            {r.paidBy === 'marido' ? '👦 Marido' : (r.paidBy === 'esposa' ? '👧 Esposa' : '👥 Casal')}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Status de Vigência / Duração */}
                                                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 text-xs">
                                                                    <div className="flex justify-between items-center mb-1.5">
                                                                        <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                                                            {validity.isIndefinite ? (
                                                                                <><span>♾️</span> <span>Recorrência Contínua</span></>
                                                                            ) : isExpiring ? (
                                                                                <><span className="text-amber-500 animate-pulse">⚠️</span> <span className="text-amber-600 dark:text-amber-400 font-extrabold">{validity.text}</span></>
                                                                            ) : isExpired ? (
                                                                                <><span className="text-rose-500">🛑</span> <span className="text-rose-500 font-extrabold">{validity.text}</span></>
                                                                            ) : (
                                                                                <><span>⏳</span> <span className="text-blue-600 dark:text-blue-400 font-extrabold">{validity.text}</span></>
                                                                            )}
                                                                        </span>
                                                                        {!validity.isIndefinite && (
                                                                            <span className="text-[10px] font-mono text-slate-400">{r.durationMonths} meses total</span>
                                                                        )}
                                                                    </div>
                                                                    {!validity.isIndefinite && (
                                                                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-500 ${isExpiring ? 'bg-amber-500' : isExpired ? 'bg-rose-500' : 'bg-blue-600'}`}
                                                                                style={{ width: `${validity.progressPercent}%` }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Ações: Renovar, Editar, Excluir */}
                                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                                    {!validity.isIndefinite ? (
                                                                        <button
                                                                            onClick={() => {
                                                                                setRenewingBill(r);
                                                                                setRenewFormData({
                                                                                    newAmount: r.amount.toString(),
                                                                                    extendMonths: (r.durationMonths || 4).toString()
                                                                                });
                                                                                setIsRenewModalOpen(true);
                                                                            }}
                                                                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                                                                                isExpiring || isExpired
                                                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                                                                                    : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400'
                                                                            }`}
                                                                        >
                                                                            <RotateCcw size={13} /> Renovar Contrato
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-[11px] text-slate-400 font-medium">Sem data de expiração</span>
                                                                    )}

                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                setFixedBillEditing(r.id);
                                                                                setFixedBillForm({
                                                                                    id: r.id,
                                                                                    type: r.type,
                                                                                    amount: r.amount.toString(),
                                                                                    category: r.category,
                                                                                    description: r.description,
                                                                                    day: (r.day || 1).toString(),
                                                                                    accountId: r.accountId || 'acc_main',
                                                                                    paidBy: r.paidBy || 'conjunto',
                                                                                    durationMode: r.durationMonths ? 'fixed' : 'indefinite',
                                                                                    durationMonths: (r.durationMonths || 4).toString(),
                                                                                    startMonth: r.startDate ? r.startDate.slice(0, 7) : new Date().toISOString().slice(0, 7)
                                                                                });
                                                                                setIsFixedBillsModalOpen(true);
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition"
                                                                            title="Editar"
                                                                        >
                                                                            <Edit2 size={15} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (window.confirm(`Deseja remover a conta fixa "${r.description}"?`)) {
                                                                                    deleteRule(r.id);
                                                                                    showToast("Conta fixa removida com sucesso!");
                                                                                }
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition"
                                                                            title="Excluir"
                                                                        >
                                                                            <Trash2 size={15} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
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

                                {/* VISUALIZAÇÃO: DIVISÃO DO CASAL & GRUPO */}
                                {analysisView === 'divisao' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* CARDS DE TOTAL POR PESSOA */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-md">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-black uppercase tracking-wider text-blue-200">👦 Pago por Você</span>
                                                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{coupleSplitData.pctMarido.toFixed(0)}%</span>
                                                </div>
                                                <h3 className="text-2xl font-black">{formatCurrency(coupleSplitData.totalMarido)}</h3>
                                                <p className="text-[11px] text-blue-100 mt-1">Lançamentos individuais do marido</p>
                                            </div>

                                            <div className="bg-gradient-to-br from-rose-600 to-pink-700 rounded-3xl p-5 text-white shadow-md">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-black uppercase tracking-wider text-rose-200">👧 Pago pela Esposa</span>
                                                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{coupleSplitData.pctEsposa.toFixed(0)}%</span>
                                                </div>
                                                <h3 className="text-2xl font-black">{formatCurrency(coupleSplitData.totalEsposa)}</h3>
                                                <p className="text-[11px] text-rose-100 mt-1">Lançamentos individuais da esposa</p>
                                            </div>

                                            <div className="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-3xl p-5 text-white shadow-md">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-black uppercase tracking-wider text-purple-200">👥 Conta Conjunta</span>
                                                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">Casal</span>
                                                </div>
                                                <h3 className="text-2xl font-black">{formatCurrency(coupleSplitData.totalConjunto)}</h3>
                                                <p className="text-[11px] text-purple-100 mt-1">Gastos diretos do casal</p>
                                            </div>
                                        </div>

                                        {/* CARD PRINCIPAL DE ACERTO 50/50 */}
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                        <Scale size={20} className="text-indigo-600 dark:text-indigo-400" /> Balanço & Acerto de Contas (50% / 50%)
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-medium">Equilíbrio automático entre o que você e sua esposa pagaram individualmente</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleCopySettlementSummary}
                                                        className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95"
                                                    >
                                                        <Share2 size={14} /> Copiar Resumo
                                                    </button>
                                                    {coupleSplitData.settlementAmount > 0 && (
                                                        <button
                                                            onClick={handleRegisterSettlement}
                                                            className="px-4 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md"
                                                        >
                                                            💸 Fazer Acerto
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Barra Visual de Proporção */}
                                            <div>
                                                <div className="flex justify-between text-xs font-black mb-2">
                                                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">👦 Você: {coupleSplitData.pctMarido.toFixed(1)}%</span>
                                                    <span className="text-slate-400 font-bold">Meta 50/50</span>
                                                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">👧 Esposa: {coupleSplitData.pctEsposa.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                                    <div style={{ width: `${coupleSplitData.pctMarido}%` }} className="bg-blue-600 h-full transition-all duration-700"></div>
                                                    <div style={{ width: `${coupleSplitData.pctEsposa}%` }} className="bg-rose-500 h-full transition-all duration-700"></div>
                                                </div>
                                            </div>

                                            {/* Mensagem de Veredito / Acerto */}
                                            <div className={`p-4 rounded-2xl border ${coupleSplitData.whoOwesWho === 'balanced' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200' : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'} flex items-start gap-3`}>
                                                <div className="w-8 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 flex items-center justify-center shrink-0">
                                                    <Scale size={18} className="text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-wider mb-0.5">Diagnóstico do Acerto</h4>
                                                    <p className="text-sm font-bold">{coupleSplitData.settlementText}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* DETALHAMENTO DE DESPESAS POR QUEM PAGOU */}
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4">Despesas deste Mês por Quem Pagou</h3>
                                            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                                                {coupleSplitData.expenses.length === 0 ? (
                                                    <p className="text-center py-6 text-slate-400 text-xs font-medium">Nenhuma despesa paga registrada neste mês.</p>
                                                ) : (
                                                    coupleSplitData.expenses.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-500 shadow-sm">
                                                                    {getCategoryIcon(t.category)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-800 dark:text-white">{t.description || t.category}</p>
                                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                                                                        <span>{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                                                        <span>•</span>
                                                                        <span className={`px-1.5 py-0.2 rounded-md font-bold ${t.paidBy === 'marido' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300' : t.paidBy === 'esposa' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'}`}>
                                                                            {t.paidBy === 'marido' ? '👦 Você' : t.paidBy === 'esposa' ? '👧 Esposa' : '👥 Conjunto'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs font-black text-rose-500">-{formatCurrency(t.amount)}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VISUALIZAÇÃO: CONQUISTAS & MEDALHAS DO CASAL */}
                                {analysisView === 'conquistas' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* BANNER DE NÍVEL & SCORE DO CASAL */}
                                        <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                                            <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none">
                                                <Trophy size={180} />
                                            </div>
                                            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
                                                        🏆
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-200 bg-white/15 px-2.5 py-0.5 rounded-full">
                                                            Gamificação do Casal
                                                        </span>
                                                        <h2 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">{coupleAchievements.levelTitle}</h2>
                                                        <p className="text-xs text-amber-100 font-medium mt-0.5">
                                                            {coupleAchievements.unlockedCount} de {coupleAchievements.totalBadges} conquistas financeiras desbloqueadas ({coupleAchievements.percentComplete}%)
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-56 bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shrink-0">
                                                    <div className="flex justify-between text-xs font-black mb-1.5">
                                                        <span>Progresso Geral</span>
                                                        <span>{coupleAchievements.percentComplete}%</span>
                                                    </div>
                                                    <div className="w-full bg-black/30 h-2.5 rounded-full overflow-hidden">
                                                        <div className="bg-gradient-to-r from-amber-300 to-yellow-200 h-full rounded-full transition-all duration-700" style={{ width: `${coupleAchievements.percentComplete}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* GRADE DE CONQUISTAS E MEDALHAS */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {coupleAchievements.badges.map(badge => (
                                                <div
                                                    key={badge.id}
                                                    className={`rounded-3xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${badge.unlocked
                                                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                                                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/60 dark:border-slate-800/40 opacity-75'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${badge.unlocked ? `bg-gradient-to-br ${badge.color} text-white shadow-md` : 'bg-slate-200 dark:bg-slate-800 text-slate-400 grayscale'}`}>
                                                                {badge.icon}
                                                            </div>
                                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${badge.unlocked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                                                {badge.unlocked ? <><CheckCircle2 size={12} /> Conquistada</> : <><Lock size={12} /> Bloqueada</>}
                                                            </span>
                                                        </div>

                                                        <h3 className={`text-base font-black ${badge.unlocked ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{badge.title}</h3>
                                                        <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{badge.desc}</p>
                                                    </div>

                                                    {/* Barra de Progresso da Conquista */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                                        <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                                                            <span>Status</span>
                                                            <span className={badge.unlocked ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>{badge.progressLabel}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${badge.unlocked ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} style={{ width: `${badge.progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {analysisView === 'comparativo' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* BANNER DE CABEÇALHO COMPARATIVO */}
                                        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BarChart3 className="text-blue-300" size={20} />
                                                    <span className="text-xs font-black uppercase tracking-wider text-blue-200">Raio-X Evolutivo</span>
                                                </div>
                                                <h3 className="text-xl font-black tracking-tight">
                                                    {currentDate.toLocaleString('pt-BR', { month: 'long' })} vs {comparativeData.prevDate.toLocaleString('pt-BR', { month: 'long' })}
                                                </h3>
                                                <p className="text-xs text-blue-100/80 font-medium">
                                                    Acompanhe se suas despesas e receitas aumentaram ou diminuíram em relação ao mês anterior.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 ${comparativeData.diffDespesas <= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                    }`}>
                                                    {comparativeData.diffDespesas <= 0 ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                                                    {comparativeData.diffDespesas <= 0
                                                        ? `Economia de ${formatCurrency(Math.abs(comparativeData.diffDespesas))} nas despesas`
                                                        : `Despesas subiram ${formatCurrency(comparativeData.diffDespesas)}`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* CARDS COMPARATIVOS MÊS A MÊS */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {/* Card Receitas */}
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
                                                    <span>Receitas Totais</span>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${comparativeData.diffReceitas >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'}`}>
                                                        {comparativeData.diffReceitas >= 0 ? `+${comparativeData.pctReceitas.toFixed(0)}%` : `${comparativeData.pctReceitas.toFixed(0)}%`}
                                                    </span>
                                                </div>
                                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.receitas)}</p>
                                                <p className="text-[11px] text-slate-400 mt-1">Mês anterior: {formatCurrency(comparativeData.prevTotals.receitas)}</p>
                                            </div>

                                            {/* Card Despesas */}
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
                                                    <span>Despesas Pagas</span>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${comparativeData.diffDespesas <= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'}`}>
                                                        {comparativeData.diffDespesas > 0 ? `+${comparativeData.pctDespesas.toFixed(0)}%` : `${comparativeData.pctDespesas.toFixed(0)}%`}
                                                    </span>
                                                </div>
                                                <p className="text-xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(totals.despesas)}</p>
                                                <p className="text-[11px] text-slate-400 mt-1">Mês anterior: {formatCurrency(comparativeData.prevTotals.despesas)}</p>
                                            </div>

                                            {/* Card Saldo Líquido */}
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
                                                    <span>Saldo Guardado / Mês</span>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${comparativeData.diffSavings >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'}`}>
                                                        {comparativeData.diffSavings >= 0 ? `+${formatCurrency(comparativeData.diffSavings)}` : formatCurrency(comparativeData.diffSavings)}
                                                    </span>
                                                </div>
                                                <p className={`text-xl font-black ${monthlySummary.saldoLiquido >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>{formatCurrency(monthlySummary.saldoLiquido)}</p>
                                                <p className="text-[11px] text-slate-400 mt-1">Taxa Poupança: {monthlySummary.taxaPoupanca.toFixed(1)}%</p>
                                            </div>
                                        </div>

                                        {/* DETECTOR DE GASTOS INVISÍVEIS (RALO FINANCEIRO) */}
                                        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-3xl p-6 border border-amber-500/20 dark:border-amber-500/30">
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
                                                        <Zap size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-slate-800 dark:text-white">Detector de Gastos Invisíveis ("Ralo Financeiro")</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Pequenas compras de até R$ 35,00 que passam despercebidas no dia a dia</p>
                                                    </div>
                                                </div>
                                                <div className="text-right bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Impacto Anual Projetado</span>
                                                    <p className="text-base font-black text-amber-600 dark:text-amber-400">{formatCurrency(comparativeData.annualMicroProjected)} / ano</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                                    <span className="text-xs text-slate-400 font-bold">Total Gasto em Microcompras</span>
                                                    <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{formatCurrency(comparativeData.totalMicroAmount)}</p>
                                                    <span className="text-[10px] text-slate-400">{comparativeData.countMicro} transações registradas</span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                                    <span className="text-xs text-slate-400 font-bold">Participação no Orçamento</span>
                                                    <p className="text-lg font-black text-orange-600 dark:text-orange-400 mt-0.5">
                                                        {totals.despesas > 0 ? ((comparativeData.totalMicroAmount / totals.despesas) * 100).toFixed(1) : 0}%
                                                    </p>
                                                    <span className="text-[10px] text-slate-400">do total de despesas do mês</span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                                    <span className="text-xs text-slate-400 font-bold">Se Investido em 5 Anos (10% a.a.)</span>
                                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(comparativeData.fiveYearInvestedAt10)}</p>
                                                    <span className="text-[10px] text-slate-400">Potencial patrimonial acumulado</span>
                                                </div>
                                            </div>

                                            {/* Lista dos microgastos */}
                                            {comparativeData.microExpenses.length > 0 && (
                                                <div className="space-y-2">
                                                    <span className="text-[11px] font-black text-slate-500 uppercase">Microgastos registrados este mês:</span>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                                        {comparativeData.microExpenses.slice(0, 9).map(t => (
                                                            <div key={t.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                                                                <div className="truncate mr-2">
                                                                    <span className="font-bold text-slate-800 dark:text-white truncate block">{t.description || t.category}</span>
                                                                    <span className="text-[10px] text-slate-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {t.category}</span>
                                                                </div>
                                                                <span className="font-black text-rose-600 shrink-0">{formatCurrency(t.amount)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* COMPARATIVO CATEGORIA POR CATEGORIA */}
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <h4 className="text-base font-black text-slate-800 dark:text-white mb-4">Variação de Gastos por Categoria</h4>
                                            <div className="space-y-3">
                                                {comparativeData.categoryComparison.map(cat => {
                                                    const isIncreased = cat.diff > 0;
                                                    const maxVal = Math.max(cat.currentAmount, cat.prevAmount, 1);
                                                    return (
                                                        <div key={cat.category} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                                                    <span className="text-xs font-black text-slate-800 dark:text-white">{cat.category}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs">
                                                                    <span className="text-slate-400">Anterior: <strong>{formatCurrency(cat.prevAmount)}</strong></span>
                                                                    <span className="text-slate-800 dark:text-white font-black">Atual: <strong>{formatCurrency(cat.currentAmount)}</strong></span>
                                                                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${cat.diff === 0 ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : isIncreased ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                                        }`}>
                                                                        {cat.diff === 0 ? 'Sem alteração' : isIncreased ? `+${formatCurrency(cat.diff)} (+${cat.pct.toFixed(0)}%)` : `${formatCurrency(cat.diff)} (${cat.pct.toFixed(0)}%)`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {/* Barra comparativa */}
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                                    <span className="w-12">Atual</span>
                                                                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(cat.currentAmount / maxVal) * 100}%`, backgroundColor: cat.color }}></div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                                    <span className="w-12">Anterior</span>
                                                                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                                        <div className="h-full rounded-full bg-slate-400 dark:bg-slate-600 transition-all duration-500" style={{ width: `${(cat.prevAmount / maxVal) * 100}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* RAIO-X DE SUPERMERCADOS & ATACADOS NOS EUA */}
                                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                                                            🛒
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-black text-slate-800 dark:text-white">Raio-X de Supermercados & Atacados</h3>
                                                            <p className="text-xs text-slate-400">Acompanhe compras no Costco, Walmart, Trader Joe's, Target e Publix</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Costco</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Walmart</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Trader Joe's</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Publix</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Target</span>
                                                </div>
                                            </div>

                                            {/* 3 STATS CARDS */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gasto Total no Mês</span>
                                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                                        {formatCurrency(groceryAnalysisData.totalCurrent)}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        Mês anterior: {formatCurrency(groceryAnalysisData.totalPrev)}
                                                    </span>
                                                </div>

                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Variação vs Mês Anterior</span>
                                                    <p className={`text-xl font-black mt-1 ${groceryAnalysisData.diffPct <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {groceryAnalysisData.totalPrev > 0 ? (
                                                            `${groceryAnalysisData.diffPct > 0 ? '+' : ''}${groceryAnalysisData.diffPct.toFixed(1)}%`
                                                        ) : (
                                                            'Primeiro mês'
                                                        )}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        {groceryAnalysisData.diffPct <= 0 ? '🎉 Menos gastos com mercado' : '⚠️ Gasto maior que o anterior'}
                                                    </span>
                                                </div>

                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ticket Médio por Ida</span>
                                                    <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                                                        {formatCurrency(groceryAnalysisData.avgTicket)}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        {groceryAnalysisData.countCurrent} {groceryAnalysisData.countCurrent === 1 ? 'compra registrada' : 'compras registradas'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Dica FinBot IA */}
                                            <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                                                <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                <p className="leading-relaxed">
                                                    <strong>Dica FinBot para Casais nos EUA:</strong> Comprar itens de despensa e produtos não perecíveis no atacado (Costco/Sam's Club) e deixar frutas e perecíveis semanais para o Trader Joe's ou Aldi reduz em média 15% a 20% do orçamento de mercado.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {analysisView === 'liberdade' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* HERO CARD DO SIMULADOR FIRE */}
                                        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Rocket className="text-amber-300 animate-bounce" size={24} />
                                                        <span className="text-xs font-black uppercase tracking-wider text-amber-300">Planejamento de Liberdade Financeira (FIRE)</span>
                                                    </div>
                                                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                                                        Meta para Viver de Renda Passiva
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1 max-w-xl">
                                                        Com base na Regra dos 4% (300x os gastos mensais), vocês precisam de <strong>{formatCurrency(fireSimulationData.fireTarget)}</strong> para cobrir todos os seus custos para sempre.
                                                    </p>
                                                </div>

                                                <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-center shrink-0 w-full sm:w-auto">
                                                    <span className="text-[11px] font-black uppercase text-blue-200 block">Tempo Estimado Restante</span>
                                                    <p className="text-2xl sm:text-3xl font-black text-amber-300 my-1">
                                                        {fireSimulationData.yearsRemaining} anos {fireSimulationData.monthsExtra > 0 ? `e ${fireSimulationData.monthsExtra} m` : ''}
                                                    </p>
                                                    <span className="text-xs font-bold text-white/90">
                                                        Aposentadoria aos <strong>{fireSimulationData.retirementAge} anos</strong> do casal
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Barra de Progresso Geral até o FIRE */}
                                            <div className="relative z-10 mt-6 pt-6 border-t border-white/15">
                                                <div className="flex justify-between text-xs font-black mb-2">
                                                    <span>Patrimônio Acumulado: {formatCurrency(fireSimulationData.currentNetWorth)}</span>
                                                    <span className="text-amber-300 font-extrabold">{fireSimulationData.progressPct}% Concluído</span>
                                                </div>
                                                <div className="w-full bg-black/30 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/20">
                                                    <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 h-full rounded-full transition-all duration-700" style={{ width: `${fireSimulationData.progressPct}%` }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CONTROLES E SLIDERS INTERATIVOS */}
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
                                                <h4 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                    <Sliders size={18} className="text-blue-600" /> Parâmetros de Simulação do Casal
                                                </h4>

                                                {/* Slider 1: Aporte Mensal */}
                                                <div>
                                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                                        <span className="text-slate-600 dark:text-slate-300">Aporte Mensal do Casal</span>
                                                        <span className="text-blue-600 dark:text-blue-400 font-black">{formatCurrency(fireMonthlyContribution)} / mês</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="200"
                                                        max="10000"
                                                        step="100"
                                                        value={fireMonthlyContribution}
                                                        onChange={(e) => setFireMonthlyContribution(Number(e.target.value))}
                                                        className="w-full accent-blue-600 cursor-pointer"
                                                    />
                                                </div>

                                                {/* Slider 2: Custo de Vida Mensal na Aposentadoria */}
                                                <div>
                                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                                        <span className="text-slate-600 dark:text-slate-300">Gasto Mensal Desejado (Renda Passiva)</span>
                                                        <span className="text-purple-600 dark:text-purple-400 font-black">{formatCurrency(fireMonthlyExpenseCustom)} / mês</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1500"
                                                        max="15000"
                                                        step="250"
                                                        value={fireMonthlyExpenseCustom}
                                                        onChange={(e) => setFireMonthlyExpenseCustom(Number(e.target.value))}
                                                        className="w-full accent-purple-600 cursor-pointer"
                                                    />
                                                </div>

                                                {/* Slider 3: Rentabilidade Real Acima da Inflação */}
                                                <div>
                                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                                        <span className="text-slate-600 dark:text-slate-300">Rentabilidade Real Esperada (% a.a. acima da inflação)</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{fireRealReturnRate.toFixed(1)}% ao ano</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="3"
                                                        max="12"
                                                        step="0.5"
                                                        value={fireRealReturnRate}
                                                        onChange={(e) => setFireRealReturnRate(Number(e.target.value))}
                                                        className="w-full accent-emerald-600 cursor-pointer"
                                                    />
                                                </div>

                                                {/* Idade Atual do Casal */}
                                                <div>
                                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                                        <span className="text-slate-600 dark:text-slate-300">Idade Média do Casal Hoje</span>
                                                        <span className="text-slate-800 dark:text-white font-black">{fireCoupleAge} anos</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="18"
                                                        max="70"
                                                        step="1"
                                                        value={fireCoupleAge}
                                                        onChange={(e) => setFireCoupleAge(Number(e.target.value))}
                                                        className="w-full accent-slate-600 cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            {/* CARD DE EFEITO ACELERADOR E DICAS */}
                                            <div className="lg:col-span-6 space-y-4">
                                                {/* Efeito Acelerador */}
                                                <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Sparkles className="text-amber-500 animate-pulse" size={20} />
                                                        <h4 className="text-base font-black text-slate-800 dark:text-white">Efeito Acelerador de Liberdade</h4>
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        Se vocês aumentarem os aportes em apenas <strong>+R$ 300/mês</strong> (para {formatCurrency(fireMonthlyContribution + 300)}/mês), a liberdade financeira será antecipada em <strong>{fireSimulationData.yearsSaved} anos</strong>!
                                                    </p>
                                                </div>

                                                {/* Marcos do Patrimônio */}
                                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Marcos da Jornada FIRE</h4>
                                                    <div className="space-y-2.5">
                                                        {fireSimulationData.milestones.map((m, i) => (
                                                            <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${m.reached ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                                                        {m.reached ? <Check size={12} /> : `${m.pct}%`}
                                                                    </div>
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{m.label}</span>
                                                                </div>
                                                                <span className={`font-black ${m.reached ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                                    {formatCurrency(m.amount)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {analysisView === 'desafios' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* BANNER DE CABEÇALHO */}
                                        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Flame size={22} className="text-yellow-200 animate-pulse" />
                                                    <span className="text-xs font-black uppercase tracking-wider text-yellow-100">Gincana Financeira do Casal</span>
                                                </div>
                                                <h3 className="text-2xl font-black tracking-tight">Desafios & Metas Compartilhadas</h3>
                                                <p className="text-xs text-yellow-100/90 font-medium">Economizem juntos, acumulem pontos e elevem o Nível do Casal!</p>
                                            </div>
                                            <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/30 text-center shrink-0">
                                                <span className="text-[10px] uppercase font-black text-yellow-100 block">Desafios Concluídos</span>
                                                <p className="text-2xl font-black text-white">
                                                    {coupleChallenges.filter(c => c.status === 'concluido').length} / {coupleChallenges.length}
                                                </p>
                                            </div>
                                        </div>

                                        {/* GRADE DE DESAFIOS */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {coupleChallenges.map(ch => {
                                                const isCompleted = ch.status === 'concluido';
                                                const pct = Math.min(100, Math.round(((ch.currentDays || 0) / (ch.targetDays || 1)) * 100));
                                                return (
                                                    <div
                                                        key={ch.id}
                                                        className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${isCompleted
                                                                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-md'
                                                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'
                                                            }`}
                                                    >
                                                        <div>
                                                            <div className="flex justify-between items-start mb-3">
                                                                <span className="text-3xl">{ch.rewardIcon || '🎯'}</span>
                                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${isCompleted ? 'bg-emerald-500 text-white' : ch.status === 'em_progresso' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                                    }`}>
                                                                    {isCompleted ? 'Concluído 🎉' : ch.status === 'em_progresso' ? 'Em Progresso 🏃' : 'Não Iniciado'}
                                                                </span>
                                                            </div>

                                                            <h4 className="text-base font-black text-slate-800 dark:text-white leading-tight">{ch.title}</h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{ch.description}</p>
                                                        </div>

                                                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                                            <div className="flex justify-between text-xs font-bold">
                                                                <span className="text-slate-400">Progresso</span>
                                                                <span className="text-slate-800 dark:text-white font-black">{ch.currentDays} de {ch.targetDays} dias ({pct}%)</span>
                                                            </div>
                                                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                                            </div>

                                                            <div className="flex items-center gap-2 pt-1">
                                                                <button
                                                                    onClick={() => handleAdvanceChallenge(ch.id)}
                                                                    disabled={isCompleted}
                                                                    className="flex-1 py-2.5 px-3 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                                                >
                                                                    {isCompleted ? <Check size={14} /> : <Plus size={14} />}
                                                                    {isCompleted ? 'Desafio Cumprido!' : '+1 Dia Concluído'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleResetChallenge(ch.id)}
                                                                    className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                                                                    title="Reiniciar Desafio"
                                                                >
                                                                    <RotateCcw size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* VISUALIZAÇÃO: FINANCIAMENTOS & DÍVIDAS COM DÉBITO AUTOMÁTICO */}
                                {analysisView === 'financiamentos' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* BANNER PRINCIPAL DE FINANCIAMENTOS */}
                                        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
                                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-2xl">🚗</span>
                                                        <span className="text-xs font-black uppercase tracking-wider text-blue-300">Gestão de Bens & Contratos</span>
                                                    </div>
                                                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Financiamentos & Débito Automático</h3>
                                                    <p className="text-xs text-blue-200/80 font-medium mt-1 max-w-xl">
                                                        Acompanhamento completo da quitação de veículos, imóveis e empréstimos. Parcelas lançadas automaticamente mês a mês com amortização inteligente.
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2.5 shrink-0">
                                                    <button
                                                        onClick={() => setIsFinancingModalOpen(true)}
                                                        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95"
                                                    >
                                                        <Plus size={16} /> Novo Financiamento
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setContractAnalysisResult(null);
                                                            setContractFileBase64(null);
                                                            setContractFileMimeType('');
                                                            setContractFileName('');
                                                            setContractTextInput('');
                                                            setIsContractAnalysisModalOpen(true);
                                                        }}
                                                        className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95"
                                                    >
                                                        <Sparkles size={16} className="text-amber-300" /> Analisar Contrato com IA
                                                    </button>
                                                </div>
                                            </div>

                                            {/* RESUMO EXECUTIVO (4 STATS CARDS) */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
                                                <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Financiado</span>
                                                    <p className="text-base sm:text-lg font-black text-white mt-0.5">{formatCurrency(financingsSummary.totalFinanced)}</p>
                                                </div>
                                                <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Total Já Pago</span>
                                                    <p className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">{formatCurrency(financingsSummary.totalPaid)} ({financingsSummary.percentPaid}%)</p>
                                                </div>
                                                <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                                                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Saldo Restante</span>
                                                    <p className="text-base sm:text-lg font-black text-rose-300 mt-0.5">{formatCurrency(financingsSummary.totalRemaining)}</p>
                                                </div>
                                                <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                                                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Parcelas/Mês Total</span>
                                                    <p className="text-base sm:text-lg font-black text-blue-200 mt-0.5">{formatCurrency(financingsSummary.monthlyInstallmentsTotal)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* LISTA DE FINANCIAMENTOS ATIVOS */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <h4 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                    Bens & Financiamentos Cadastrados
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                        {financingsSummary.list.length}
                                                    </span>
                                                </h4>
                                            </div>

                                            {financingsSummary.list.length === 0 ? (
                                                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
                                                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                                                        🚗
                                                    </div>
                                                    <h4 className="font-extrabold text-slate-800 dark:text-white text-base">Nenhum financiamento cadastrado ainda</h4>
                                                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                                                        Cadastre o financiamento do seu carro, moto, imóvel ou envie uma foto do contrato para a IA calcular todas as parcelas e juros automaticamente!
                                                    </p>
                                                    <div className="flex justify-center gap-3 pt-2">
                                                        <button
                                                            onClick={() => setIsFinancingModalOpen(true)}
                                                            className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-2xl"
                                                        >
                                                            + Cadastrar Manualmente
                                                        </button>
                                                        <button
                                                            onClick={() => setIsContractAnalysisModalOpen(true)}
                                                            className="px-4 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-2xl"
                                                        >
                                                            📄 Enviar Contrato
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    {financingsSummary.list.map(fin => {
                                                        const totalInst = Number(fin.totalInstallments) || 1;
                                                        const paidInst = Math.min(totalInst, Number(fin.paidInstallments) || 0);
                                                        const remInst = totalInst - paidInst;
                                                        const pct = Math.min(100, Math.round((paidInst / totalInst) * 100));
                                                        const remAmount = (Number(fin.installmentAmount) || 0) * remInst;
                                                        const isFullyPaid = paidInst >= totalInst;

                                                        return (
                                                            <div
                                                                key={fin.id}
                                                                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${isFullyPaid
                                                                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-md'
                                                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md'
                                                                    }`}
                                                            >
                                                                <div>
                                                                    {/* Cabeçalho do Card */}
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-2xl shadow-inner shrink-0">
                                                                                {fin.icon || '🚗'}
                                                                            </div>
                                                                            <div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <h5 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">
                                                                                        {fin.title}
                                                                                    </h5>
                                                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                                                        {fin.type === 'imovel' ? 'Imóvel' : fin.type === 'veiculo' ? 'Veículo' : 'Financiamento'}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-xs text-slate-400 font-medium">
                                                                                    {fin.paidBy === 'esposa' ? 'Pago pela Esposa' : fin.paidBy === 'marido' ? 'Pago por Você' : 'Dividido pelo Casal (50/50)'}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            onClick={() => handleDeleteFinancing(fin.id)}
                                                                            className="p-2 text-slate-300 hover:text-rose-500 rounded-xl transition"
                                                                            title="Remover Financiamento"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>

                                                                    {/* Dados da Parcela */}
                                                                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 mb-4">
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Valor da Parcela</span>
                                                                            <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">
                                                                                {formatCurrency(fin.installmentAmount)}
                                                                            </p>
                                                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1 mt-0.5">
                                                                                <Clock size={11} /> Todo dia {fin.dueDay}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Saldo Devedor</span>
                                                                            <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                                                                                {formatCurrency(remAmount)}
                                                                            </p>
                                                                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                                                                Faltam {remInst} parcelas
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Barra de Progresso de Quitação */}
                                                                    <div className="space-y-1.5 mb-4">
                                                                        <div className="flex justify-between text-xs font-bold">
                                                                            <span className="text-slate-500 dark:text-slate-400">
                                                                                {paidInst} de {totalInst} parcelas pagas
                                                                            </span>
                                                                            <span className="font-black text-slate-800 dark:text-white">
                                                                                {pct}% Quitado
                                                                            </span>
                                                                        </div>
                                                                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-700 ${isFullyPaid ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
                                                                                    }`}
                                                                                style={{ width: `${pct}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Ações & Amortização */}
                                                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedFinancingForAmortization(fin);
                                                                            setAmortizationPrepayCount(1);
                                                                            setIsAmortizationModalOpen(true);
                                                                        }}
                                                                        disabled={isFullyPaid}
                                                                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-2xl transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                                                    >
                                                                        <Zap size={15} className="text-yellow-300" /> Simular Amortização & Economia
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* CUSTO REAL DO VEÍCULO NOS EUA (TCO) */}
                                        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-white/10 shadow-xl space-y-5">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center text-2xl shadow-inner">
                                                        ⛽
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">Total Cost of Ownership (EUA)</span>
                                                        <h3 className="text-xl font-black">Custo Real do Veículo por Mês</h3>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCarCostsModalOpen(true)}
                                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 border border-white/15 active:scale-95"
                                                >
                                                    ⚙️ Ajustar Custos Adicionais
                                                </button>
                                            </div>

                                            {/* 4 CARDS DE CUSTO */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parcela Financiamento</span>
                                                    <p className="text-base sm:text-lg font-black text-white mt-1">{formatCurrency(carTcoData.installment)}</p>
                                                    <span className="text-[10px] text-slate-400">mensal</span>
                                                </div>
                                                <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                                                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Seguro Auto (Insurance)</span>
                                                    <p className="text-base sm:text-lg font-black text-indigo-300 mt-1">{formatCurrency(carTcoData.insurance)}</p>
                                                    <span className="text-[10px] text-slate-400">mensal</span>
                                                </div>
                                                <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                                                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Gasolina / Combustível</span>
                                                    <p className="text-base sm:text-lg font-black text-amber-300 mt-1">{formatCurrency(carTcoData.gas)}</p>
                                                    <span className="text-[10px] text-slate-400">mensal estimado</span>
                                                </div>
                                                <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                                                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">Manutenção & Pedágios</span>
                                                    <p className="text-base sm:text-lg font-black text-rose-300 mt-1">{formatCurrency(carTcoData.maintenance + carTcoData.tolls)}</p>
                                                    <span className="text-[10px] text-slate-400">óleo, SunPass, etc.</span>
                                                </div>
                                            </div>

                                            {/* RESUMO TOTAL MENSAL E ANUAL */}
                                            <div className="p-4 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div>
                                                    <span className="text-xs text-blue-200 font-bold block">Impacto Real do Carro no Orçamento do Casal:</span>
                                                    <div className="flex items-baseline gap-2 mt-0.5">
                                                        <span className="text-2xl sm:text-3xl font-black text-white">{formatCurrency(carTcoData.monthlyTotal)}</span>
                                                        <span className="text-xs text-blue-200">/ mês</span>
                                                        <span className="text-xs text-slate-400 ml-2">({formatCurrency(carTcoData.annualTotal)} / ano)</span>
                                                    </div>
                                                </div>
                                                <div className="text-[11px] text-blue-200/80 max-w-xs leading-tight">
                                                    💡 <em>Dica FinBot:</em> O financiamento representa apenas {(carTcoData.monthlyTotal > 0 ? (carTcoData.installment / carTcoData.monthlyTotal) * 100 : 0).toFixed(0)}% do custo real do carro nos EUA.
                                                </div>
                                            </div>
                                        </div>

                                        {/* CARD EDUCATIVO: COMO ECONOMIZAR COM AMORTIZAÇÃO */}
                                        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-purple-500/10 rounded-3xl p-6 border border-amber-200/50 dark:border-amber-900/30">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md">
                                                    💡
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-black text-slate-800 dark:text-white text-base">
                                                        Como quitar seu financiamento pela metade do tempo e economizar juros?
                                                    </h4>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        Quando você faz uma <strong>amortização extraordinária</strong> abatendo parcelas de trás para frente (pelo saldo devedor puro), você <strong>elimina todos os juros futuros</strong> embutidos naquela parcela. Por exemplo, uma parcela de R$ 1.250 pode sair por menos de R$ 400 se for paga antecipada!
                                                    </p>
                                                </div>
                                            </div>
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

                                            // Contas fixas válidas que ainda NÃO foram efetivadas como transação neste mês/dia
                                            const unfulfilledRulesOnDay = repeatingRules.filter(r => {
                                                if (Number(r.day) !== day) return false;
                                                if (r.durationMonths && Number(r.durationMonths) > 0 && r.startDate) {
                                                    const [sY, sM] = r.startDate.split('-').map(Number);
                                                    const currY = currentDate.getFullYear();
                                                    const currM = currentDate.getMonth() + 1;
                                                    const diff = (currY - sY) * 12 + (currM - sM);
                                                    if (diff < 0 || diff >= Number(r.durationMonths)) return false;
                                                }
                                                // Não exibe regra pendente se a transação correspondente já foi lançada neste dia
                                                const alreadyExists = dayTxs.some(t =>
                                                    t.isFromRepeatRule === r.id ||
                                                    (t.description?.toLowerCase().trim() === r.description?.toLowerCase().trim() && Math.abs(Number(t.amount) - Number(r.amount)) < 0.01)
                                                );
                                                return !alreadyExists;
                                            });
                                            const hasPendingFixedRule = unfulfilledRulesOnDay.length > 0;

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
                                                        {hasPendingFixedRule && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'}`}></div>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                            Movimentações do Dia {selectedDay}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setFixedBillEditing(null);
                                                setFixedBillForm({
                                                    id: '',
                                                    type: 'saida',
                                                    amount: '',
                                                    category: (allCategories.saida && allCategories.saida[0]) || 'Casa',
                                                    description: '',
                                                    day: selectedDay.toString(),
                                                    accountId: 'acc_main',
                                                    paidBy: 'conjunto',
                                                    durationMode: 'indefinite',
                                                    durationMonths: '4',
                                                    startMonth: currentDate.toISOString().slice(0, 7)
                                                });
                                                setIsFixedBillsModalOpen(true);
                                            }}
                                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            <Plus size={13} /> Fixar Conta neste Dia
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {/* 1. Contas Fixas Programadas que ainda não foram lançadas manualmente */}
                                        {(() => {
                                            const dayTransactions = monthlyTransactions.filter(t => new Date(t.date + 'T12:00:00').getDate() === selectedDay && t.type !== 'transferencia');
                                            const pendingRules = repeatingRules.filter(r => {
                                                if (Number(r.day) !== selectedDay) return false;
                                                if (r.durationMonths && Number(r.durationMonths) > 0 && r.startDate) {
                                                    const [sY, sM] = r.startDate.split('-').map(Number);
                                                    const currY = currentDate.getFullYear();
                                                    const currM = currentDate.getMonth() + 1;
                                                    const diff = (currY - sY) * 12 + (currM - sM);
                                                    if (diff < 0 || diff >= Number(r.durationMonths)) return false;
                                                }
                                                const alreadyExists = dayTransactions.some(t =>
                                                    t.isFromRepeatRule === r.id ||
                                                    (t.description?.toLowerCase().trim() === r.description?.toLowerCase().trim() && Math.abs(Number(t.amount) - Number(r.amount)) < 0.01)
                                                );
                                                return !alreadyExists;
                                            });

                                            return pendingRules.map(r => {
                                                const validity = getRuleValidity(r);
                                                return (
                                                    <div key={`rule-${r.id}`} className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl flex justify-between items-center border border-amber-200/60 dark:border-amber-900/40">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-amber-500 shadow-sm">
                                                                <Clock size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="font-extrabold text-slate-800 dark:text-white text-xs">{r.description}</p>
                                                                    <span className="text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">Programado</span>
                                                                </div>
                                                                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                                                    {validity.shortText} • {r.category} • {r.paidBy === 'marido' ? '👦 Marido' : (r.paidBy === 'esposa' ? '👧 Esposa' : '👥 Casal')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className={`font-black text-xs ${r.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {r.type === 'entrada' ? '+' : '-'}{formatCurrency(r.amount)}
                                                        </p>
                                                    </div>
                                                );
                                            });
                                        })()}

                                        {/* 2. Transações Reais Lançadas no Dia */}
                                        {monthlyTransactions.filter(t => new Date(t.date + 'T12:00:00').getDate() === selectedDay).map(t => {
                                            const isFixedLinked = t.isFromRepeatRule || repeatingRules.some(r => r.description?.toLowerCase().trim() === t.description?.toLowerCase().trim());
                                            return (
                                                <div key={t.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800">
                                                            {getCategoryIcon(t.category)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="font-extrabold text-slate-800 dark:text-white text-xs">{t.description}</p>
                                                                {isFixedLinked && (
                                                                    <span className="text-[9px] bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">Conta Fixa</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-400">{t.category} • {t.paidBy === 'marido' ? '👦 Marido' : (t.paidBy === 'esposa' ? '👧 Esposa' : '👥 Casal')}</p>
                                                        </div>
                                                    </div>
                                                    <p className={`font-black text-xs ${t.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {t.type === 'entrada' ? '+' : '-'}{formatCurrency(t.amount)}
                                                    </p>
                                                </div>
                                            );
                                        })}

                                        {/* Estado Vazio caso não tenha nada no dia */}
                                        {monthlyTransactions.filter(t => new Date(t.date + 'T12:00:00').getDate() === selectedDay).length === 0 &&
                                         repeatingRules.filter(r => {
                                            if (Number(r.day) !== selectedDay) return false;
                                            if (!r.durationMonths || Number(r.durationMonths) <= 0 || !r.startDate) return true;
                                            const [sY, sM] = r.startDate.split('-').map(Number);
                                            const currY = currentDate.getFullYear();
                                            const currM = currentDate.getMonth() + 1;
                                            const diff = (currY - sY) * 12 + (currM - sM);
                                            return diff >= 0 && diff < Number(r.durationMonths);
                                        }).length === 0 && (
                                            <p className="text-sm text-slate-400 py-8 text-center">Nenhum movimento ou conta fixa registrada neste dia.</p>
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

                {/* ==================================================== */}
                {/* MODAIS (FORMULÁRIOS, FATURA, METAS, ETC.) */}
                {/* ==================================================== */}
                {/* Modal Formulário Lançamento */}

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
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleStartVoiceRecording}
                                                className="p-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-600 dark:text-amber-400 rounded-2xl transition flex items-center justify-center border border-amber-200 dark:border-amber-800"
                                                title="Preencher por Voz com FinBot IA"
                                            >
                                                <Mic size={20} />
                                            </button>
                                            <label
                                                className="p-2 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-600 dark:text-purple-400 rounded-2xl cursor-pointer transition flex items-center justify-center border border-purple-200 dark:border-purple-800"
                                                title="Escanear Recibo com Foto"
                                            >
                                                {isScanningReceipt ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                                                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptScan} disabled={isScanningReceipt} />
                                            </label>
                                        </>
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
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor ($)</label>
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

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Quem Pagou / Responsável</label>
                                    <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paidBy: 'marido' })}
                                            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${formData.paidBy === 'marido' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <span>👦</span> <span>Você</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paidBy: 'esposa' })}
                                            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${formData.paidBy === 'esposa' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <span>👧</span> <span>Esposa</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paidBy: 'conjunto' })}
                                            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${formData.paidBy === 'conjunto' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <span>👥</span> <span>Casal</span>
                                        </button>
                                    </div>
                                </div>

                                {formData.type !== 'investimento' && !editingId && (
                                    <div className="space-y-2 pt-1">
                                        <label className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isRepeating}
                                                onChange={(e) => setFormData({ ...formData, isRepeating: e.target.checked })}
                                                className="w-5 h-5 rounded-lg border-blue-300 text-blue-600"
                                            />
                                            <div>
                                                <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300 block">Conta Fixa Recorrente</span>
                                                <span className="text-[11px] text-blue-600 dark:text-blue-400">Lançar e projetar automaticamente nos próximos meses</span>
                                            </div>
                                        </label>

                                        {formData.isRepeating && (
                                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block">Vigência desta Conta</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, repeatDurationMode: 'indefinite' }))}
                                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition text-left ${formData.repeatDurationMode === 'indefinite' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
                                                    >
                                                        ♾️ Indeterminado
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, repeatDurationMode: 'fixed' }))}
                                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition text-left ${formData.repeatDurationMode === 'fixed' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
                                                    >
                                                        ⏳ Período Fixo
                                                    </button>
                                                </div>

                                                {formData.repeatDurationMode === 'fixed' && (
                                                    <div className="pt-2">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Duração do Contrato (em Meses):</label>
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="120"
                                                                required
                                                                placeholder="Digite a quantidade (ex: 1, 5, 7...)"
                                                                value={formData.repeatDurationMonths}
                                                                onChange={e => setFormData(prev => ({ ...prev, repeatDurationMonths: e.target.value }))}
                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                            />
                                                            <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">meses</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Teto Mensal de Gastos ($)</label>
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

                {/* Modal Modo Família & Casal Aprimorado */}
                {isFamilyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFamilyModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                                        <Heart size={22} className="fill-pink-500/20" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Modo Casal & Família</h2>
                                        <p className="text-xs text-slate-400">Finanças compartilhadas a dois</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsFamilyModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            {activeFamilyCode ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/50 rounded-3xl text-center space-y-2">
                                        <p className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Código de Acesso do Casal</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-2xl font-black tracking-widest text-slate-800 dark:text-white font-mono bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-pink-200 dark:border-pink-800">
                                                {activeFamilyCode}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (navigator.clipboard) {
                                                        navigator.clipboard.writeText(activeFamilyCode);
                                                        showToast("Código copiado! Envie para sua esposa.");
                                                    }
                                                }}
                                                className="p-3 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl transition active:scale-95"
                                                title="Copiar Código"
                                            >
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Sua esposa só precisa digitar esse código no celular dela para vocês compartilharem tudo!
                                        </p>
                                    </div>

                                    {familyData?.members && familyData.members.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Membros Conectados</p>
                                            <div className="space-y-2">
                                                {familyData.members.map((m, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-black">
                                                                {m.user_email ? m.user_email[0].toUpperCase() : 'U'}
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                                {m.user_email === supabaseUser?.email ? `${m.user_email} (Você)` : m.user_email}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                                                            {m.role === 'owner' ? 'Criador' : 'Conectado'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleLeaveFamilyGroup}
                                        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 font-bold rounded-2xl p-3 text-xs transition"
                                    >
                                        Desconectar do Modo Casal
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleJoinOrCreateFamily} className="space-y-4">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Crie um código de casal ou insira o código existente para conectar o celular seu e da sua esposa à mesma conta de finanças.
                                    </p>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nome do Casal / Família (Opcional)</label>
                                        <input
                                            type="text"
                                            value={familyNameInput}
                                            onChange={(e) => setFamilyNameInput(e.target.value)}
                                            placeholder="Ex: Finanças do Casal"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Código de Vínculo</label>
                                        <input
                                            type="text"
                                            required
                                            value={familyCodeInput}
                                            onChange={(e) => setFamilyCodeInput(e.target.value.toUpperCase())}
                                            placeholder="Ex: CASAL-LUIS-2026"
                                            className="w-full text-lg font-black font-mono tracking-wider text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-pink-500 uppercase"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-pink-500/25 transition active:scale-98"
                                    >
                                        Conectar e Sincronizar Casal
                                    </button>
                                </form>
                            )}
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

                {/* Modal de Configuração do Supabase (URL e Anon Key) */}
                {isCloudConfigModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCloudConfigModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                        <Database size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Conectar Supabase</h2>
                                        <p className="text-xs text-slate-400">Banco de Dados em Nuvem Seguro</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCloudConfigModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveCloudConfig} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Project URL do Supabase</label>
                                    <input
                                        type="url"
                                        required
                                        value={configUrlInput}
                                        onChange={(e) => setConfigUrlInput(e.target.value)}
                                        placeholder="https://seu-projeto.supabase.co"
                                        className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">Encontrado em: app.supabase.com ➔ Project Settings ➔ API</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Anon Public Key do Supabase</label>
                                    <input
                                        type="text"
                                        required
                                        value={configKeyInput}
                                        onChange={(e) => setConfigKeyInput(e.target.value)}
                                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                        className="w-full text-sm font-mono text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">Chave pública (anon/public) para leitura e gravação segura.</span>
                                </div>

                                <div className="pt-2 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCloudConfigModalOpen(false)}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl text-xs transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-600/25 transition"
                                    >
                                        Salvar e Conectar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Configuração do PIN (Segurança) */}
                {isPinModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPinModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                        <Lock size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">PIN de Acesso</h2>
                                        <p className="text-xs text-slate-400">Proteção ao abrir o aplicativo</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsPinModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                Defina uma senha rápida de 4 números. Toda vez que abrir o app no celular ou no PC, será exigido esse PIN para ver os saldos.
                            </p>

                            <form onSubmit={handleSetNewPin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Novo PIN (4 dígitos)</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        required
                                        value={newPinInput}
                                        onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                                        placeholder="••••"
                                        className="w-full text-center text-3xl font-black tracking-widest text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Confirme o PIN</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        required
                                        value={confirmPinInput}
                                        onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                                        placeholder="••••"
                                        className="w-full text-center text-3xl font-black tracking-widest text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="pt-2 space-y-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-emerald-600/25 transition active:scale-98"
                                    >
                                        Salvar e Ativar PIN
                                    </button>

                                    {appPin && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAppPin}
                                            className="w-full bg-slate-100 dark:bg-slate-800 text-rose-500 font-bold py-3 rounded-2xl text-xs transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                        >
                                            Desativar Bloqueio por PIN
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 1. Modal Criar / Editar Cofrinho */}
                {isSavingsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSavingsModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <PiggyBank size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Novo Cofrinho</h2>
                                        <p className="text-xs text-slate-400">Planeje um sonho ou meta do casal</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsSavingsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveSavingsGoal} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome do Sonho / Cofrinho</label>
                                    <input
                                        type="text"
                                        required
                                        value={newGoalData.title}
                                        onChange={(e) => setNewGoalData({ ...newGoalData, title: e.target.value })}
                                        placeholder="Ex: Viagem para a Europa, Carro Novo"
                                        className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor Alvo ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={newGoalData.targetAmount}
                                            onChange={(e) => setNewGoalData({ ...newGoalData, targetAmount: e.target.value })}
                                            placeholder="15000"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Já Guardado ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newGoalData.currentAmount}
                                            onChange={(e) => setNewGoalData({ ...newGoalData, currentAmount: e.target.value })}
                                            placeholder="0"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ícone</label>
                                        <select
                                            value={newGoalData.icon}
                                            onChange={(e) => setNewGoalData({ ...newGoalData, icon: e.target.value })}
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="🏖️">🏖️ Viagem</option>
                                            <option value="🛡️">🛡️ Emergência</option>
                                            <option value="🚗">🚗 Carro / Moto</option>
                                            <option value="🛋️">🛋️ Reforma / Casa</option>
                                            <option value="💍">💍 Casamento / Festa</option>
                                            <option value="👶">👶 Família / Filhos</option>
                                            <option value="💻">💻 Eletrônicos</option>
                                            <option value="🎯">🎯 Outro Sonho</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data Alvo (Opcional)</label>
                                        <input
                                            type="date"
                                            value={newGoalData.deadline}
                                            onChange={(e) => setNewGoalData({ ...newGoalData, deadline: e.target.value })}
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-amber-500/25 transition active:scale-98 mt-2"
                                >
                                    Criar Cofrinho
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* 2. Modal Depositar / Resgatar no Cofrinho */}
                {isDepositModalOpen && selectedSavingsGoal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDepositModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{selectedSavingsGoal.icon || '🎯'}</div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">{selectedSavingsGoal.title}</h2>
                                        <p className="text-xs text-slate-400">
                                            Saldo atual: {formatCurrency(selectedSavingsGoal.currentAmount)}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setIsDepositModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Seletor Depositar vs Resgatar */}
                            <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6">
                                <button
                                    type="button"
                                    onClick={() => setDepositActionType('deposit')}
                                    className={`py-2.5 text-xs font-black rounded-xl transition ${depositActionType === 'deposit' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
                                >
                                    + Guardar Dinheiro
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDepositActionType('withdraw')}
                                    className={`py-2.5 text-xs font-black rounded-xl transition ${depositActionType === 'withdraw' ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}
                                >
                                    - Resgatar Dinheiro
                                </button>
                            </div>

                            <form onSubmit={handleDepositToSavingsGoal} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                                        Valor a {depositActionType === 'deposit' ? 'Guardar' : 'Resgatar'} ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        autoFocus
                                        value={savingsDepositInput}
                                        onChange={(e) => setSavingsDepositInput(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full text-center text-3xl font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className={`w-full text-white font-black py-4 rounded-2xl text-sm shadow-lg transition active:scale-98 ${depositActionType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-800/25'}`}
                                >
                                    Confirmar {depositActionType === 'deposit' ? 'Aporte' : 'Resgate'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. Modal Lista de Mercado Compartilhada */}
                {isShoppingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsShoppingModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <ShoppingCart size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Lista de Mercado</h2>
                                        <p className="text-xs text-slate-400">Sincronizada em tempo real para o casal</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsShoppingModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Formulário de Adicionar Item Rápido */}
                            <form onSubmit={handleAddShoppingItem} className="flex gap-2 mb-4 shrink-0">
                                <input
                                    type="text"
                                    required
                                    value={newShopItem.name}
                                    onChange={(e) => setNewShopItem({ ...newShopItem, name: e.target.value })}
                                    placeholder="Ex: Leite integral, Arroz, Pão..."
                                    className="flex-1 text-xs font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                <input
                                    type="text"
                                    value={newShopItem.quantity}
                                    onChange={(e) => setNewShopItem({ ...newShopItem, quantity: e.target.value })}
                                    placeholder="Qtd"
                                    className="w-16 text-xs font-bold text-center text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
                                />
                                <button
                                    type="submit"
                                    className="px-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-md transition shrink-0"
                                >
                                    <Plus size={16} />
                                </button>
                            </form>

                            {/* Lista de Itens */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2 min-h-48">
                                {shoppingItems.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 text-xs font-medium">
                                        Sua lista de compras está vazia! Adicione itens acima para não esquecer nada no supermercado.
                                    </div>
                                ) : (
                                    shoppingItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${item.completed ? 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-900 opacity-60' : 'bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700 shadow-sm'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onClick={() => handleToggleShoppingItem(item.id)}>
                                                <button
                                                    type="button"
                                                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}
                                                >
                                                    {item.completed && <Check size={14} />}
                                                </button>
                                                <div className="min-w-0">
                                                    <p className={`text-xs font-bold truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                                        {item.name}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-medium">{item.quantity}</span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteShoppingItem(item.id)}
                                                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Rodapé com Total e Botão de Finalizar no Finanças */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
                                <button
                                    type="button"
                                    onClick={handleCheckoutShoppingToTransactions}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-emerald-600/25 transition active:scale-98 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Finalizar Compras & Lançar Despesa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Modal Diagnóstico Mensal com IA */}
                {isAiDiagnosisOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAiDiagnosisOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Sparkles size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Diagnóstico FinBot IA</h2>
                                        <p className="text-xs text-slate-400">Resumo executivo e recomendações financeiras</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAiDiagnosisOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-1 my-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                {isGeneratingDiagnosis ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-500">
                                        <Loader2 size={32} className="animate-spin text-indigo-600" />
                                        <p className="text-xs font-bold">O Gemini 3.6 Flash está analisando os dados do casal...</p>
                                    </div>
                                ) : (
                                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {aiDiagnosisText}
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(aiDiagnosisText);
                                        showToast("Diagnóstico copiado para a área de transferência!");
                                    }}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-black py-3 rounded-2xl text-xs transition flex items-center justify-center gap-1.5"
                                >
                                    <Copy size={14} /> Copiar Diagnóstico
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateAiDiagnosis}
                                    disabled={isGeneratingDiagnosis}
                                    className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl text-xs transition flex items-center justify-center gap-1.5"
                                >
                                    <RefreshCw size={14} className={isGeneratingDiagnosis ? 'animate-spin' : ''} /> Recalcular
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL DE RELATÓRIO EXECUTIVO PARA IMPRESSÃO / PDF */}
                {/* ========================================================================= */}
                {isReportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
                        <div className="relative bg-white text-slate-900 w-full max-w-3xl rounded-none sm:rounded-3xl p-6 sm:p-10 shadow-2xl my-auto animate-in zoom-in-95 duration-200">
                            {/* Barra de Ações do Relatório (Oculta na impressão) */}
                            <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <FileDown className="text-emerald-600" size={22} />
                                    <span className="text-sm font-black text-slate-800">Visualização de Impressão & PDF</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const reportText = `📄 *RELATÓRIO FINANCEIRO DO CASAL*\n` +
                                                `📅 *Período:* ${currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}\n\n` +
                                                `🟢 *Receitas:* ${formatCurrency(monthlySummary.receitas)}\n` +
                                                `🔴 *Despesas:* ${formatCurrency(monthlySummary.despesas)}\n` +
                                                `🔵 *Investimentos:* ${formatCurrency(monthlySummary.investimentos)}\n` +
                                                `💰 *Saldo Líquido:* ${formatCurrency(monthlySummary.saldoLiquido)}\n` +
                                                `📈 *Taxa de Poupança:* ${monthlySummary.taxaPoupanca.toFixed(1)}%\n\n` +
                                                `⚖️ *Balanço do Casal:*\n` +
                                                `👦 Você: ${formatCurrency(coupleSplitData.totalMarido)} (${coupleSplitData.pctMarido.toFixed(0)}%)\n` +
                                                `👧 Esposa: ${formatCurrency(coupleSplitData.totalEsposa)} (${coupleSplitData.pctEsposa.toFixed(0)}%)\n` +
                                                `👥 Casal: ${formatCurrency(coupleSplitData.totalConjunto)}\n` +
                                                `💡 ${coupleSplitData.settlementText}`;
                                            navigator.clipboard.writeText(reportText);
                                            showToast("Resumo copiado para o WhatsApp!");
                                        }}
                                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                                    >
                                        <Copy size={14} /> Copiar
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                                    >
                                        <Printer size={14} /> Imprimir / Salvar PDF
                                    </button>
                                    <button
                                        onClick={() => setIsReportModalOpen(false)}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* DOCUMENTO DO RELATÓRIO EXECUTIVO */}
                            <div className="space-y-6">
                                {/* Cabeçalho do Relatório */}
                                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                                                FP
                                            </div>
                                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">FinançasPro</h1>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Relatório Financeiro Executivo do Casal</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs uppercase font-extrabold text-slate-400">Mês de Referência</span>
                                        <h2 className="text-lg font-black text-slate-900 capitalize">
                                            {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                                        </h2>
                                        <p className="text-[10px] text-slate-400">Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>

                                {/* Resumo de Indicadores Principais */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Receitas</span>
                                        <p className="text-base font-black text-emerald-600 mt-0.5">{formatCurrency(monthlySummary.receitas)}</p>
                                    </div>
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Despesas</span>
                                        <p className="text-base font-black text-rose-600 mt-0.5">{formatCurrency(monthlySummary.despesas)}</p>
                                    </div>
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Investimentos</span>
                                        <p className="text-base font-black text-indigo-600 mt-0.5">{formatCurrency(monthlySummary.investimentos)}</p>
                                    </div>
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Saldo Líquido</span>
                                        <p className={`text-base font-black mt-0.5 ${monthlySummary.saldoLiquido >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                            {formatCurrency(monthlySummary.saldoLiquido)}
                                        </p>
                                    </div>
                                </div>

                                {/* Bloco 1: Balanço e Acerto do Casal */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                        <Scale size={14} className="text-indigo-600" /> Balanço do Casal (Divisão 50/50)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <span className="text-slate-500">👦 Você:</span> <strong className="text-slate-900">{formatCurrency(coupleSplitData.totalMarido)} ({coupleSplitData.pctMarido.toFixed(0)}%)</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">👧 Esposa:</span> <strong className="text-slate-900">{formatCurrency(coupleSplitData.totalEsposa)} ({coupleSplitData.pctEsposa.toFixed(0)}%)</strong>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">👥 Casal:</span> <strong className="text-slate-900">{formatCurrency(coupleSplitData.totalConjunto)}</strong>
                                        </div>
                                    </div>
                                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 mt-1">
                                        💡 {coupleSplitData.settlementText}
                                    </div>
                                </div>

                                {/* Bloco 2: Maiores Despesas por Categoria */}
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
                                        Despesas por Categoria
                                    </h3>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-slate-400 font-bold text-left">
                                                <th className="pb-1.5">Categoria</th>
                                                <th className="pb-1.5 text-right">% do Total</th>
                                                <th className="pb-1.5 text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {analysisData.data.map(item => (
                                                <tr key={item.name}>
                                                    <td className="py-2 font-bold text-slate-800">{item.name}</td>
                                                    <td className="py-2 text-right font-medium text-slate-500">{item.percentage.toFixed(1)}%</td>
                                                    <td className="py-2 text-right font-black text-slate-900">{formatCurrency(item.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bloco 3: Cofrinhos e Metas Ativas */}
                                {savingsGoals.length > 0 && (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                                            <PiggyBank size={14} className="text-amber-500" /> Progresso dos Cofrinhos & Sonhos
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            {savingsGoals.map(goal => {
                                                const pct = Math.min(100, Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100));
                                                return (
                                                    <div key={goal.id} className="p-2.5 bg-white rounded-xl border border-slate-200">
                                                        <div className="flex justify-between font-bold text-slate-800 mb-1">
                                                            <span>{goal.icon} {goal.title}</span>
                                                            <span>{pct}%</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] text-slate-500">
                                                            <span>{formatCurrency(goal.currentAmount)}</span>
                                                            <span>Meta: {formatCurrency(goal.targetAmount)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Bloco 4: Conquistas Desbloqueadas */}
                                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <Trophy size={16} className="text-amber-600" />
                                        <span className="font-extrabold text-amber-900">Nível do Casal: {coupleAchievements.levelTitle}</span>
                                    </div>
                                    <span className="font-bold text-amber-800">{coupleAchievements.unlockedCount}/{coupleAchievements.totalBadges} Conquistas</span>
                                </div>

                                {/* Rodapé do Relatório */}
                                <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium">
                                    FinançasPro • Planejamento Patrimonial e Gestão Financeira para Casais Inteligentes
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL DE COMANDO DE VOZ / ÁUDIO COM GEMINI IA */}
                {/* ========================================================================= */}
                {isVoiceModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => { setIsListeningVoice(false); setIsVoiceModalOpen(false); }}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-amber-500 animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">FinBot Voz IA</span>
                                </div>
                                <button
                                    onClick={() => { setIsListeningVoice(false); setIsVoiceModalOpen(false); }}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Botão de Gravação Direta / Status */}
                            <div className="py-1">
                                <div className="relative inline-flex items-center justify-center">
                                    {isListeningVoice && (
                                        <>
                                            <span className="absolute w-28 h-28 rounded-full bg-amber-400/20 animate-ping"></span>
                                            <span className="absolute w-20 h-20 rounded-full bg-amber-500/30 animate-pulse"></span>
                                        </>
                                    )}
                                    {isProcessingVoice && (
                                        <span className="absolute w-24 h-24 rounded-full bg-blue-500/20 animate-spin border-2 border-dashed border-blue-500"></span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={isListeningVoice ? handleStopVoiceRecording : handleStartVoiceRecording}
                                        disabled={isProcessingVoice}
                                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-xl transition-all relative z-10 ${isProcessingVoice
                                                ? 'bg-blue-600'
                                                : isListeningVoice
                                                    ? 'bg-rose-500 hover:bg-rose-600 scale-110 shadow-rose-500/40 animate-pulse'
                                                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30 active:scale-95'
                                            }`}
                                    >
                                        {isProcessingVoice ? (
                                            <Loader2 size={26} className="animate-spin" />
                                        ) : isListeningVoice ? (
                                            <Square size={22} className="fill-white" />
                                        ) : (
                                            <Mic size={26} />
                                        )}
                                    </button>
                                </div>

                                {isListeningVoice && (
                                    <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-black text-rose-500 animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                        <span>Gravando... 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
                                    </div>
                                )}
                            </div>

                            {/* Título & Instrução com Dica do Teclado iOS */}
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">
                                    {isProcessingVoice
                                        ? "FinBot IA analisando seu lançamento..."
                                        : isListeningVoice
                                            ? "Ouvindo sua voz! Toque no quadrado para enviar"
                                            : "Fale ou Dite sua despesa/receita"}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Fale o valor, local, forma de pagamento e quem pagou.
                                </p>
                            </div>

                            {/* Campo de Ditado / Digitação Rápida */}
                            <div className="space-y-2 text-left">
                                <div className="relative">
                                    <textarea
                                        rows={3}
                                        value={manualVoiceInput}
                                        onChange={(e) => setManualVoiceInput(e.target.value)}
                                        placeholder="Toque aqui e use o microfone 🎙️ do teclado do seu iPhone para ditar (ex: Gastei 45 no mercado no cartão pago por mim)"
                                        className="w-full text-xs font-medium text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && manualVoiceInput.trim()) {
                                                e.preventDefault();
                                                processVoiceExpenseWithAI(manualVoiceInput.trim());
                                            }
                                        }}
                                    />
                                </div>

                                {/* Dica amigável do iPhone */}
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                    <span className="text-sm">💡</span>
                                    <span>
                                        <strong>Dica de ouro no iPhone:</strong> Ao tocar na caixinha acima, toque no ícone de <strong>Microfone 🎙️ no teclado do celular</strong> para falar por voz com máxima precisão!
                                    </span>
                                </div>

                                {/* Exemplos Rápidos de Atalhos */}
                                <div className="space-y-1 pt-1">
                                    <span className="text-[10px] uppercase font-black text-slate-400">Exemplos para testar:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            'Almoço 35 no débito pago por mim',
                                            'Mercado 180 no crédito conjunto',
                                            'Gasolina 100 no pix esposa',
                                            'Salário 4500 conta principal'
                                        ].map((ex, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setManualVoiceInput(ex)}
                                                className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 px-2.5 py-1 rounded-lg transition"
                                            >
                                                {ex}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Botão Principal de Enviar para IA */}
                                <button
                                    type="button"
                                    disabled={!manualVoiceInput.trim() || isProcessingVoice}
                                    onClick={() => {
                                        if (manualVoiceInput.trim()) {
                                            processVoiceExpenseWithAI(manualVoiceInput.trim());
                                        }
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white text-xs font-black rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {isProcessingVoice ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>FinBot IA Processando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            <span>Lançar com Inteligência Artificial</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Botão de Cancelar */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleStopVoiceRecording();
                                        setIsVoiceModalOpen(false);
                                    }}
                                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* BOTÃO FLUTUANTE DE CHAT COM FINBOT IA */}
                {/* ========================================================================= */}
                <button
                    onClick={() => setIsFinbotChatOpen(true)}
                    className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-xl hover:shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 group border border-white/20"
                    title="Conversar com FinBot IA"
                >
                    <div className="relative">
                        <Bot size={22} className="text-white group-hover:rotate-12 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-purple-600 rounded-full animate-ping"></span>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-purple-600 rounded-full"></span>
                    </div>
                    <span className="hidden sm:inline text-xs font-black tracking-wide pr-1">FinBot IA</span>
                </button>

                {/* ========================================================================= */}
                {/* MODAL DE CHAT INTERATIVO COM FINBOT IA */}
                {/* ========================================================================= */}
                {isFinbotChatOpen && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-[92vh] sm:h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                            {/* Cabeçalho do Chat */}
                            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-between shadow-md shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner">
                                        <Bot size={22} className="text-amber-300" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-sm font-black tracking-tight">FinBot IA • Consultor do Casal</h3>
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        </div>
                                        <p className="text-[10px] text-blue-100 font-medium">Analisando suas finanças reais em tempo real</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsFinbotChatOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition active:scale-90"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Histórico de Mensagens */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
                                {chatMessages.map(msg => {
                                    const isUser = msg.sender === 'user';
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className="flex items-end gap-2 max-w-[85%]">
                                                {!isUser && (
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm mb-1">
                                                        🤖
                                                    </div>
                                                )}
                                                <div
                                                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${isUser
                                                            ? 'bg-blue-600 text-white rounded-br-sm shadow-md'
                                                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-800 shadow-sm whitespace-pre-line'
                                                        }`}
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-medium mt-1 px-1">
                                                {msg.timestamp}
                                            </span>
                                        </div>
                                    );
                                })}

                                {isSendingChatMessage && (
                                    <div className="flex items-end gap-2 max-w-[85%]">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm mb-1">
                                            🤖
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs flex items-center gap-2 text-slate-500">
                                            <Loader2 size={14} className="animate-spin text-purple-600" />
                                            <span>FinBot está analisando seus números...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatMessagesEndRef} />
                            </div>

                            {/* Sugestões Rápidas (Pills) */}
                            <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide flex gap-1.5 shrink-0">
                                <button
                                    onClick={() => handleSendFinbotChatMessage("Quanto ainda podemos gastar este mês sem estourar o orçamento?")}
                                    disabled={isSendingChatMessage}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-xl whitespace-nowrap transition shrink-0"
                                >
                                    💳 Quanto ainda podemos gastar?
                                </button>
                                <button
                                    onClick={() => handleSendFinbotChatMessage("Onde o dinheiro mais escapou este mês e onde podemos cortar?")}
                                    disabled={isSendingChatMessage}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-xl whitespace-nowrap transition shrink-0"
                                >
                                    🔍 Onde o dinheiro mais escapou?
                                </button>
                                <button
                                    onClick={() => handleSendFinbotChatMessage("Me dê 3 dicas práticas para economizarmos $500 no próximo mês.")}
                                    disabled={isSendingChatMessage}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-xl whitespace-nowrap transition shrink-0"
                                >
                                    💡 Como economizar $500?
                                </button>
                                <button
                                    onClick={() => handleSendFinbotChatMessage("Como podemos acelerar nossa meta de liberdade financeira (FIRE)?")}
                                    disabled={isSendingChatMessage}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-xl whitespace-nowrap transition shrink-0"
                                >
                                    🚀 Acelerar Liberdade FIRE
                                </button>
                            </div>

                            {/* Campo de Entrada e Envio */}
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSendFinbotChatMessage(); }}
                                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
                            >
                                <input
                                    type="text"
                                    value={finbotChatInput}
                                    onChange={(e) => setFinbotChatInput(e.target.value)}
                                    placeholder="Pergunte ao FinBot (use o teclado ou ditado)..."
                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 border border-transparent"
                                />
                                <button
                                    type="submit"
                                    disabled={!finbotChatInput.trim() || isSendingChatMessage}
                                    className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-40 hover:from-purple-700 hover:to-indigo-700 transition active:scale-95 shrink-0 shadow-md shadow-purple-500/20"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 1: NOVO FINANCIAMENTO */}
                {isFinancingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFinancingModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center text-xl shadow-inner">
                                        🚗
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Cadastrar Financiamento</h2>
                                        <p className="text-xs text-slate-400">Contrato com parcelas e débito automático</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsFinancingModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveFinancing} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título do Bem ou Contrato</label>
                                    <input
                                        type="text"
                                        required
                                        value={newFinancingData.title}
                                        onChange={(e) => setNewFinancingData({ ...newFinancingData, title: e.target.value })}
                                        placeholder="Ex: Financiamento Honda Civic, Apartamento..."
                                        className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Bem</label>
                                        <select
                                            value={newFinancingData.type}
                                            onChange={(e) => {
                                                const type = e.target.value;
                                                const icon = type === 'imovel' ? '🏠' : (type === 'veiculo' ? '🚗' : '💳');
                                                setNewFinancingData({ ...newFinancingData, type, icon });
                                            }}
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="veiculo">🚗 Veículo (Carro/Moto)</option>
                                            <option value="imovel">🏠 Imóvel (Casa/Apê)</option>
                                            <option value="emprestimo">💳 Empréstimo</option>
                                            <option value="outro">📦 Outro Bem</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor da Parcela ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={newFinancingData.installmentAmount}
                                            onChange={(e) => setNewFinancingData({ ...newFinancingData, installmentAmount: e.target.value })}
                                            placeholder="Ex: 1250.00"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Total Parcelas</label>
                                        <input
                                            type="number"
                                            required
                                            value={newFinancingData.totalInstallments}
                                            onChange={(e) => setNewFinancingData({ ...newFinancingData, totalInstallments: e.target.value })}
                                            placeholder="Ex: 48"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Já Pagas</label>
                                        <input
                                            type="number"
                                            value={newFinancingData.paidInstallments}
                                            onChange={(e) => setNewFinancingData({ ...newFinancingData, paidInstallments: e.target.value })}
                                            placeholder="Ex: 14"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dia Débito</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={newFinancingData.dueDay}
                                            onChange={(e) => setNewFinancingData({ ...newFinancingData, dueDay: e.target.value })}
                                            placeholder="Ex: 10"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Conta Debitada</label>
                                        <select
                                            value={newFinancingData.accountId}
                                            onChange={(e) => setNewFinancingData({ ...newFinancingData, accountId: e.target.value })}
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quem Paga</label>
                                        <select
                                            value={newFinancingData.paidBy}
                                            onChange={(e) => setNewFinancingData({ ...newFinancingData, paidBy: e.target.value })}
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="conjunto">Dividido (50/50)</option>
                                            <option value="marido">Você</option>
                                            <option value="esposa">Esposa</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-blue-600" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-white">Débito Automático Mensal</p>
                                            <p className="text-[10px] text-slate-400">Lançar parcela todo mês no fluxo de caixa</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={newFinancingData.autoDebit}
                                        onChange={(e) => setNewFinancingData({ ...newFinancingData, autoDebit: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded-lg"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-blue-600/30 transition active:scale-98 mt-2"
                                >
                                    Salvar Financiamento
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: ANALISADOR DE CONTRATO COM FINBOT IA */}
                {isContractAnalysisModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsContractAnalysisModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center text-xl shadow-inner">
                                        📄
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            Análise de Contrato
                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                IA Gemini
                                            </span>
                                        </h2>
                                        <p className="text-xs text-slate-400">Descubra quanto vai pagar até o final e economize juros</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsContractAnalysisModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            {!contractAnalysisResult ? (
                                <div className="space-y-4">
                                    {/* Upload de Arquivo PDF ou Foto do Contrato */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                            1. Enviar Arquivo PDF ou Foto do Contrato / Extrato
                                        </label>
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center hover:border-purple-500 transition relative bg-slate-50 dark:bg-slate-950/50">
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*,.pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    setContractFileName(file.name);
                                                    setContractFileMimeType(file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'));
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => setContractFileBase64(event.target.result);
                                                    reader.readAsDataURL(file);
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                            {contractFileBase64 ? (
                                                <div className="space-y-2">
                                                    {contractFileMimeType.includes('pdf') || contractFileName.toLowerCase().endsWith('.pdf') ? (
                                                        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto text-3xl shadow-sm border border-red-200 dark:border-red-900/40">
                                                            📄
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-2xl mx-auto overflow-hidden shadow-md">
                                                            <img src={contractFileBase64} alt="Preview" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs font-black text-emerald-600 truncate max-w-xs mx-auto">
                                                            {contractFileName || 'Documento anexado com sucesso!'}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400">
                                                            {contractFileMimeType.includes('pdf') || contractFileName.toLowerCase().endsWith('.pdf') ? 'Arquivo PDF pronto para análise' : 'Foto do contrato anexada'} • Toque para trocar
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl shadow-sm">
                                                            📄
                                                        </div>
                                                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl shadow-sm">
                                                            📸
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                            Toque para enviar seu <strong>Contrato em PDF</strong> ou <strong>Foto</strong>
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 block mt-0.5">
                                                            Suporta arquivos PDF de bancos/financeiras e fotos/câmera do celular
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ou Colar Texto do Contrato */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                            2. Ou cole dados adicionais / texto do contrato aqui
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={contractTextInput}
                                            onChange={(e) => setContractTextInput(e.target.value)}
                                            placeholder="Ex: Financiamento Santander Carro, 48x de R$ 1.250, taxa 1,49% a.m., faltam 34 parcelas..."
                                            className="w-full text-xs font-medium text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-purple-500 resize-none shadow-inner"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isAnalyzingContract || (!contractTextInput.trim() && !contractFileBase64)}
                                        onClick={handleAnalyzeContractWithAI}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 active:scale-98"
                                    >
                                        {isAnalyzingContract ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                FinBot IA Lendo PDF e Analisando Contrato...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} className="text-amber-300" />
                                                Analisar PDF / Contrato com IA
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                /* RESULTADO DO RAIO-X DO CONTRATO */
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 rounded-3xl space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                                                    {contractAnalysisResult.institution || 'Banco Financiador'}
                                                </span>
                                                <h3 className="text-xl font-black">{contractAnalysisResult.asset || 'Financiamento'}</h3>
                                            </div>
                                            <span className="text-2xl">🚗</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                                            <div className="bg-white/10 p-2.5 rounded-2xl">
                                                <span className="text-[9px] uppercase font-bold text-slate-300 block">Parcela</span>
                                                <p className="text-sm font-black text-white">{formatCurrency(contractAnalysisResult.installmentAmount)}</p>
                                            </div>
                                            <div className="bg-white/10 p-2.5 rounded-2xl">
                                                <span className="text-[9px] uppercase font-bold text-slate-300 block">Total a Pagar</span>
                                                <p className="text-sm font-black text-rose-300">{formatCurrency(contractAnalysisResult.totalToPay || (contractAnalysisResult.installmentAmount * contractAnalysisResult.totalInstallments))}</p>
                                            </div>
                                            <div className="bg-white/10 p-2.5 rounded-2xl">
                                                <span className="text-[9px] uppercase font-bold text-slate-300 block">Juros Totais</span>
                                                <p className="text-sm font-black text-amber-300">{formatCurrency(contractAnalysisResult.totalInterestPayable)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dica de Amortização da IA */}
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                                            <Zap size={16} /> Estratégia de Economia por Amortização:
                                        </div>
                                        <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed font-medium">
                                            {contractAnalysisResult.amortizationSavingsTips || "Amortizar parcelas de trás para frente elimina todo o juro embutido e reduz drasticamente o tempo total do financiamento."}
                                        </p>
                                    </div>

                                    {/* Resumo do Diagnóstico */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        <p className="font-bold text-slate-800 dark:text-white mb-1">Diagnóstico do FinBot:</p>
                                        {contractAnalysisResult.summaryText}
                                    </div>

                                    {/* Botões de Ação */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleApplyContractAnalysisToForm}
                                            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <Check size={16} /> Cadastrar Financiamento no App com 1 Toque
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setContractAnalysisResult(null)}
                                            className="p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold transition"
                                        >
                                            Reanalisar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MODAL 3: SIMULADOR DE AMORTIZAÇÃO */}
                {isAmortizationModalOpen && selectedFinancingForAmortization && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAmortizationModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-xl shadow-inner">
                                        ⚡
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Simulador de Amortização</h2>
                                        <p className="text-xs text-slate-400">{selectedFinancingForAmortization.title}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAmortizationModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            {(() => {
                                const fin = selectedFinancingForAmortization;
                                const total = Number(fin.totalInstallments) || 1;
                                const paid = Number(fin.paidInstallments) || 0;
                                const remaining = Math.max(1, total - paid);
                                const count = Math.min(remaining, Math.max(1, amortizationPrepayCount));
                                const instAmt = Number(fin.installmentAmount) || 0;
                                const nominalTotal = instAmt * count;
                                // Estimativa de desconto em juros amortizando a última parcela (~45% a 65% de desconto de juros na ponta final)
                                const estimatedInterestDiscount = nominalTotal * 0.45;
                                const estimatedPresentValue = nominalTotal - estimatedInterestDiscount;

                                return (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase">
                                                    Quantas parcelas antecipar?
                                                </label>
                                                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                                                    {count} {count > 1 ? 'parcelas' : 'parcela'}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max={remaining}
                                                value={count}
                                                onChange={(e) => setAmortizationPrepayCount(parseInt(e.target.value, 10))}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                <span>1 parcela</span>
                                                <span>Restam {remaining} parcelas</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Valor Nominal das Parcelas:</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(nominalTotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-emerald-600 font-bold">Economia Estimada em Juros:</span>
                                                <span className="font-black text-emerald-600">-{formatCurrency(estimatedInterestDiscount)}</span>
                                            </div>
                                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-black">
                                                <span className="text-slate-800 dark:text-white">Você paga apenas (saldo devedor):</span>
                                                <span className="text-purple-600 dark:text-purple-400 text-base">{formatCurrency(estimatedPresentValue)}</span>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                            <Sparkles size={16} className="shrink-0" />
                                            <span>
                                                Ao antecipar <strong>{count} {count > 1 ? 'parcelas' : 'parcela'}</strong>, o financiamento termina <strong>{count} {count > 1 ? 'meses' : 'mês'} antes</strong>!
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handlePrepayInstallment(fin.id, count)}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 active:scale-98"
                                        >
                                            <Zap size={16} className="text-amber-300" />
                                            Abater {count} {count > 1 ? 'Parcelas' : 'Parcela'} Agora
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL AJUSTAR CUSTOS DO VEÍCULO NOS EUA (TCO) */}
                {/* ========================================================================= */}
                {isCarCostsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCarCostsModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                                        ⛽
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800 dark:text-white">Custos do Carro nos EUA</h2>
                                        <p className="text-xs text-slate-400">Seguro, gasolina, manutenção e pedágios</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCarCostsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                setIsCarCostsModalOpen(false);
                                showToast("Custos do veículo atualizados com sucesso!");
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Seguro Auto / Insurance ($/mês)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        required
                                        value={carExtraCosts.insurance}
                                        onChange={(e) => setCarExtraCosts({ ...carExtraCosts, insurance: Number(e.target.value) || 0 })}
                                        placeholder="160"
                                        className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Gasolina / Combustível Estimado ($/mês)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        required
                                        value={carExtraCosts.gasMonthly}
                                        onChange={(e) => setCarExtraCosts({ ...carExtraCosts, gasMonthly: Number(e.target.value) || 0 })}
                                        placeholder="140"
                                        className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Manutenção ($/mês)</label>
                                        <input
                                            type="number"
                                            step="1"
                                            value={carExtraCosts.maintenance}
                                            onChange={(e) => setCarExtraCosts({ ...carExtraCosts, maintenance: Number(e.target.value) || 0 })}
                                            placeholder="45"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Pedágios / SunPass ($/mês)</label>
                                        <input
                                            type="number"
                                            step="1"
                                            value={carExtraCosts.tolls}
                                            onChange={(e) => setCarExtraCosts({ ...carExtraCosts, tolls: Number(e.target.value) || 0 })}
                                            placeholder="25"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-blue-600/30 transition active:scale-98 mt-2"
                                >
                                    Salvar Custos do Veículo
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL DE CONEXÃO BANCÁRIA & CARTÕES EUA (PLAID / APPLE PAY) */}
                {/* ========================================================================= */}
                {isPlaidModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPlaidModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md">
                                        💳
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-black text-slate-800 dark:text-white">Cartões & Bancos EUA</h2>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                                Zero Custo ($0.00)
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">Sincronize gastos do casal no Chase, Amex, BofA ou Apple Pay</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsPlaidModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Navegação de Abas do Modal */}
                            <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl gap-1 text-xs font-bold">
                                <button
                                    onClick={() => setPlaidActiveTab('cards')}
                                    className={`flex-1 py-2 px-3 rounded-xl transition ${plaidActiveTab === 'cards' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    💳 Cartões ({connectedCards.length})
                                </button>
                                <button
                                    onClick={() => setPlaidActiveTab('add')}
                                    className={`flex-1 py-2 px-3 rounded-xl transition ${plaidActiveTab === 'add' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    + Vincular
                                </button>
                                <button
                                    onClick={() => setPlaidActiveTab('applepay')}
                                    className={`flex-1 py-2 px-3 rounded-xl transition ${plaidActiveTab === 'applepay' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    🍎 Apple Pay
                                </button>
                                <button
                                    onClick={() => setPlaidActiveTab('config')}
                                    className={`py-2 px-3 rounded-xl transition ${plaidActiveTab === 'config' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    ⚙️ Plaid API
                                </button>
                            </div>

                            {/* ABA 1: LISTA DE CARTÕES CONECTADOS */}
                            {plaidActiveTab === 'cards' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold text-slate-500">Cartões sincronizados para o casal:</span>
                                        <button
                                            onClick={() => setPlaidActiveTab('add')}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            + Adicionar outro cartão
                                        </button>
                                    </div>

                                    {connectedCards.length === 0 ? (
                                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                                            <p className="text-xs font-bold text-slate-500">Nenhum cartão cadastrado ainda</p>
                                            <button
                                                onClick={() => setPlaidActiveTab('add')}
                                                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-2xl shadow-sm"
                                            >
                                                + Vincular Primeiro Cartão
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {connectedCards.map(card => (
                                                <div
                                                    key={card.id}
                                                    className={`p-4 rounded-3xl bg-gradient-to-r ${card.color} text-white shadow-md flex flex-col justify-between space-y-3 relative overflow-hidden`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">💳</span>
                                                                <h4 className="font-black text-sm">{card.institution}</h4>
                                                                <span className="text-[10px] font-mono opacity-80">•••• {card.mask}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
                                                                    {card.owner === 'marido' ? '👤 Marido' : (card.owner === 'esposa' ? '👩 Esposa' : '👥 Conjunto')}
                                                                </span>
                                                                <span className="text-[10px] opacity-75">
                                                                    Sincronizado: {card.lastSync}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] opacity-75 block">Fatura Atual</span>
                                                            <span className="text-base font-black">{formatCurrency(card.balance)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-white/10 flex justify-between items-center gap-2">
                                                        <span className="text-[10px] opacity-80">Status: Conectado</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveConnectedCard(card.id)}
                                                                className="px-2.5 py-1 bg-black/20 hover:bg-black/40 text-[11px] font-bold rounded-xl transition"
                                                            >
                                                                Remover
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSyncPlaidCard(card.id)}
                                                                disabled={isSyncingPlaid}
                                                                className="px-3 py-1.5 bg-white text-slate-900 hover:bg-white/90 text-xs font-black rounded-xl transition shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                                                            >
                                                                {isSyncingPlaid ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                                                                Sincronizar Agora
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                                        <Sparkles size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                        <p className="leading-relaxed">
                                            <strong>Dica do Casal:</strong> Ao sincronizar, as compras são categorizadas automaticamente e já entram na divisão 50/50 de quem realizou a compra!
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ABA 2: VINCULAR NOVO CARTÃO */}
                            {plaidActiveTab === 'add' && (
                                <div className="space-y-4">
                                    {/* Opção 1: Conectar Direto com o Banco Oficial */}
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-3xl border border-blue-200 dark:border-blue-800/80 space-y-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-sm font-black">
                                                ⚡
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-xs">Conexão Oficial com o Banco (Plaid Link)</h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Faça login com Face ID no Chase, Amex, BofA, Wells Fargo, etc.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenOfficialPlaidLink(newCardForm.owner)}
                                                disabled={isSyncingPlaid}
                                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                {isSyncingPlaid ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                                                Abrir Login Oficial do Banco (Plaid)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 my-2">
                                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">ou cadastre com 4 dígitos abaixo</span>
                                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                                    </div>

                                    <form onSubmit={handleAddConnectedCard} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Banco / Emissor nos EUA</label>
                                            <select
                                                value={newCardForm.institution}
                                                onChange={(e) => setNewCardForm({ ...newCardForm, institution: e.target.value })}
                                                className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                            <option value="Chase Sapphire / Freedom">Chase (Sapphire / Freedom / Slate)</option>
                                            <option value="American Express Gold / Platinum">American Express (Amex Gold / Platinum / Blue)</option>
                                            <option value="Bank of America Customized">Bank of America (Customized / Travel)</option>
                                            <option value="Wells Fargo Active Cash">Wells Fargo (Active Cash / Autograph)</option>
                                            <option value="Capital One Venture / Savor">Capital One (Venture / SavorOne)</option>
                                            <option value="Citi Double Cash / Custom">Citibank (Double Cash / Custom Cash)</option>
                                            <option value="Discover it">Discover it</option>
                                            <option value="Apple Card (Goldman Sachs)">Apple Card (Mastercard)</option>
                                            <option value="Venmo (PayPal / Synchrony)">Venmo (Conta & Cartão Venmo)</option>
                                            <option value="Zelle / Cash App">Cash App / Zelle</option>
                                            <option value="Outro Banco / Cooperativa">Outro Banco Americano</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">De quem é este cartão?</label>
                                            <select
                                                value={newCardForm.owner}
                                                onChange={(e) => setNewCardForm({ ...newCardForm, owner: e.target.value })}
                                                className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="marido">👤 Marido (Você)</option>
                                                <option value="esposa">👩 Esposa</option>
                                                <option value="conjunto">👥 Conta Conjunta</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">4 Últimos Dígitos</label>
                                            <input
                                                type="text"
                                                maxLength={4}
                                                value={newCardForm.mask}
                                                onChange={(e) => setNewCardForm({ ...newCardForm, mask: e.target.value.replace(/\D/g, '') })}
                                                placeholder="4821"
                                                className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-widest"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Saldo Atual da Fatura ($ USD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newCardForm.initialBalance}
                                            onChange={(e) => setNewCardForm({ ...newCardForm, initialBalance: e.target.value })}
                                            placeholder="Ex: 850.00"
                                            className="w-full text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-blue-600/30 transition active:scale-98 mt-2"
                                    >
                                        💳 Vincular Cartão ao Aplicativo
                                    </button>
                                </form>
                                </div>
                            )}

                            {/* ABA 3: AUTOMAÇÃO APPLE PAY (IPHONE) */}
                            {plaidActiveTab === 'applepay' && (
                                <div className="space-y-4 text-slate-700 dark:text-slate-200 text-xs">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                                            <span>🍎</span>
                                            <span>Como ativar a sincronização instantânea no iPhone:</span>
                                        </div>
                                        <p className="text-slate-500 leading-relaxed">
                                            Você e sua esposa podem criar uma automação no app <strong>Atalhos (Shortcuts)</strong> do iOS em menos de 1 minuto:
                                        </p>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">1</span>
                                            <div>
                                                <p className="font-bold">Abra o app "Atalhos" (Shortcuts) no iPhone</p>
                                                <p className="text-slate-400 text-[11px]">Toque na aba central <strong>Automação</strong> ➔ <strong>Criar Automação Pessoal</strong>.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">2</span>
                                            <div>
                                                <p className="font-bold">Selecione "Transação" (Apple Pay)</p>
                                                <p className="text-slate-400 text-[11px]">Escolha o seu cartão (ou o da esposa) e marque "Executar Imediatamente".</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">3</span>
                                            <div>
                                                <p className="font-bold">Adicione o Webhook Instantâneo</p>
                                                <p className="text-slate-400 text-[11px]">Cole o link abaixo na ação <em>Obter Conteúdo de URL</em> para registrar automaticamente.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] flex justify-between items-center gap-2">
                                        <span className="truncate">{window.location.origin}/api/webhook/apple-pay</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/api/webhook/apple-pay`);
                                                showToast("Link do Webhook copiado!");
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-sans font-bold text-xs shrink-0"
                                        >
                                            Copiar Link
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ABA 4: CONFIGURAÇÃO PLAID API */}
                            {plaidActiveTab === 'config' && (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    showToast("Configuração do Plaid salva com sucesso!");
                                    setPlaidActiveTab('cards');
                                }} className="space-y-4 text-xs">
                                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                                        <p className="font-bold">Como obter suas chaves gratuitas do Plaid ($0.00):</p>
                                        <p className="mt-1 opacity-90 leading-relaxed">
                                            1. Acesse <strong>dashboard.plaid.com</strong> e crie uma conta gratuita.<br />
                                            2. Vá em <em>Keys</em> e copie seu <strong>Client ID</strong> e <strong>Secret</strong> de desenvolvimento (gratuito para até 100 contas).
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-400 uppercase mb-1">Plaid Client ID</label>
                                        <input
                                            type="text"
                                            value={plaidConfig.clientId}
                                            onChange={(e) => setPlaidConfig({ ...plaidConfig, clientId: e.target.value })}
                                            placeholder="Ex: 64a8b... (deixe em branco para modo simulação)"
                                            className="w-full text-xs font-mono text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-400 uppercase mb-1">Plaid Secret Key</label>
                                        <input
                                            type="password"
                                            value={plaidConfig.secret}
                                            onChange={(e) => setPlaidConfig({ ...plaidConfig, secret: e.target.value })}
                                            placeholder="••••••••••••••••••••••••••••••"
                                            className="w-full text-xs font-mono text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-400 uppercase mb-1">Ambiente</label>
                                        <select
                                            value={plaidConfig.environment}
                                            onChange={(e) => setPlaidConfig({ ...plaidConfig, environment: e.target.value })}
                                            className="w-full font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="sandbox">Sandbox (Demonstração e Testes Imediatos)</option>
                                            <option value="development">Development (Bancos Reais dos EUA - Gratuito)</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-600/30 transition active:scale-98"
                                    >
                                        Salvar Chaves Plaid
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL DE GESTÃO DE CONTAS FIXAS & CONTRATOS COM VIGÊNCIA */}
                {/* ========================================================================= */}
                {isFixedBillsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFixedBillsModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-2xl">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                            {fixedBillEditing ? 'Editar Conta Fixa' : 'Nova Conta Fixa / Contrato'}
                                        </h3>
                                        <p className="text-xs text-slate-400">Configure aluguel contínuo, seguros temporários ou assinaturas</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsFixedBillsModalOpen(false)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveFixedBill} className="space-y-4">
                                {/* Tipo (Saída / Entrada) */}
                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Tipo</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFixedBillForm(prev => ({
                                                ...prev,
                                                type: 'saida',
                                                category: (allCategories.saida && allCategories.saida[0]) || 'Casa'
                                            }))}
                                            className={`py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 ${fixedBillForm.type === 'saida' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <ArrowDown size={14} /> Despesa Fixa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFixedBillForm(prev => ({
                                                ...prev,
                                                type: 'entrada',
                                                category: (allCategories.entrada && allCategories.entrada[0]) || 'Salário'
                                            }))}
                                            className={`py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 ${fixedBillForm.type === 'entrada' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <ArrowUp size={14} /> Receita Fixa
                                        </button>
                                    </div>
                                </div>

                                {/* Descrição */}
                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Descrição da Conta</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Seguro do Carro, Aluguel, Academia, Netflix..."
                                        value={fixedBillForm.description}
                                        onChange={e => setFixedBillForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                {/* Valor & Dia de Vencimento */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Valor Mensal ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0.00"
                                            value={fixedBillForm.amount}
                                            onChange={e => setFixedBillForm(prev => ({ ...prev, amount: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Dia de Cobrança</label>
                                        <select
                                            value={fixedBillForm.day}
                                            onChange={e => setFixedBillForm(prev => ({ ...prev, day: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d}>Todo dia {d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Categoria & Quem Paga */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Categoria</label>
                                        <select
                                            value={fixedBillForm.category}
                                            onChange={e => setFixedBillForm(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            {(allCategories[fixedBillForm.type] || allCategories.saida || []).map(catName => (
                                                <option key={catName} value={catName}>{catName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Responsável</label>
                                        <select
                                            value={fixedBillForm.paidBy}
                                            onChange={e => setFixedBillForm(prev => ({ ...prev, paidBy: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="conjunto">👥 Conjunto (Casal)</option>
                                            <option value="marido">👦 Marido</option>
                                            <option value="esposa">👧 Esposa</option>
                                        </select>
                                    </div>
                                </div>

                                {/* SELEÇÃO DE VIGÊNCIA (INDETERMINADO VS TEMPO FIXO) */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Vigência / Duração do Contrato</label>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setFixedBillForm(prev => ({ ...prev, durationMode: 'indefinite' }))}
                                            className={`p-3 rounded-2xl text-left border transition ${fixedBillForm.durationMode === 'indefinite' ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <span className="block font-black text-xs">♾️ Indeterminado</span>
                                            <span className="text-[10px] text-slate-400">Ex: Aluguel contínuo, até você mudar</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFixedBillForm(prev => ({ ...prev, durationMode: 'fixed' }))}
                                            className={`p-3 rounded-2xl text-left border transition ${fixedBillForm.durationMode === 'fixed' ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <span className="block font-black text-xs">⏳ Período Fixo</span>
                                            <span className="text-[10px] text-slate-400">Ex: Seguro de carro por 4 meses</span>
                                        </button>
                                    </div>

                                    {/* Opções de Período Fixo */}
                                    {fixedBillForm.durationMode === 'fixed' && (
                                        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-3 animate-in fade-in">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 block mb-1">Mês de Início</label>
                                                    <input
                                                        type="month"
                                                        value={fixedBillForm.startMonth}
                                                        onChange={e => setFixedBillForm(prev => ({ ...prev, startMonth: e.target.value }))}
                                                        className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 block mb-1">Duração (Meses)</label>
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="120"
                                                            required
                                                            placeholder="Ex: 1, 4, 5, 7..."
                                                            value={fixedBillForm.durationMonths}
                                                            onChange={e => setFixedBillForm(prev => ({ ...prev, durationMonths: e.target.value }))}
                                                            className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                        />
                                                        <span className="absolute right-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">meses</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                                💡 Esta conta estará ativa pelos próximos <strong>{fixedBillForm.durationMonths} meses</strong> a partir de <strong>{fixedBillForm.startMonth}</strong>. Quando expirar, o app emitirá um lembrete para renovação ou ajuste de valor!
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsFixedBillsModalOpen(false)}
                                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs text-slate-600 dark:text-slate-300 rounded-2xl transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 font-black text-xs text-white rounded-2xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> {fixedBillEditing ? 'Salvar Alterações' : 'Cadastrar Conta Fixa'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODAL DE RENOVAÇÃO RÁPIDA DE CONTRATO */}
                {/* ========================================================================= */}
                {isRenewModalOpen && renewingBill && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRenewModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-500 rounded-2xl">
                                        <RotateCcw size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Renovar Contrato</h3>
                                        <p className="text-xs text-slate-400">{renewingBill.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsRenewModalOpen(false)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-2xl transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleRenewFixedBill} className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                                        <span>Valor Anterior</span>
                                        <span className="font-bold text-slate-600 dark:text-slate-300">{formatCurrency(renewingBill.amount)}/mês</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <span>Duração Anterior</span>
                                        <span className="font-bold text-slate-600 dark:text-slate-300">{renewingBill.durationMonths || 4} meses</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Novo Valor Mensal ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={renewFormData.newAmount}
                                        onChange={e => setRenewFormData(prev => ({ ...prev, newAmount: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Prorrogar por mais (Meses):</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            min="1"
                                            max="120"
                                            required
                                            placeholder="Digite a quantidade (ex: 1, 4, 5, 7...)"
                                            value={renewFormData.extendMonths}
                                            onChange={e => setRenewFormData(prev => ({ ...prev, extendMonths: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="absolute right-4 text-xs font-bold text-slate-400 pointer-events-none">meses</span>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsRenewModalOpen(false)}
                                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs text-slate-600 dark:text-slate-300 rounded-2xl transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 font-black text-xs text-white rounded-2xl transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> Confirmar Renovação
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TELA DE BLOQUEIO POR PIN (APP LOCK SCREEN OVERLAY) */}
                {/* ========================================================================= */}
                {isAppLocked && (
                    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-in fade-in duration-300">
                        {/* Cabeçalho do Bloqueio */}
                        <div className="text-center pt-8 space-y-3">
                            <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 animate-pulse">
                                <Lock size={32} />
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tight">FinançasPro</h1>
                            <p className="text-xs text-slate-400 font-medium">Digite seu PIN de 4 dígitos para acessar</p>
                        </div>

                        {/* Indicador visual de bolinhas do PIN */}
                        <div className="my-auto py-6">
                            <div className={`flex items-center justify-center gap-4 transition-transform ${pinError ? 'animate-bounce text-rose-500' : ''}`}>
                                {[0, 1, 2, 3].map((idx) => {
                                    const isFilled = enteredPin.length > idx;
                                    return (
                                        <div
                                            key={idx}
                                            className={`w-4 h-4 rounded-full transition-all duration-200 ${pinError
                                                    ? 'bg-rose-500 scale-125 ring-4 ring-rose-500/30'
                                                    : isFilled
                                                        ? 'bg-blue-500 scale-125 ring-4 ring-blue-500/30 shadow-lg shadow-blue-500/50'
                                                        : 'bg-slate-800 border border-slate-700'
                                                }`}
                                        />
                                    );
                                })}
                            </div>
                            {pinError && (
                                <p className="text-center text-xs font-bold text-rose-400 mt-4 animate-in fade-in">
                                    PIN incorreto. Tente novamente.
                                </p>
                            )}
                        </div>

                        {/* Teclado Numérico Tátil (Touch Keypad) */}
                        <div className="w-full max-w-xs pb-6">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => handlePinKeyPress(String(num))}
                                        className="h-16 rounded-3xl bg-slate-900/80 hover:bg-slate-800 active:bg-blue-600/40 border border-slate-800 text-white font-black text-2xl flex items-center justify-center transition active:scale-90 shadow-lg"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setEnteredPin('')}
                                    className="h-16 rounded-3xl bg-transparent hover:bg-slate-900 text-slate-500 font-bold text-xs flex items-center justify-center transition active:scale-95 uppercase tracking-wider"
                                >
                                    Limpar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePinKeyPress('0')}
                                    className="h-16 rounded-3xl bg-slate-900/80 hover:bg-slate-800 active:bg-blue-600/40 border border-slate-800 text-white font-black text-2xl flex items-center justify-center transition active:scale-90 shadow-lg"
                                >
                                    0
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePinDelete}
                                    className="h-16 rounded-3xl bg-transparent hover:bg-slate-900 text-slate-400 flex items-center justify-center transition active:scale-95 text-lg"
                                >
                                    ⌫
                                </button>
                            </div>

                            {/* Botão de Emergência */}
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm("Esqueceu o PIN? Deseja redefinir entrando novamente na sua conta?")) {
                                            handleRemoveAppPin();
                                        }
                                    }}
                                    className="text-[11px] font-bold text-slate-500 hover:text-slate-300 transition"
                                >
                                    Esqueci meu PIN
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
