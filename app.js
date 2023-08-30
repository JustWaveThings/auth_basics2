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

// passport local strategy   function 1

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      if (user.password !== password) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// passort serialize user function 2

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// passport deserialize user function 3

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

// express locals  middleware -- gives us access to the user throughough the app

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// get handler  which gets the user from the request and renders the index page
app.get("/", async (req, res) => {
  let sessionAuthMessage = req.session.messages
    ? req.session.messages.at(-1)
    : null;

  res.render("index", {
    user: req.user,
    authMessage: sessionAuthMessage,
  });
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.get("/log-out", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

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

// post handler for login

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureMessage: true,
  })
);

// express server listener
app.listen(3001, () => console.log("App listening on port 3001!"));
