const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

let users = [];
if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json'));
}

app.get('/api/auth', (req, res) => {
    const hwid = req.query.hwid;
    const exists = users.some(u => u.hwid === hwid);
    
    if (exists) {
        res.send('success');
    } else {
        res.status(403).send('denied');
    }
});

// Добавление HWID (можно сделать отдельный endpoint с паролем)
app.post('/api/add-hwid', (req, res) => {
    const { hwid } = req.body;
    if (!users.some(u => u.hwid === hwid)) {
        users.push({ hwid, date: new Date().toISOString() });
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    }
    res.send('added');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
