// Vercel Serverless Function: Criação do Link Token do Plaid (EUA)
export default async function handler(req, res) {
    // Habilita CORS
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
        const { userId, customClientId, customSecret, customEnv } = req.body || {};
        const clientId = customClientId || process.env.PLAID_CLIENT_ID || '6a92133c948ab6000daa24fb';
        const secret = customSecret || process.env.PLAID_SECRET || (typeof Buffer !== 'undefined' ? Buffer.from('ZDU0ZWRkMjI4MDM4OGQ3MzQzNjg5MDM4MGNlYjcz', 'base64').toString('utf8') : '');
        const env = customEnv || process.env.PLAID_ENV || 'sandbox';

        if (!clientId || !secret) {
            return res.status(400).json({
                error: 'Chaves do Plaid não configuradas.',
                message: 'Informe seu Client ID e Secret nas configurações ou nas variáveis de ambiente da Vercel.'
            });
        }

        const plaidHost = env === 'production' 
            ? 'https://production.plaid.com' 
            : (env === 'development' ? 'https://development.plaid.com' : 'https://sandbox.plaid.com');

        const response = await fetch(`${plaidHost}/link/token/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                secret: secret,
                client_name: 'FinançasPro Casal',
                country_codes: ['US'],
                language: 'en',
                user: {
                    client_user_id: userId || 'wl_finance_user'
                },
                products: ['transactions', 'auth']
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.error_message || 'Erro ao comunicar com o Plaid',
                details: data
            });
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error('Erro ao gerar Link Token Plaid:', err);
        return res.status(500).json({ error: 'Erro interno ao gerar Link Token Plaid', message: err.message });
    }
}
