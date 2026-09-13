// lib/db.js
import mysql from 'mysql2';

let dbConfig = {};

// PRIORITAS: Pakai MYSQL_URL dulu
if (process.env.MYSQL_URL) {
    try {
        const parsed = new URL(process.env.MYSQL_URL);
        dbConfig = {
            host: parsed.hostname,
            user: parsed.username,
            password: parsed.password,
            database: parsed.pathname.slice(1),
            port: parsed.port || 3306
        };
        console.log('✅ Using MYSQL_URL');
        console.log('   Host:', dbConfig.host);
        console.log('   Database:', dbConfig.database);
    } catch (error) {
        console.error('❌ Error parsing MYSQL_URL:', error.message);
        dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coffee_shop',
            port: parseInt(process.env.DB_PORT) || 3306
        };
        console.log('✅ Using individual DB variables');
    }
} else {
    dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'coffee_shop',
        port: parseInt(process.env.DB_PORT) || 3306
    };
    console.log('✅ Using individual DB variables');
}

// Gunakan pool dengan prepared statements
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : undefined
});

export const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.execute(sql, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

export const db = {
    query: (sql, callback) => {
        pool.query(sql, callback);
    }
};

console.log('✅ Database pool created with prepared statements');
