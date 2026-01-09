const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import your modules
const db = require('./database');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const { router: paymentRoutes, webhookHandler } = require('./routes/payments');

const app = express();

// 1. STRIPE WEBHOOK (Must be before express.json())
// This handles the "Paid" signal from Stripe
app.post('/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// 2. CORS CONFIGURATION
// This allows your Lovable and Vercel sites to talk to this server
const allowedOrigins = [
  'https://remmittence-app.vercel.app',
  'https://mahadwarsame.vercel.app',
  'http://localhost:5173', // For local Lovable development
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// 3. MIDDLEWARE
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 4. ROUTES
app.use('/auth', authRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Mahad Remittance Backend is running!');
});

// 5. SERVER START
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
