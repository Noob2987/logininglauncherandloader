const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = 'users.json';
let users = [];

if (fs.existsSync(USERS_FILE)) {
    try {
        users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
        users = [];
    }
}

// Главный обработчик для лаунчера
app.post('/api', (req, res) => {
    const { type, username, email, password } = req.body;

    if (type === 'register') {
        if (!username || !email || !password) {
            return res.json({ type: 'error', message: "Заполните все поля" });
        }
        if (users.find(u => u.username === username || u.email === email)) {
            return res.json({ type: 'error', message: "Пользователь уже существует" });
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password,           // В продакшене используй bcrypt!
            role: "Player",
            hwid: null,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

        return res.json({ 
            type: 'auth_success', 
            username: newUser.username, 
            role: newUser.role, 
            uid: newUser.id 
        });
    }

    if (type === 'login') {
        if (!username || !password) {
            return res.json({ type: 'error', message: "Заполните все поля" });
        }

        const user = users.find(u => 
            (u.username === username || u.email === username) && u.password === password
        );

        if (!user) {
            return res.json({ type: 'error', message: "Неверный логин или пароль" });
        }

        return res.json({
            type: 'auth_success',
            username: user.username,
            role: user.role,
            uid: user.id
        });
    }

    res.json({ type: 'error', message: "Неизвестный тип запроса" });
});

// Старые маршруты для совместимости
app.post('/api/register', (req, res) => { /* перенаправляем */ req.body.type = 'register'; return app._router.handle(req, res, () => {}); });
app.post('/api/login', (req, res) => { req.body.type = 'login'; return app._router.handle(req, res, () => {}); });

app.get('/api/auth', (req, res) => {
    const hwid = req.query.hwid;
    if (!hwid) return res.send('denied');
    const user = users.find(u => u.hwid === hwid);
    res.send(user ? 'success' : 'denied');
});

app.post('/api/bind-hwid', (req, res) => {
    const { username, hwid } = req.body;
    const user = users.find(u => u.username === username);
    if (user) {
        user.hwid = hwid;
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Metadone Backend запущен на порту ${PORT}`);
});
