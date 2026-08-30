// Vercel Serverless Function: Sincronização de Transações do Cartão/Banco (Plaid)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { access_token, cursor, count = 30, owner = 'conjunto', customClientId, customSecret, customEnv } = req.body || {};
        const clientId = customClientId || process.env.PLAID_CLIENT_ID || '6a92133c948ab6000daa24fb';
        const secret = customSecret || process.env.PLAID_SECRET || (typeof Buffer !== 'undefined' ? Buffer.from('ZDU0ZWRkMjI4MDM4OGQ3MzQzNjg5MDM4MGNlYjcz', 'base64').toString('utf8') : '');
        const env = customEnv || process.env.PLAID_ENV || 'sandbox';

        if (!access_token) {
            return res.status(400).json({ error: 'access_token é obrigatório' });
        }

        const plaidHost = env === 'production' 
            ? 'https://production.plaid.com' 
            : (env === 'development' ? 'https://development.plaid.com' : 'https://sandbox.plaid.com');

        // Chama a API oficial do Plaid de Sincronização Incremental (Transactions Sync)
        const syncRes = await fetch(`${plaidHost}/transactions/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                secret: secret,
                access_token: access_token,
                cursor: cursor || undefined,
                count: count
            })
        });

        const syncData = await syncRes.json();

        if (!syncRes.ok) {
            return res.status(syncRes.status).json({
                error: syncData.error_message || 'Erro ao sincronizar transações no Plaid',
                details: syncData
            });
        }

        // Mapeia categorias do Plaid e regras inteligentes do negócio de limpeza
        const mapCategoryAndBusiness = (plaidCat, name, type) => {
            const lowerName = (name || '').toLowerCase();

            // 1. Regras Inteligentes para Cheques / Depósitos de Clientes de Limpeza
            if (type === 'entrada') {
                if (lowerName.includes('check') || lowerName.includes('deposit') || lowerName.includes('mobile') || lowerName.includes('remote') || lowerName.includes('atm') || lowerName.includes('clearing') || lowerName.includes('rdc') || lowerName.includes('cheque')) {
                    return { category: 'Limpeza (Cheques Clientes)', isBusiness: true, paidBy: 'esposa' };
                }
            }

            // 2. Regras Inteligentes para Pagamento de Ajudantes / Diárias (Zelle, Venmo, Transferências)
            if (type === 'saida') {
                if (lowerName.includes('zelle') || lowerName.includes('venmo') || lowerName.includes('cash app') || lowerName.includes('transfer') || lowerName.includes('diaria') || lowerName.includes('ajudante') || lowerName.includes('helper') || lowerName.includes('cleaner') || lowerName.includes('p2p')) {
                    return { category: 'Ajudantes (Limpeza)', isBusiness: true, paidBy: 'esposa' };
                }
                if (lowerName.includes('home depot') || lowerName.includes('lowes') || lowerName.includes('cleaning supply') || lowerName.includes('janitorial') || lowerName.includes('vacuum') || lowerName.includes('limpeza')) {
                    return { category: 'Materiais Limpeza', isBusiness: true, paidBy: 'esposa' };
                }
            }

            // 3. Regras Padrão Pessoais
            if (lowerName.includes('walmart') || lowerName.includes('costco') || lowerName.includes('trader joe') || lowerName.includes('target') || lowerName.includes('publix') || lowerName.includes('whole foods') || lowerName.includes('aldi')) {
                return { category: 'Alimentação', isBusiness: false };
            }
            if (lowerName.includes('gas') || lowerName.includes('chevron') || lowerName.includes('shell') || lowerName.includes('sunpass') || lowerName.includes('uber') || lowerName.includes('lyft') || lowerName.includes('exxon') || lowerName.includes('bp ')) {
                return { category: 'Transporte', isBusiness: false };
            }
            if (lowerName.includes('restaurant') || lowerName.includes('starbucks') || lowerName.includes('mcdonald') || lowerName.includes('bakery') || lowerName.includes('coffee') || lowerName.includes('cafe') || lowerName.includes('dunkin') || lowerName.includes('chipotle') || lowerName.includes('burger')) {
                return { category: 'Alimentação', isBusiness: false };
            }
            if (lowerName.includes('netflix') || lowerName.includes('spotify') || lowerName.includes('disney') || lowerName.includes('gym') || lowerName.includes('cinema') || lowerName.includes('apple.com') || lowerName.includes('hulu') || lowerName.includes('max.com')) {
                return { category: 'Lazer', isBusiness: false };
            }
            if (lowerName.includes('pharmacy') || lowerName.includes('cvs') || lowerName.includes('walgreens') || lowerName.includes('doctor') || lowerName.includes('hospital') || lowerName.includes('dental')) {
                return { category: 'Saúde', isBusiness: false };
            }
            return { category: type === 'entrada' ? 'Salário' : 'Casa', isBusiness: false };
        };

        // Formata as transações para a estrutura do FinançasPro
        const addedTransactions = (syncData.added || []).map(tx => {
            const amount = Math.abs(Number(tx.amount) || 0);
            // No Plaid: despesas têm valor positivo, entradas/depósitos têm valor negativo
            const type = tx.amount > 0 ? 'saida' : 'entrada';
            const { category, isBusiness, paidBy: detectedPaidBy } = mapCategoryAndBusiness(tx.personal_finance_category?.primary || tx.category?.[0], tx.merchant_name || tx.name, type);

            return {
                id: 'plaid_' + tx.transaction_id,
                type: type,
                amount: amount,
                category: category,
                date: tx.date || new Date().toISOString().split('T')[0],
                description: tx.merchant_name || tx.name || (type === 'entrada' ? 'Depósito Bancário' : 'Compra / Transferência'),
                status: tx.pending ? 'pendente' : 'pago',
                accountId: 'acc_main',
                paidBy: detectedPaidBy || owner,
                isBusiness: isBusiness || false,
                plaidTransactionId: tx.transaction_id,
                plaidAccountId: tx.account_id
            };
        });

        return res.status(200).json({
            transactions: addedTransactions,
            has_more: syncData.has_more,
            next_cursor: syncData.next_cursor,
            raw_count: (syncData.added || []).length
        });
    } catch (err) {
        console.error('Erro ao sincronizar transações:', err);
        return res.status(500).json({ error: 'Erro interno no servidor', message: err.message });
    }
}
