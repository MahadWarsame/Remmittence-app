// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const ratesRoutes = require('./routes/rates');
const payments = require('./routes/payments'); // exports { router, webhookHandler }
const adminRoutes = require('./routes/admin');

const { updateRates } = require('./utils/fx');

const app = express();
const port = process.env.PORT || 3000;

// ---------- CORS ----------
app.use(cors());

// ---------- WEBHOOK (raw body) ----------
/*
  Stripe requires the webhook endpoint to receive the raw body for signature verification.
*/
app.post(
  '/payments/webhook',
  express.raw({ type: 'application/json' }),
  payments.webhookHandler
);

// ---------- JSON parser for all other routes ----------
app.use(express.json());

// ---------- API routes ----------
app.use('/auth', authRoutes);
app.use('/orders', ordersRoutes);
app.use('/rates', ratesRoutes);
app.use('/admin', adminRoutes);        // ✅ Admin after JSON parser
app.use('/payments', payments.router); // Checkout session route

// ---------- FX update ----------
updateRates();
setInterval(updateRates, 60 * 60 * 1000);

// ---------- Serve frontend ----------
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ---------- Start server ----------
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
