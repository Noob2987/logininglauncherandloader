const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = 'users.json';

let users = [];

// Безопасная загрузка users.json
if (fs.existsSync(USERS_FILE)) {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        users = data.trim() ? JSON.parse(data) : [];
    } catch (e) {
        console.log("users.json повреждён, создаём новый");
        users = [];
    }
}

app.get('/api/auth', (req, res) => {
    const hwid = req.query.hwid;
    if (!hwid) return res.status(400).send('no hwid');

    const exists = users.some(u => u.hwid === hwid);
    res.send(exists ? 'success' : 'denied');
});

// Добавление HWID (защити паролем в продакшене!)
app.post('/api/add-hwid', (req, res) => {
    const { hwid } = req.body;
    if (!hwid) return res.status(400).send('no hwid');

    if (!users.some(u => u.hwid === hwid)) {
        users.push({ hwid, date: new Date().toISOString() });
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
    res.send('added');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Metadone Backend запущен на порту ${PORT}`);
});
