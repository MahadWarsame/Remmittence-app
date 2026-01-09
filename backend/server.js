require('dotenv').config();
const express = require('express');
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
// Replace with your frontend URL for production
app.use(cors({
  origin: 'https://your-frontend-url.vercel.app'
}));

// ---------- WEBHOOK (raw body) ----------
app.post(
  '/payments/webhook',
  express.raw({ type: 'application/json' }),
  payments.webhookHandler
);

// ---------- JSON parser ----------
app.use(express.json());

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
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
