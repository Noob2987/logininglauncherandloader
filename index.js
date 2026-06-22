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

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: "Заполните все поля" });
    }

    if (users.find(u => u.username === username || u.email === email)) {
        return res.status(400).json({ success: false, message: "Пользователь уже существует" });
    }

    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password, // В реальном проекте используй bcrypt!
        role: "Player",
        hwid: null,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    res.json({ success: true, message: "Регистрация успешна" });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => (u.username === username || u.email === username) && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: "Неверный логин или пароль" });
    }

    res.json({
        success: true,
        username: user.username,
        role: user.role,
        uid: user.id,
        hwid: user.hwid
    });
});

app.get('/api/auth', (req, res) => {
    const hwid = req.query.hwid;
    if (!hwid) return res.status(400).send('no hwid');

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
app.listen(PORT, () => console.log(`Metadone Backend запущен на ${PORT}`));
