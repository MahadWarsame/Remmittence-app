const bcrypt = require('bcrypt');
const db = require('./database');

const username = 'admin';
const password = 'StrongPassword123';

bcrypt.hash(password, 10).then(hash => {
  db.run(
    'INSERT INTO admin (username, passwordHash) VALUES (?,?)',
    [username, hash],
    (err) => {
      if (err) return console.error('Error creating admin:', err.message);
      console.log('Admin created successfully.');
    }
  );
});
