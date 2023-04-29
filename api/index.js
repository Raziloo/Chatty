const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const ws = require("ws");
const fs = require("fs");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected to mongo");
  })
  .catch((err) => {
    console.error(err);
  });

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use('/uploads', express.static(__dirname+ '/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
    ],
    exposedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
    ],
  })
);

async function getUserDataFromRequest(req, res) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("no token");
    }
  });
}

app.get("/test", (req, res) => {
  res.json("test ok");
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId;
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get("/people", async (req, res) => {
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie("token", token, { sameSite: "none", secure: true }).json({
            id: foundUser._id,
          });
        }
      );
    }
  }
});

app.post('/logout', (req,res) => {
  res.cookie("token", '', { sameSite: "none", secure: true }).json('ok');
})

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
  const createdUser = await User.create({
    username: username,
    password: hashedPassword,
  });
  jwt.sign(
    { userId: createdUser._id, username },
    jwtSecret,
    {},
    (err, token) => {
      if (err) throw err;
      res
        .cookie("token", token, { sameSite: "none", secure: true })
        .status(201)
        .json({
          id: createdUser._id,
          username,
        });
    }
  );
});

const server = app.listen(3000);

const wss = new ws.Server({ server });
wss.on("connection", (connection, req) => {
  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            username: c.username,
          })),
        })
      );
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
      console.log("dead");
    }, 1000);
  }, 5000);

  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  // read username and id form the cookie for this connection
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, file} = messageData;
    let fileName = null;
    if (file) {
      const parts = file.name.split('.');
      const ext = parts[parts.length-1];
      fileName = Date.now() + '.'+ext;
      const path = __dirname + '/uploads/' + fileName;
      const bufferData = Buffer.from(file.data.split(',')[1], 'base64');
      fs.writeFile(path, bufferData, () => {
        console.log('file saved:'+ path);

      });
    }
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? fileName : null,
      });
      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              _id: messageDoc._id,
              file: file ? fileName : null,
            })
          )
        );
    }
    // console.log(messageData);
  });

  // notify everyone about online people
  notifyAboutOnlinePeople();
  // console.log([...wss.clients].map(c => c.username));
});

// app.listen(3000, () => {
//     console.log('server started');
//     }
// );

//j6c9BK3kkdVE1xTg
