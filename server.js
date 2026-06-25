const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const DB = "./db.json";

function load() {
    return JSON.parse(fs.readFileSync(DB));
}
function save(data) {
    fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// REGISTER (license + HWID bind + expiry)
app.post("/register", (req, res) => {
    const { login, password, key, hwid } = req.body;

    let db = load();

    let license = db.licenses.find(l => l.key === key);

    if (!license)
        return res.json({ status: "invalid_key" });

    if (license.used)
        return res.json({ status: "key_used" });

    db.users.push({
        login,
        password,
        hwid,
        expire: license.expire
    });

    license.used = true;

    save(db);

    res.json({ status: "ok" });
});

// LOGIN + HWID + EXPIRY CHECK
app.post("/login", (req, res) => {
    const { login, password, hwid } = req.body;

    let db = load();

    let user = db.users.find(u => u.login === login);

    if (!user)
        return res.json({ status: "not_found" });

    if (user.password !== password)
        return res.json({ status: "wrong_pass" });

    if (user.hwid !== hwid)
        return res.json({ status: "hwid_fail" });

    if (Date.now() > user.expire)
        return res.json({ status: "expired" });

    res.json({ status: "ok" });
});

app.listen(3000, () => console.log("API running"));
