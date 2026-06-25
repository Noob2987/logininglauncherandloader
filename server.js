const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());   // ОБЯЗАТЕЛЬНО для чтения body

const DB = "./db.json";

// Загрузка и сохранение базы
function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB, "utf8"));
    } catch (e) {
        return { users: [], licenses: [] };
    }
}

function saveDB(data) {
    fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// Главная страница (чтобы не было Cannot GET /)
app.get("/", (req, res) => {
    res.send("Metadone DLC API is running ✅");
});

// REGISTER
app.post("/register", (req, res) => {
    const { login, email, key, password, hwid } = req.body;
    
    if (!login || !email || !key || !password || !hwid) {
        return res.json({ status: "missing_data" });
    }

    let db = loadDB();

    // Проверка ключа
    const licenseIndex = db.licenses.findIndex(l => l.key === key && !l.used);
    if (licenseIndex === -1) {
        return res.json({ status: "invalid_key" });
    }

    // Проверка существования логина
    if (db.users.some(u => u.login === login)) {
        return res.json({ status: "login_exists" });
    }

    // Создаём пользователя
    db.users.push({
        login,
        email,
        password,        // В реальном проекте нужно хэшировать!
        hwid,
        key,
        expire: db.licenses[licenseIndex].expire
    });

    db.licenses[licenseIndex].used = true;
    saveDB(db);

    res.json({ status: "ok" });
});

// LOGIN
app.post("/login", (req, res) => {
    const { login, key, hwid } = req.body;

    if (!login || !key || !hwid) {
        return res.json({ status: "missing_data" });
    }

    let db = loadDB();
    const user = db.users.find(u => u.login === login);

    if (!user) return res.json({ status: "not_found" });
    if (user.key !== key) return res.json({ status: "wrong_key" });
    if (user.hwid !== hwid) return res.json({ status: "hwid_mismatch" });
    if (Date.now() > new Date(user.expire).getTime()) return res.json({ status: "expired" });

    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Metadone API запущен на порту ${PORT}`);
});
