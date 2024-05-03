const express = require("express");
const app = express();
const http = require("http");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");

// Inställningar av servern.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function getConnection() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "skolan",
  });
}
// Dokumentationssida
app.get("/", (req, res) => {
  const documentation = `
    <h1>API Dokumentation</h1>
    <h2>Tillgängliga Endpoints</h2>
    <ul>
        <li>GET /users - Returnerar en lista av alla userser.</li>
        <li>GET /users/:id - Returnerar en specifik users baserat på ID.</li>
        <li>POST /users - Skapar en ny users. Exempel på data: { "hello": "world" }</li>
    </ul>
    `;
  res.send(documentation);
});

// GET alla users
app.get("/users", async (req, res) => {
  const connection = await getConnection();
  const [rows] = await connection.query("SELECT * FROM users");
  res.json(rows);
  connection.end();
});

// GET en user med ID
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const connection = await getConnection();
  const [rows] = await connection.query("SELECT * FROM users WHERE id = ?", [
    id,
  ]);
  if (rows.length > 0) {
    res.json(rows[0]);
  } else {
    res.status(404).send("Användaren hittades inte");
  }
  connection.end();
});

// POST skapa en ny user
app.post("/users", async (req, res) => {
  const { body } = req;
  const connection = await getConnection();
  const [result] = await connection.query("INSERT INTO users SET ?", body);
  const insertId = result.insertId;
  res.status(201).json({ id: insertId, ...body });
  connection.end();
});

// PUT uppdatera en user med ID
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { body } = req;
  const connection = await getConnection();
  const [result] = await connection.query("UPDATE users SET ? WHERE id = ?", [
    body,
    id,
  ]);
  if (result.affectedRows > 0) {
    res.json({ id: id, ...body });
  } else {
    res.status(404).send("Användaren hittades inte");
  }
  connection.end();
});

// POST inloggning
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const connection = await getConnection();
  const [rows] = await connection.query(
    "SELECT * FROM users WHERE username = ?",
    [username]
  );
  if (rows.length > 0) {
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      // Ta bort lösenordet från användarens data innan du skickar tillbaka
      delete user.password;
      res.json(user);
    } else {
      res.status(401).send("Fel lösenord");
    }
  } else {
    res.status(404).send("Användaren hittades inte");
  }
  connection.end();
});

const server = http.createServer(app);
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
