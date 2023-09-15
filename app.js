const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
let database = null;

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at 3000 port");
    });
  } catch (e) {
    console.log(`database error at {e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, location, gender } = request.body;
  const length = password;
  const len = length.length;
  const hashPassword = await bcrypt.hash(password, 10);
  const Query = `SELECT * FROM user
    WHERE username='${username}';`;
  const dbUser = await database.get(Query);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (len < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const Inserted = `INSERT INTO user
            (username,name,password,location,gender)
            VALUES
            ('${username}','${name}','${hashPassword}','${location}','${gender}');`;
      const Queries = await database.run(Inserted);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const Query = `SELECT * FROM user
    WHERE username='${username}';`;
  const dbUser = await database.get(Query);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, dbUser.password);
    if (isPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newpassword = newPassword;
  const length = newpassword.length;
  const Query = `SELECT * FROM user
    WHERE username='${username}';`;
  const dbUser = await database.get(Query);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPassword === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      if (length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashpassword = await bcrypt.hash(newPassword, 10);
        const passwordQuery = `UPDATE user
          SET 
          password='${hashpassword}'
          WHERE username='${username}';`;
        await database.run(passwordQuery);
        response.status(200);
        response.send("Password updated");
      }
    }
  }
});
module.exports = app;
