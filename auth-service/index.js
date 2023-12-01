const express = require("express");
const mongoose = require("mongoose");
const app = express();
const User = require("./User");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT_ONE || 7070;

mongoose
  .connect("mongodb://0.0.0.0:27017/auth-service")
  .then(console.log("Auth Service DB Connected"));

app.use(express.json());

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: "User doesn't exist" });
  } else {
    if (password !== user.password) {
      return res.json({ message: "Password Incorrect" });
    }
    const payload = {
      email,
      name: user.name,
    };
    jwt.sign(payload, "secret", (err, token) => {
      console.log("TOKEn", token);
      if (err) console.log(err);
      else return res.json({ token: token });
    });
  }
});

app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.json({ message: "User already exists" });
  } else {
    const newUser = new User({
      email,
      name,
      password,
    });
    newUser.save();
    return res.json(newUser);
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service Connected on ${PORT}`);
});