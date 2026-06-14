const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'ismail_user',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'autocare_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Promisify pool queries for async/await usage
const promisePool = pool.promise();

module.exports = promisePool;
