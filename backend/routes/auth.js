const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();
const SECRET = 'SUPER_SECRET_KEY_CHANGE_ME';

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const id = Date.now().toString(36) + '-' + Math.floor(Math.random()*10000);
    const createdAt = new Date().toISOString();

    db.run(
      'INSERT INTO users (id,name,email,password,createdAt) VALUES (?,?,?,?,?)',
      [id, name, email, hashed, createdAt],
      (err) => {
        if (err) return res.status(400).json({ error: 'Email already exists or DB error' });
        const token = jwt.sign({ id, email }, SECRET, { expiresIn: '2h' });
        res.json({ token, name, email });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!row) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: row.id, email }, SECRET, { expiresIn: '2h' });
    res.json({ token, name: row.name, email: row.email });
  });
});

module.exports = router;
