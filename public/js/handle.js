import { createNotification } from "/js/notification.js";

var socket = io(window.location.host);
var currentRoomId = "";
var chatuserid = "";
var myUsername = "";
var socketid = "";
var chatusersocketid = ""

var userid = document.cookie
  .split("; ")
  .find((row) => row.startsWith("userid="))
  .split("=")[1];

var socketid = document.cookie
  .split("; ")
  .find((row) => row.startsWith("socketid="))
  .split("=")[1];

socket.on("Server-send-list-room", function (data) {
  $("#listRoom").html("");
  // console.log(data);
  data.forEach((element) => {
    if (element.type !== "user") {
      $("#listRoom")
        .append(`<li class='clearfix' onclick="clickRoom('${element._id}')">
        <img src='${element.roomImage}' alt='avatar'><div class='about'><div class="name roomname ${element._id}">
        ${element.name}</div><div class='status'> <i class='fa fa-circle offline'></i> left 7 mins ago 
        </div></div></li>`);
    }
  });
});

socket.on("Notification", function (data) {
  createNotification("{position: 'top left',type: 'warning'}", data);
});

socket.on("Server-send-list-chat", function (data) {
  // console.log(data);
  currentRoomId = data.currentRoomId;
  $("#roomImage").attr("src", data.roomImage);

  $("#list-chat").html("");
  // let username = data.user.username;
  data.message.forEach((element) => {
    if (element.content.startsWith("/uploads/")) {
      if (element.author._id === userid) {
        // nếu là user chính chủ thì nằm bên phải
        $("#list-chat").append(`<li class="clearfix">
        <div class="message-data text-right">
          <span class="message-data-time">${element.author.username}</span>
          <img src="${element.author.avatar}" alt="avatar" />
        </div>
        <div class="message other-message float-right">
        <img src="${element.content}" style="width: 300px; height: auto; cursor: pointer" onclick="redirectTo('${element.content}')" />
        </div>
      </li>
        `);
      } else {
        $("#list-chat").append(`<li class="clearfix">
        <div class="message-data">
          <img src="${element.author.avatar}" alt="avatar" />
          <span class="message-data-time">${element.author.username}</span>
        </div>
        <div class="message my-message">
        <img src="${element.content}" style="width: 300px; height: auto; cursor: pointer" onclick="redirectTo('${element.content}')" />
        </div>
      </li>
        `);
      }
    } else {
      if (element.author._id === userid) {
        // nếu là user chính chủ thì nằm bên phải
        $("#list-chat").append(`<li class="clearfix">
    <div class="message-data text-right">
      <span class="message-data-time">${element.author.username}</span>
      <img src="${element.author.avatar}" alt="avatar" />
    </div>
    <div class="message other-message float-right">
      ${element.content}
    </div>
  </li>
    `);
      } else {
        $("#list-chat").append(`<li class="clearfix">
    <div class="message-data">
      <img src="${element.author.avatar}" alt="avatar" />
      <span class="message-data-time">${element.author.username}</span>
    </div>
    <div class="message my-message">
      ${element.content}
    </div>
  </li>
    `);
      }
    }
  });

  $("#list-chat").scrollTop($("#list-chat")[0].scrollHeight);
});

socket.on("Server-chat", function (data) {
  // let username1 = data.user.username;
  if (data.message.startsWith("/uploads/")) {
    if (userid === data.userid) {
      // nếu là user chính chủ thì nằm bên phải
      $("#list-chat").append(`<li class="clearfix">
      <div class="message-data text-right">
        <span class="message-data-time">${data.username}</span>
        <img src="${data.avatar}" alt="avatar" />
      </div>
      <div class="message other-message float-right">
      <img src="${data.message}" style="width: 300px; height: auto; cursor: pointer" onclick="redirectTo('${data.message}')" />
      </div>
    </li>
      `);
    } else {
      $("#list-chat").append(`<li class="clearfix">
      <div class="message-data">
        <img src="${data.avatar}" alt="avatar" />
        <span class="message-data-time">${data.username}</span>
      </div>
      <div class="message my-message">
      <img src="${data.message}" style="width: 300px; height: auto; cursor: pointer" onclick="redirectTo('${data.message}')" />
      </div>
    </li>
      `);
      // createNotification(
      //   "{position: 'top left',type: 'success'}",
      //   data.username + ": đã gửi một hình ảnh!"
      // );
    }
    
  } else {
    if (userid === data.userid) {
      // nếu là user chính chủ thì nằm bên phải
      $("#list-chat").append(`<li class="clearfix">
      <div class="message-data text-right">
        <span class="message-data-time">${data.username}</span>
        <img src="${data.avatar}" alt="avatar" />
      </div>
      <div class="message other-message float-right">
        ${data.message}
      </div>
    </li>
      `);
    } else {
      $("#list-chat").append(`<li class="clearfix">
      <div class="message-data">
        <img src="${data.avatar}" alt="avatar" />
        <span class="message-data-time">${data.username}</span>
      </div>
      <div class="message my-message">
        ${data.message}
      </div>
    </li>
      `);
      // createNotification(
      //   "{position: 'top left',type: 'success'}",
      //   data.username + " in room: " + data.roomname + ": \n" + data.message
      // );
    }
    
  }

  $("#list-chat").scrollTop($("#list-chat")[0].scrollHeight);
});

socket.on("Has-somebody-online", function (data) {
  // console.log(data);
  $("#listUser").html("");
  data.forEach((e) => {
    if (e.userid !== userid)
      $("#listUser").append(`<li class="clearfix info-user ${
        e.userid
      }" onclick="clickUser('${e.userid}', '${e.socketid}')">
  <img src="${e.avatar.replace("%5C", "/")}" alt="avatar" />
  <div class="socketid ${e.socketid}"></div>
  <div class="about">
    <div class="name">${e.username}</div>
    <div class="status">
      <i class="fa fa-circle online"></i> online
    </div>
  </div>
</li>`);
  });
});

socket.on("Server-has-somebody-writing", function (data) {
   {$(".user-writing").html(data.message);}
});

async function show_confirm(data) {
  swal("Calling...", {
    buttons: {
      confirm: "Let's do it!",
      cancel: true,
    },
    title: data.nameA,
    icon: "warning"
  }).then((e) => {
    if (e === true) {
      window.open('/call?from=' + data.socketidA, '_blank');
    } 
  })

  // let r = window.confirm(data.nameA + " calling...")
  // if (r === true) {
  //   window.open('/call?from=' + data.socketidA, '_blank');
  // } 
}

socket.on("Have-calling", async function (data) {
  console.log(data);
  // let r = window.confirm("Calling...")
  // if (r === true) {
  //   window.open('/call?from=' + data.socketidA, '_blank');
  // } 
  await show_confirm(data)

})

socket.on("Anybody-chat-to", function (data) {
  createNotification(
      "{position: 'top left',type: 'success'}",
      data.username + " in room: " + data.roomname + ": \n" + data.message
    );
})

$(document).ready(function () {
  $('.btn-video-call').hide()

  var userid = document.cookie
    .split("; ")
    .find((row) => row.startsWith("userid="))
    .split("=")[1];
  var username = document.cookie
    .split("; ")
    .find((row) => row.startsWith("username="))
    .split("=")[1];
  var avatar = document.cookie
    .split("; ")
    .find((row) => row.startsWith("avatar="))
    .split("=")[1];

  socket.emit("login", { userid: userid, username: username, avatar: avatar });

  // lấy username của chính mình
  // socket.emit("Client-get-myinfo");

  // $(".txt-chat").keyup(function (e) {
  //   if (e.keyCode == 13) {
  //     alert(1);
  //     $(".btn-send").click();
  //   }
  // });

  $(".btn-create-room").click(function () {
    socket.emit("Client-create-room", {
      roomname: $(".txt-create-room").val(),
      userid: userid,
    });
  });
  $(".btn-send").click(function () {
    if (currentRoomId !== "" || chatuserid !== "") {
      // console.log(currentRoomId);
      socket.emit("Client-send-message", {
        message: $(".txt-chat").val(),
        roomid: currentRoomId,
        userid: userid,
        socketidB: chatusersocketid
      });
      $('.emojionearea-editor').text("")
    } else {
      createNotification(
        "{position: 'top left',type: 'warning'}",
        "Please choose a room chat or user chat !"
      );
    }
  });

  $("#chatImage").change(function () {
    if (currentRoomId === "" && chatuserid === "") {
      createNotification(
        "{position: 'top left',type: 'warning'}",
        "Please choose a room chat or user chat !"
      );
    } else {
      // var a = document.getElementById('chatImage').files[0]
      var data = new FormData($("#chatimgform")[0]);
      // console.log(data);
      $.ajax({
        type: "POST",
        enctype: "multipart/form-data",
        url: "/chat/img",
        data: data,
        processData: false,
        contentType: false,
        cache: false,
        // timeout: 600000,
        success: function (data1) {
          //         $("#list-chat").append(`<li class="clearfix">
          //   <div class="message-data text-right">
          //     <span class="message-data-time">${username}</span>
          //     <img src="${avatar.replace("%5C", "/")}" alt="avatar" />
          //   </div>
          //   <div class="message other-message float-right">
          //     <img src="${
          //       data1.path
          //     }" style="width: 300px; height: auto; cursor: pointer" onclick="redirectTo('${
          //           data1.origin
          //         }')" />
          //   </div>
          // </li>
          //   `);
          socket.emit("Client-send-message", {
            message: "/uploads/" + data1.origin,
            roomid: currentRoomId,
            userid: userid,
          });
        },
        error: function (e) {
          createNotification(
            "{position: 'top left',type: 'danger'}",
            "Error upload image"
          );
        },
      });
    }

    // $.post('/chat/img', {chatImage: formData})
  });

  $(".txt-chat").focusout(function () {
    socket.emit("Client-writing", { message: "", roomid: currentRoomId });
  });

  $(".input-chat").focusin(
    function () {
      socket.emit("Client-writing", {
        message: username + " đang nhập",
        roomid: currentRoomId,
      });
    }
  );

});

export function redirectTo1(url) {
  // console.log(url);
  if (url.startsWith("/uploads/")) {
    window.location.href = url;
  } else window.location.href = "/uploads/" + url;
}

export function clickRoom1(id) {
  $("#currentName").html($(".roomname." + id).html());
  socket.emit("Client-list-chat-room", id);
  currentRoomId = id;

  $('.btn-video-call').hide()
}

export function clickUser1(id, socketid) {
  chatusersocketid = ""
  $("#currentName").html($(".info-user." + id + " > .about > .name").html());
  socket.emit("Client-list-chat-user", { myId: userid, userid: id });
  chatuserid = id;
  chatusersocketid = socketid 

  $('.btn-video-call').show()
  $('.btn-video-call').attr('href', '/call?to=' + id)

}
