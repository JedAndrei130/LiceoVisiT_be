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
    // Return DATE/DATETIME columns as plain strings to prevent mysql2 from
    // converting them to JS Date objects, which get timezone-shifted when
    // serialized to JSON (causing dates to appear one day behind in UTC+8).
    dateStrings: true,
};

const pool = mysql.createPool(dbConfig);

export default pool;