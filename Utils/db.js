const mysql = require('mysql2')
const pool = mysql.createPool({
    host : 'localhost',
    database : 'uniHub',
    port : '3306',
    user : 'root',
    password : '12345',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection(function (error){
    if(error){
        throw error
    }
    else {
        console.log("done")
    }
});
module.exports = pool