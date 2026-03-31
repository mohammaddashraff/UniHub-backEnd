const mysql = require('mysql2')
const pool = mysql.createPool({
    host : process.env.DB_HOST || 'localhost',
    database : process.env.DB_NAME || 'uniHub',
    port : process.env.DB_PORT || '3306',
    user : process.env.DB_USER || 'root',
    password : process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection(function (error){
    if(error){
        console.error('Database connection failed:', error.message);
    }
    else {
        console.log("done")
    }
});
module.exports = pool
