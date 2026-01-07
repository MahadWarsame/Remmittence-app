const express = require('express');
const { getRates } = require('../utils/fx');
const router = express.Router();

router.get('/', (req, res) => {
  res.json(getRates());
});

module.exports = router;
