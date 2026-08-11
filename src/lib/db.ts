import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://adm:admsoftware143@mysqlfarmab.acdata.cl:3306/farmacia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
