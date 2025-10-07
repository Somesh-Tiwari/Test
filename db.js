const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'hospital_db'
});

// Attempt connection early so we can show banner in UI
// Do not crash the server; just log the error.
db.connect(err => {
  if (err) console.error('MySQL connection error:', err.message);
  else console.log('✅ Connected to MySQL Database');
});

module.exports = db;
