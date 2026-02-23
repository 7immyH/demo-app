require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function initDB() {
    let connection;
    try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        const dbName = dbUrl.pathname.replace('/', '');
        const connectionUrl = `${dbUrl.protocol}//${dbUrl.username}:${dbUrl.password}@${dbUrl.host}`;

        connection = await mysql.createConnection(connectionUrl);
        console.log('Connected to MySQL server.');

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Ensured database ${dbName} exists.`);

        await connection.query(`USE \`${dbName}\``);

        // For MySQL, the SERIAL equivalent is AUTO_INCREMENT, and TIMESTAMP defaults work slightly differently.
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Ensured users table exists.');

        const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);

        if (rows.length === 0) {
            const saltRounds = 10;
            const plainPassword = 'admin';
            const hash = await bcrypt.hash(plainPassword, saltRounds);

            await connection.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', ['admin', hash]);
            console.log('Created default admin user with username: admin and password: admin');
        } else {
            console.log('Admin user already exists.');
        }

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Disconnected from the database.');
        }
    }
}

initDB();
