//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const path = require("path");
const http = require("http");
const flash = require("express-flash");
const bcrypt = require("bcrypt");
const User = require("./models/user.model.js");
const Room = require("./models/room.model.js");

const publicDirectoryPath = path.join(__dirname, "/public");

const app = express();

app.use(express.static(publicDirectoryPath));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

app.use(flash());

const server = http.Server(app);
const io = require("socket.io")(server);

app.set("socketio", io);

// =========== MONGOOSE CONNECTION ============
mongoose.connect(process.env.URL_DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

require("./config/passport")(passport);

// =========== SETUP SESSION ========================
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// =========== SETUP ROUTER ================

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/chat", checkAuthenticated, async function (req, res) {
  // ============= SOCKET.IO =================
  try {
    var listRoom = await User.findOne({ _id: req.user._id }, "rooms");
  } catch (error) {
    console.log(error);
  }
  // var io = req.app.get('socketio');
  io.on("connection", function (socket) {
    // socket.id = req.user._id;
    socket.user = req.user;
    socket.rooms = listRoom;

    console.log(socket.id + " connected...");

    socket.on("disconnect", function () {
      console.log(socket.id + " disconnected...");
    });

    socket.on("Client-get-myinfo", function () {
      socket.emit("Server-send-my-username", {
        username: req.user.username,
        socketid: socket.id,
        userid: req.user._id,
      });
    });

    socket.on("Client-create-room", async function (data) {
      // console.log(data);

      let exRoom = await Room.findOne({ name: data });
      // console.log(exRoom);

      if (exRoom) {
        // socket.emit("Notification", "Room has already existed");

        let listRoom = await User.find({
          _id: mongoose.Types.ObjectId(req.user._id),
        })
          .populate("rooms")
          .exec();

        const foundRoom = listRoom[0].rooms.find((element) => element.name === data);
        // console.log(foundRoom);
        if (!foundRoom) {
          listRoom[0].rooms.push({
            _id: mongoose.Types.ObjectId(exRoom._id),
            name: data,
          });
          listRoom[0].save()
          socket.emit("Server-send-list-room", listRoom[0].rooms);

        }
        else {
          socket.emit("Notification", "Room has already existed");
        }


        socket.join(data);
      } else {
        const room = new Room({
          name: data,
        });

        room.save().then(async function () {
          let user = await User.findOne({
            _id: mongoose.Types.ObjectId(req.user._id),
            rooms: mongoose.Types.ObjectId(room._id),
          });
          if (!user) {
            User.updateOne(
              { _id: mongoose.Types.ObjectId(req.user._id) },
              { $push: { rooms: room._id } },
              (err, doc) => {
                if (err) console.log(err);
              }
            );
          } else {
            // console.log(user);
          }
          roomid = room._id;
        });

        let listRoom = await User.find({
          _id: mongoose.Types.ObjectId(req.user._id),
        })
          .populate("rooms")
          .exec();
        listRoom[0].rooms.push({
          _id: mongoose.Types.ObjectId(room._id),
          name: data,
        });

        listRoom[0].save();

        socket.emit("Server-send-list-room", listRoom[0].rooms);

        socket.join(data);
      }
    });

    socket.on("Client-list-chat", async function (data) {
      const room = await Room.findOne({
        _id: mongoose.Types.ObjectId(data),
      }).populate("message.author");
      // console.log(room.name);

      socket.join(room.name);
      socket.emit("Server-send-list-chat", {
        message: room.message,
        user: req.user,
      });
    });

    socket.on("Client-send-message", async function (data) {
      console.log(data.socketid + " " + socket.id);
      if (req.user._id === data.userid) {
        let room = await Room.findOne({
          _id: mongoose.Types.ObjectId(data.roomid),
        });
        if (!room) {
          socket.emit("Notification", "Do not find room!");
        }
        room.message.push({ content: data.message, author: data.userid });
        room.save();

        console.log(io.sockets.adapter.rooms);

        io.sockets
          .in(room.name)
          .emit("Server-chat", { message: data.message, user: req.user });
      }
    });
  });

  let listRoom1 = await User.find({
    _id: mongoose.Types.ObjectId(req.user._id),
  })
    .populate("rooms")
    .exec();

  res.render("chat", { user: req.user, listRoom: listRoom1[0].rooms });
});

// Post Login
app.post(
  "/login",
  passport.authenticate("local-login", {
    successRedirect: "/chat",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Post Register
app.post(
  "/register",
  passport.authenticate("local-signup", {
    successRedirect: "/", // chuyển hướng tới trang được bảo vệ
    failureRedirect: "/register", // trở lại trang đăng ký nếu có lỗi
    failureFlash: true, // allow flash messages
  })
);

app.get("/listroom", checkAuthenticated, async function (req, res) {
  const listRoom = await User.findOne({
    _id: mongoose.Types.ObjectId(req.user._id),
  })
    .populate("rooms")
    .exec(function (err, doc) {
      if (err) {
        console.log(err);
      }
    });
  res.send(listRoom);
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("*", (req, res) => {
  res.send("404");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, function () {
  console.log("Server started on port " + PORT);
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/chat");
  }
  next();
}
