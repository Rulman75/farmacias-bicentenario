import mysql from 'mysql2/promise';

const rawUri = process.env.DATABASE_URL || 'mysql://adm:admsoftware143@155.181.147.168:3306/farmacia';
const uri = rawUri.replace('mysqlfarmab.acdata.cl', '155.181.147.168');

const pool = mysql.createPool({
  uri,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
