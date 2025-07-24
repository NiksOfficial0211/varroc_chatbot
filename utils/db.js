// import mysql from 'mysql2/promise';

// const pool = mysql.createPool({
//   host: process.env.NEXT_PUBLIC_DB_HOST || 'localhost',
//   user: process.env.NEXT_PUBLIC_DB_USER || 'root',
//   password: process.env.NEXT_PUBLIC_DB_PASSWORD || '',
//   database: process.env.NEXT_PUBLIC_DB_DATABASE,
//   port: process.env.NEXT_PUBLIC_DB_PORT ? parseInt(process.env.NEXT_PUBLIC_DB_PORT) : 3306,
// });

// export default pool;

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.NEXT_PUBLIC_DB_HOST,
  user: process.env.NEXT_PUBLIC_DB_USER,
  password: process.env.NEXT_PUBLIC_DB_PASSWORD,
  database: process.env.NEXT_PUBLIC_DB_DATABASE,
  port: process.env.NEXT_PUBLIC_DB_PORT ? parseInt(process.env.NEXT_PUBLIC_DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,          // keeps the connection alive
  keepAliveInitialDelay: 10000,
});

export default pool;
