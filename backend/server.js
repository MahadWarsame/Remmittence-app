require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const ratesRoutes = require('./routes/rates');
const payments = require('./routes/payments'); 
const adminRoutes = require('./routes/admin');

const { updateRates } = require('./utils/fx');

const app = express();

// Use the PORT Render gives you, or 10000 as a fallback
const PORT = process.env.PORT || 10000;

// ---------- CORS ----------
// Important: No trailing slash on the URL
app.use(cors({
  origin: 'https://remmittence-app.vercel.app',
  credentials: true
}));

// ---------- WEBHOOK (raw body) ----------
// This MUST come before express.json()
app.post(
  '/payments/webhook',
  express.raw({ type: 'application/json' }),
  payments.webhookHandler
);

// ---------- JSON parser ----------
app.use(express.json());

// ---------- Health Check ----------
// This stops the "Cannot GET /" error when visiting the Render URL directly
app.get('/', (req, res) => {
  res.json({ status: 'Backend is live', message: 'API is working' });
});

// ---------- API routes ----------
app.use('/auth', authRoutes);
app.use('/orders', ordersRoutes);
app.use('/rates', ratesRoutes);
app.use('/admin', adminRoutes);
app.use('/payments', payments.router);

// ---------- FX update ----------
updateRates();
setInterval(updateRates, 60 * 60 * 1000);

// ---------- Start server ----------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));