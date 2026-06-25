const express = require("express");
const fs = require("fs-extra");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = "./db.json";
const KEY_FILE = "./key.json";

function loadDB() {
    return fs.readJsonSync(DB_FILE);
}

function saveDB(db) {
    fs.writeJsonSync(DB_FILE, db);
}

function loadKeys() {
    return fs.readJsonSync(KEY_FILE).keys;
}

// REGISTER (auto HWID bind)
app.post("/register", (req, res) => {
    const { login, password, key, hwid } = req.body;

    let db = loadDB();
    let keys = loadKeys();

    if (!keys.includes(key))
        return res.json({ status: "invalid_key" });

    if (db.users.find(u => u.login === login))
        return res.json({ status: "user_exists" });

    db.users.push({
        login,
        password,
        hwid,
        key
    });

    saveDB(db);

    res.json({ status: "ok" });
});

// LOGIN + HWID CHECK
app.post("/login", (req, res) => {
    const { login, password, hwid } = req.body;

    let db = loadDB();

    let user = db.users.find(u => u.login === login);

    if (!user)
        return res.json({ status: "not_found" });

    if (user.password !== password)
        return res.json({ status: "wrong_pass" });

    // HWID bind logic
    if (!user.hwid) {
        user.hwid = hwid;
        saveDB(db);
        return res.json({ status: "first_bind" });
    }

    if (user.hwid !== hwid)
        return res.json({ status: "hwid_fail" });

    res.json({ status: "ok" });
});

app.listen(3000, () => {
    console.log("API running on port 3000");
});
