require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Database connection pool
const pool = mysql.createPool(process.env.DATABASE_URL);

pool.getConnection()
    .then(connection => {
        console.log('Connected to the database pool');
        connection.release();
    })
    .catch(err => {
        console.error('Failed to connect to the database', err);
    });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 1 day session
    }
}));

// API: Check Current User Session
app.get('/api/me', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, username: req.session.username });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// API: Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.json({ message: 'Logged in successfully' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Public Static Routes (Login flow)
const publicPaths = ['/login.html', '/login.css', '/login.js', '/favicon.ico'];

app.get('/login', (req, res) => {
    if (req.session.userId) {
        res.redirect('./');
    } else {
        res.redirect('login.html');
    }
});

app.use((req, res, next) => {
    // If route is explicitly public or starts with /api/, we let the routers above handle.
    if (req.path.startsWith('/api/') || publicPaths.includes(req.path)) {
        return next();
    }

    // For all other routes, require session
    if (req.session.userId) {
        next();
    } else {
        let redirectPath = '/login.html';
        if (req.originalUrl !== req.url) {
            // Determine the base path if hosted in a subdirectory
            const base = req.originalUrl.slice(0, req.originalUrl.length - req.url.length);
            redirectPath = base + '/login.html';
        }
        res.redirect(redirectPath);
    }
});

// Protected Static Routes (The app itself)
app.use(express.static(path.join(__dirname, '')));

// Fallback logic
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
