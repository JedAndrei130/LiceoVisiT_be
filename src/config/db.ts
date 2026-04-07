import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    port: 3306, // Put the database port here
    user: 'root',
    password: '123456',
    database: 'liceo_visitrack', // Put here your database
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

export default pool;