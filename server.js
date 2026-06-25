const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

let keys = require("./key.json");
let users = [];

app.get("/keys", (req, res) => {
    res.json(keys);
});

app.post("/register", (req, res) => {
    const { login, hwid, key } = req.body;

    if (!keys.keys.includes(key))
        return res.json({ status: "invalid_key" });

    let user = users.find(u => u.login === login);

    if (user)
        return res.json({ status: "exists" });

    users.push({ login, hwid, key });

    return res.json({ status: "ok" });
});

app.post("/login", (req, res) => {
    const { login, hwid } = req.body;

    let user = users.find(u => u.login === login);

    if (!user)
        return res.json({ status: "not_found" });

    if (user.hwid !== hwid)
        return res.json({ status: "hwid_fail" });

    return res.json({ status: "ok" });
});

app.listen(3000, () => console.log("API running"));
