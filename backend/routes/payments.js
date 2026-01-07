// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../database');

// Supported currencies
const SUPPORTED = ['sek', 'eur', 'usd', 'gbp'];

/**
 * POST /payments/create-checkout-session
 * Body: { orderId }
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    db.get('SELECT * FROM orders WHERE id = ?', [orderId], async (err, order) => {
      if (err) {
        console.error('DB error fetching order:', err);
        return res.status(500).json({ error: 'DB error' });
      }
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const currency = (order.fromCurrency || 'usd').toLowerCase();
      if (!SUPPORTED.includes(currency)) {
        return res.status(400).json({ error: 'Currency not supported' });
      }

      const amountCents = Math.round(Number(order.finalAmount) * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency,
            product_data: {
              name: 'Remittance transfer',
              description: `Order ${orderId}`
            },
            unit_amount: amountCents
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL}/cancel.html`,
        metadata: { orderId }
      });

      // Store Stripe checkout URL + pending status
      db.run(
        'UPDATE orders SET status = ?, checkoutUrl = ? WHERE id = ?',
        ['pending_payment', session.url, orderId],
        (uerr) => {
          if (uerr) console.error('DB update failed:', uerr);
        }
      );

      res.json({ url: session.url, id: session.id });
    });

  } catch (e) {
    console.error('create-checkout-session error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

/**
 * Webhook handler (mounted raw in server.js)
 */
async function webhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature fail:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        db.run(
          'UPDATE orders SET status = ?, completedAt = ? WHERE id = ?',
          ['paid', new Date().toISOString(), orderId],
          (uerr) => {
            if (uerr) console.error('Failed to mark order as paid:', uerr);
            else console.log(`Order ${orderId} marked as PAID`);
          }
        );
      }
    }
  } catch (e) {
    console.error('Webhook error:', e);
  }

  res.json({ received: true });
}

module.exports = {
  router,
  webhookHandler
};
