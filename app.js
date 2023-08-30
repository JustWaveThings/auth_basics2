require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// db connection
const mongoDB = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.dmc0his.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

// connect to db
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

// db connection error handling
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// user schema
const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
  })
);

// express app
const app = express();

// express view engine setup
app.set("views", __dirname);
app.set("view engine", "ejs");

//  express session setup
app.use(session({ secret: "dogs", resave: false, saveUninitialized: true }));

// passport setup
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

// get handler
app.get("/", (req, res) => res.render("index"));
app.get("/sign-up", (req, res) => res.render("sign-up-form"));

// post handler for sign-up
app.post("/sign-up", async (req, res, next) => {
  try {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
    await user.save();
    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

// express server listener
app.listen(3001, () => console.log("App listening on port 3001!"));
