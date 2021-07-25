import { createNotification } from "/js/notification.js";

var socket = io(window.location.host);
var currentRoomId = ""
var myUsername = ''
var socketid = ''
var userid = ''


socket.on("Server-send-my-username", function (data) {
    myUsername = data.username
    socketid = data.socketid
    userid = data.userid
})

socket.on("Server-send-list-room", function (data) {
  console.log(data);
  $("#listRoom").html("");
  data.forEach((element) => {
    console.log(element);
    $("#listRoom")
      .append(`<li class='clearfix' onclick="clickRoom('${element._id}')">
        <img src='/img/avatar1.png' alt='avatar'><div class='about'><div class="name roomname ${element._id}">
        ${element.name}</div><div class='status'> <i class='fa fa-circle offline'></i> left 7 mins ago 
        </div></div></li>`);
  });
});

socket.on("Notification", function (data) {
  createNotification("{position: 'top left',type: 'warning'}", data);
});

socket.on("Server-send-list-chat", function (data) {
  

  $("#list-chat").html("");
  let username = data.user.username;
  data.message.forEach((element) => {
    if (element.author.username === username) { // nếu là user chính chủ thì nằm bên phải
      $("#list-chat").append(`<li class="clearfix">
    <div class="message-data text-right">
      <span class="message-data-time">${element.author.username}, 10:10 AM, Today</span>
      <img src="/img/avatar3.png" alt="avatar" />
    </div>
    <div class="message other-message float-right">
      ${element.content}
    </div>
  </li>
    `);
    } else {
      $("#list-chat").append(`<li class="clearfix">
    <div class="message-data">
      <img src="/img/avatar1.png" alt="avatar" />
      <span class="message-data-time">${element.author.username}, 10:10 AM, Today</span>
    </div>
    <div class="message my-message">
      ${element.content}
    </div>
  </li>
    `);
    }
  });
});

socket.on("Server-chat", function (data) {
  let username1 = data.user.username;
    if (username1 === myUsername) { // nếu là user chính chủ thì nằm bên phải
      $("#list-chat").append(`<li class="clearfix">
    <div class="message-data text-right">
      <span class="message-data-time">${username1}, 10:10 AM, Today</span>
      <img src="/img/avatar3.png" alt="avatar" />
    </div>
    <div class="message other-message float-right">
      ${data.message}
    </div>
  </li>
    `);
    } else {
      $("#list-chat").append(`<li class="clearfix">
    <div class="message-data">
      <img src="/img/avatar1.png" alt="avatar" />
      <span class="message-data-time">${username1}, 10:10 AM, Today</span>
    </div>
    <div class="message my-message">
      ${data.message}
    </div>
  </li>
    `);
    }
})

$(document).ready(function () {

    // lấy username của chính mình
    socket.emit("Client-get-myinfo")

  $(".btn-create-room").click(function () {
    socket.emit("Client-create-room", $(".txt-create-room").val());
  });
  $(".btn-send").click(function() {
      socket.emit("Client-send-message", {message: $('.txt-chat').val(), roomid: currentRoomId, socketid: socketid, userid: userid})
      $('.txt-chat').val("")
    })
});

export function clickRoom1(id) {
  $('#currentName').html($('.roomname.' + id).html())
  socket.emit("Client-list-chat", id);
  currentRoomId = id
}
