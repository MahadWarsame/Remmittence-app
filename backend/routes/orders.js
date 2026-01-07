const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const { getRates } = require('../utils/fx');

const router = express.Router();

// Get orders
router.get('/', authMiddleware, (req, res) => {
  db.all('SELECT * FROM orders WHERE userId=? ORDER BY createdAt DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch orders' });
    res.json(rows || []);
  });
});

// Create order
router.post('/create', authMiddleware, (req, res) => {
  const { amount, fromCurrency, toCurrency, recipient } = req.body;
  if (!amount || !fromCurrency || !toCurrency || !recipient) return res.status(400).json({ error: 'Missing fields' });

  const rates = getRates();
  let rate = rates[toCurrency] / rates[fromCurrency];
  const toAmount = amount * rate;
  const fee = Number((toAmount * 0.015).toFixed(2));
  const finalAmount = Number((toAmount - fee).toFixed(2));

  const order = {
    id: Date.now().toString(36) + '-' + Math.floor(Math.random()*10000),
    userId: req.user.id,
    fromCurrency, toCurrency, amount,
    fee, finalAmount,
    recipient,
    status: 'created',
    createdAt: new Date().toISOString()
  };

  db.run(
    'INSERT INTO orders (id,userId,fromCurrency,toCurrency,amount,fee,finalAmount,recipient,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [order.id, order.userId, fromCurrency, toCurrency, amount, fee, finalAmount, recipient, order.status, order.createdAt],
    err => {
      if (err) return res.status(500).json({ error: 'Failed to create order' });
      res.json(order);
    }
  );
});

module.exports = router;
