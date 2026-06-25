const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const DB = "./db.json";

function loadDB() {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
}

function saveDB(data) {
    fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// Получение HWID (примерно так же, как в клиенте)
function getHWID() {
    // Здесь можно добавить дополнительные параметры, если нужно
    return "hwid-placeholder"; // будет перезаписано клиентом
}

// REGISTER
app.post("/register", (req, res) => {
    const { login, email, key, hwid } = req.body;

    if (!login || !email || !key || !hwid) {
        return res.json({ status: "missing_data" });
    }

    let db = loadDB();

    const license = db.licenses.find(l => l.key === key && !l.used);
    if (!license) return res.json({ status: "invalid_key" });

    // Проверка, существует ли уже такой логин
    if (db.users.some(u => u.login === login)) {
        return res.json({ status: "login_exists" });
    }

    db.users.push({
        login,
        email,
        password: "", // можно добавить пароль позже, если нужно
        hwid,
        key,
        expire: license.expire
    });

    license.used = true;
    saveDB(db);

    res.json({ status: "ok" });
});

// LOGIN
app.post("/login", (req, res) => {
    const { login, key, hwid } = req.body;

    let db = loadDB();
    const user = db.users.find(u => u.login === login);

    if (!user) return res.json({ status: "not_found" });
    if (user.key !== key) return res.json({ status: "wrong_key" });
    if (user.hwid !== hwid) return res.json({ status: "hwid_mismatch" });
    if (Date.now() > new Date(user.expire).getTime()) return res.json({ status: "expired" });

    res.json({ status: "ok" });
});

app.listen(3000, () => console.log("Metadone API running on port 3000"));
