const bcrypt = require('bcrypt');
const db = require('./database');

// Admin credentials you want
const username = 'admin';
const password = 'StrongPassword123'; // change this if you want

async function resetAdmin() {
  try {
    const hash = await bcrypt.hash(password, 10);

    // Delete any existing admin(s)
    db.run('DELETE FROM admin', (err) => {
      if (err) console.error('Error deleting old admin:', err.message);
      else console.log('✅ Old admin(s) deleted');
    });

    // Insert new admin
    db.run(
      'INSERT INTO admin (username, passwordHash) VALUES (?, ?)',
      [username, hash],
      (err) => {
        if (err) console.error('Error creating admin:', err.message);
        else console.log(`✅ Admin created successfully.\nUsername: ${username}\nPassword: ${password}`);
      }
    );
  } catch (e) {
    console.error('Error:', e);
  }
}

resetAdmin();
