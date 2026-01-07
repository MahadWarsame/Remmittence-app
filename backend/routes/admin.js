// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';
const TOKEN_EXPIRY = '8h';

// ----------------------
// Helper: verify token
// ----------------------
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    req.adminUsername = decoded.username;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ----------------------
// Login
// ----------------------
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM admin WHERE username = ?', [username], async (err, admin) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!admin) return res.status(401).json({ error: 'Wrong username or password' });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ error: 'Wrong username or password' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({ token, username: admin.username });
  });
});

// ----------------------
// Get orders (protected)
// ----------------------
router.get('/orders', authRequired, (req, res) => {
  db.all('SELECT * FROM orders ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// ----------------------
// Complete order
// ----------------------
router.post('/orders/complete', authRequired, (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });
  db.run(
    'UPDATE orders SET status = ?, completedAt = ? WHERE id = ?',
    ['delivered', new Date().toISOString(), orderId],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ success: true });
    }
  );
});

// ----------------------
// Change admin password (protected)
// ----------------------
/*
  POST /admin/change-password
  Body: { oldPassword, newPassword }
  - Validates old password
  - Hashes new password and updates DB
*/
router.post('/change-password', authRequired, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'oldPassword and newPassword are required' });
  }

  const adminId = req.adminId;

  db.get('SELECT * FROM admin WHERE id = ?', [adminId], async (err, admin) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    try {
      const ok = await bcrypt.compare(oldPassword, admin.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Old password is incorrect' });

      const newHash = await bcrypt.hash(newPassword, 10);
      db.run('UPDATE admin SET passwordHash = ? WHERE id = ?', [newHash, adminId], (uerr) => {
        if (uerr) {
          console.error('Failed update admin password:', uerr);
          return res.status(500).json({ error: 'Failed to update password' });
        }
        res.json({ success: true, message: 'Password updated' });
      });
    } catch (e) {
      console.error('Change-password error:', e);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

module.exports = router;
