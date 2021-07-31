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
const cookieparser = require("cookie-parser");
const multer = require("multer");

const User = require("./models/user.model.js");
const Room = require("./models/room.model.js");

const publicDirectoryPath = path.join(__dirname, "/public");

const app = express();

// ================ MIDDLEWARE ====================
app.use(express.static(publicDirectoryPath));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieparser());
app.use(express.json());

app.use(flash());

app.set("view engine", "ejs");
app.set("views", "./views");

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

// ============ SOCKET.IO =================
const server = http.Server(app);
const io = require("socket.io")(server);

app.set("socketio", io);

var listUserOnline = [];

io.on("connection", function (socket) {
  console.log(socket.id + " connected...");

  socket.on("login", function (data) {
    data.socketid = socket.id;
    listUserOnline.push(data);
    io.sockets.emit("Has-somebody-online", listUserOnline);
  });

  socket.on("disconnect", function () {
    listUserOnline = listUserOnline.filter((e) => e.socketid !== socket.id);
    // console.log(listUserOnline);
    socket.broadcast.emit("Has-somebody-online", listUserOnline);
    console.log(socket.id + " disconnected...");
  });

  socket.on("Client-create-room", async function (data) {
    let exRoom = await Room.findOne({ name: data.roomname });
    // console.log(exRoom);

    if (exRoom) {
      // socket.emit("Notification", "Room has already existed");

      let listRoom = await User.find({
        _id: mongoose.Types.ObjectId(data.userid),
      })
        .populate("rooms")
        .exec();

      const foundRoom = listRoom[0].rooms.find(
        (element) => element.name === data
      );
      // console.log(foundRoom);
      if (!foundRoom) {
        listRoom[0].rooms.push({
          _id: exRoom._id,
          name: data.roomname,
        });
        listRoom[0].save();
        // console.log(listRoom[0].rooms);
        socket.emit("Server-send-list-room", listRoom[0].rooms);
      } else {
        socket.emit("Notification", "Room has already existed");
      }

      socket.join(data);
    } else {
      const room = new Room({
        name: data.roomname,
        type: "room",
      });

      // console.log(room);

      room.save().then(async function () {
        let user = await User.findOne({
          _id: mongoose.Types.ObjectId(data.userid),
          rooms: mongoose.Types.ObjectId(room._id),
        });
        if (!user) {
          User.updateOne(
            { _id: mongoose.Types.ObjectId(data.userid) },
            { $push: { rooms: room._id } },
            (err, doc) => {
              if (err) console.log(err);
            }
          );
        } else {
          // console.log(user);
        }
      });

      let listRoom = await User.find({
        _id: mongoose.Types.ObjectId(data.userid),
      })
        .populate("rooms")
        .exec();
      listRoom[0].rooms.push({
        _id: room._id,
        name: data.roomname,
      });

      // listRoom[0].save();

      socket.emit("Server-send-list-room", listRoom[0].rooms);

      socket.join(data);
    }
  });

  socket.on("Client-list-chat-room", async function (data) {
    // console.log(data);
    const room = await Room.findOne({
      _id: mongoose.Types.ObjectId(data),
    }).populate("message.author");
    // console.log(room.name);

    socket.join(room.name);
    socket.emit("Server-send-list-chat", {
      message: room.message,
      roomImage: room.roomImage,
      currentRoomId: room._id,
    });
  });

  socket.on("Client-list-chat-user", async function (data) {
    // console.log(data);
    // Kết hợp 2 id của 2 người tạo thành 1 cái tên
    // Có 2 trường hợp tên (A trước rồi B hoặc B trước rồi A)
    const roomname1 = data.myId + " and " + data.userid;
    const roomname2 = data.userid + " and " + data.myId;
    const room = await Room.findOne({
      $or: [
        {
          name: roomname1,
        },
        {
          name: roomname2,
        },
      ],
    })
      .populate("message.author")
      .exec();
    // console.log(room.name);
    if (room) {
      if (room.name === roomname1) {
        socket.join(roomname1);
      } else if (room.name === roomname2) {
        socket.join(roomname2);
      }
    }

    // Nếu tìm không có thì tạo phòng mới
    if (!room) {
      const room = new Room({
        name: roomname1,
        type: "user",
      });

      // console.log(room);

      room.save().then(async function () {
        let user = await User.findOne({
          _id: mongoose.Types.ObjectId(data.myId),
          rooms: mongoose.Types.ObjectId(room._id),
        });
        if (!user) {
          User.updateOne(
            { _id: mongoose.Types.ObjectId(data.myId) },
            { $push: { rooms: room._id } },
            (err, doc) => {
              if (err) console.log(err);
            }
          );
        } else {
          // console.log(user);
        }
      });

      socket.join(room.name);
    }

    const room1 = await Room.findOne({
      $or: [
        {
          name: roomname1,
        },
        {
          name: roomname2,
        },
      ],
    })
      .populate("message.author")
      .exec();

    socket.emit("Server-send-list-chat", {
      message: room1.message,
      roomImage: room.roomImage,
      currentRoomId: room._id,
    });
  });

  socket.on("Client-list-chat", async function (data) {
    const room = await Room.findOne({
      _id: mongoose.Types.ObjectId(data),
    }).populate("message.author");
    // console.log(room.name);

    socket.join(room.name);
    socket.emit("Server-send-list-chat", {
      message: room.message,
      roomImage: room.roomImage,
      currentRoomId: room._id,
    });
  });

  socket.on("Client-send-message", async function (data) {
    // console.log(data);
    // if (req.user._id === data.userid) {
    let room = await Room.findOne({
      _id: mongoose.Types.ObjectId(data.roomid),
    });
    if (!room) {
      socket.emit("Notification", "Do not find room!");
    }
    room.message.push({ content: data.message, author: data.userid });
    // console.log(room);
    room.save();

    let foundUser = await User.findOne(
      { _id: mongoose.Types.ObjectId(data.userid) },
      "username avatar"
    );

    io.sockets.in(room.name).emit("Server-chat", {
      message: data.message,
      userid: data.userid,
      username: foundUser.username,
      avatar: foundUser.avatar,
    });

    // }
  });

  socket.on("Client-writing", async function (data) {
    if (data.roomid !== "") {
      let room = await Room.findOne({ _id: mongoose.Types.ObjectId(data.roomid) });
      if (room) {
        socket.broadcast
          .in(room.name)
          .emit("Server-has-somebody-writing", {
            message: data.message,
            roomid: room._id,
          });
      }
    }
  });
});

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

// =============== MULTER ===============
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Sai định dạng"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 },
  fileFilter: fileFilter,
});

app.get("/chat", checkAuthenticated, async function (req, res) {
  res.cookie("userid", req.user._id);
  res.cookie("username", req.user.username);
  res.cookie("avatar", req.user.avatar);

  let listRoom1 = await User.find({
    _id: mongoose.Types.ObjectId(req.user._id),
  })
    .populate("rooms")
    .exec();

  res.render("chat", { user: req.user, listRoom: listRoom1[0].rooms });
});

app.post("/chat/img", upload.single("chatImage"), async function (req, res) {
  // console.log(req.file);
  if (req.file) {
    res
      .status(200)
      .send({ path: req.file.path, origin: req.file.originalname });
  } else {
    res.status(500).send("No found Image");
  }
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
  upload.single("avatar"),
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
