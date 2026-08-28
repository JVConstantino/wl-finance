// Vercel Serverless Function: Webhook do Plaid para Recebimento em Tempo Real (24/7)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const webhookData = req.body || {};
        const { webhook_type, webhook_code, item_id, new_transactions } = webhookData;

        console.log(`[Plaid Webhook Recebido] Tipo: ${webhook_type} | Código: ${webhook_code} | Item: ${item_id}`);

        // O Plaid avisa quando novas compras são registradas no banco
        if (webhook_type === 'TRANSACTIONS') {
            if (webhook_code === 'SYNC_UPDATES_AVAILABLE' || webhook_code === 'DEFAULT_UPDATE' || webhook_code === 'INITIAL_UPDATE') {
                console.log(`[Plaid Webhook] ${new_transactions || 'Várias'} novas transações disponíveis para o item ${item_id}!`);
            }
        }

        // Responde com sucesso 200 para confirmar recebimento ao Plaid
        return res.status(200).json({ received: true, timestamp: new Date().toISOString() });
    } catch (err) {
        console.error('Erro ao processar webhook Plaid:', err);
        return res.status(500).json({ error: 'Erro ao processar webhook', message: err.message });
    }
}
