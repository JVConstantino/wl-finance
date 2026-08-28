// Vercel Serverless Function: Troca de Public Token por Access Token no Plaid
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
        const { public_token, customClientId, customSecret, customEnv } = req.body || {};
        const clientId = customClientId || process.env.PLAID_CLIENT_ID;
        const secret = customSecret || process.env.PLAID_SECRET;
        const env = customEnv || process.env.PLAID_ENV || 'sandbox';

        if (!public_token) {
            return res.status(400).json({ error: 'public_token é obrigatório' });
        }

        const plaidHost = env === 'production' 
            ? 'https://production.plaid.com' 
            : (env === 'development' ? 'https://development.plaid.com' : 'https://sandbox.plaid.com');

        // 1. Troca o token
        const exchangeRes = await fetch(`${plaidHost}/item/public_token/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                secret: secret,
                public_token: public_token
            })
        });

        const exchangeData = await exchangeRes.json();

        if (!exchangeRes.ok) {
            return res.status(exchangeRes.status).json({
                error: exchangeData.error_message || 'Erro ao trocar token no Plaid',
                details: exchangeData
            });
        }

        const accessToken = exchangeData.access_token;
        const itemId = exchangeData.item_id;

        // 2. Busca as contas e saldos associados ao cartão/banco
        const accountsRes = await fetch(`${plaidHost}/accounts/balance/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                secret: secret,
                access_token: accessToken
            })
        });

        const accountsData = await accountsRes.json();

        return res.status(200).json({
            access_token: accessToken,
            item_id: itemId,
            accounts: accountsData.accounts || [],
            item: accountsData.item || {}
        });
    } catch (err) {
        console.error('Erro ao trocar Public Token Plaid:', err);
        return res.status(500).json({ error: 'Erro interno no servidor', message: err.message });
    }
}
