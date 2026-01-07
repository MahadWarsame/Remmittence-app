const db = require('./database');

db.run(
  "ALTER TABLE orders ADD COLUMN checkoutUrl TEXT",
  (err) => {
    if (err) {
      if (err.message.includes('duplicate column')) {
        console.log('checkoutUrl column already exists');
      } else {
        console.error('Error adding checkoutUrl column:', err.message);
      }
    } else {
      console.log('checkoutUrl column added successfully');
    }
    db.close();
  }
);
