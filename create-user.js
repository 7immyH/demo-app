require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createUser(username, plainPassword) {
    if (!username || !plainPassword) {
        console.error('Usage: node create-user.js <username> <password>');
        process.exit(1);
    }

    let connection;
    try {
        // Connect to MySQL
        const dbUrl = new URL(process.env.DATABASE_URL);
        const dbName = dbUrl.pathname.replace('/', '');
        const connectionUrl = `${dbUrl.protocol}//${dbUrl.username}:${dbUrl.password}@${dbUrl.host}`;

        connection = await mysql.createConnection(connectionUrl);
        await connection.query(`USE \`${dbName}\``);

        // Hash the password
        const saltRounds = 10;
        const hash = await bcrypt.hash(plainPassword, saltRounds);

        // Insert into database
        await connection.query(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hash]
        );

        console.log(`✅ Successfully created user: ${username}`);

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.error(`❌ Error: User '${username}' already exists.`);
        } else {
            console.error('❌ Error creating user:', err.message);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
        process.exit(0);
    }
}

// Get raw command line arguments
const args = process.argv.slice(2);
createUser(args[0], args[1]);
