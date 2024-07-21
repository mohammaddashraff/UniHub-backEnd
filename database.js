// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    database: 'uniHub',
    port: '3306',
    user: 'root',
    password: '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(() => {
        console.log("done");
    })
    .catch(error => {
        throw error;
    });

module.exports = pool;
