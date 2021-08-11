function openLocalStream() {
  const config = { audio: true, video: true };
  return navigator.mediaDevices.getUserMedia(config);
}

function playStream(idVideoTag, stream) {
  const video = document.getElementById(idVideoTag);
  video.srcObject = stream;
  video.play();
}

//Caller
// $("#btnCall").click(() => {
//   const id = $("#remoteId").val();
//   openStream().then((stream) => {
//     playStream("localStream", stream);
//     const call = peer.call(id, stream);
//     call.on("stream", (remoteStream) =>
//       playStream("remoteStream", remoteStream)
//     );
//   });
// });

//Callee
// peer.on("call", (call) => {
//   openStream().then((stream) => {
//     call.answer(stream);
//     playStream("localStream", stream);
//     call.on("stream", (remoteStream) =>
//       playStream("remoteStream", remoteStream)
//     );
//   });
// });

var socket = io(window.location.host);

let socketidB = document.cookie
.split("; ")
.find((row) => row.startsWith("socketid="))
.split("=")[1];

var username = document.cookie
    .split("; ")
    .find((row) => row.startsWith("username="))
    .split("=")[1];

const peer = new Peer();

peer.on("open", (id) => {
  // $("#my-peer").append(id);
  // Get query string
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  if (Object.keys(params).some((e) => e === "to")) {
    // Caller
    openLocalStream().then((localstream) => {
      playStream("localStream", localstream);

      // let mypeer = $("#my-peer").html();
      socket.emit("Client-call-to", {
        myPeerid: id,
        nameA: username,
        socketidB: socketidB,
        socketidA: socket.id,
      });

      socket.on("Agree-call", function (data) {
        $('#calling-gif').hide()

        console.log(data);
        let peeridB = String(data.peeridB);
        console.log(peeridB);
        const call = peer.call(peeridB, localstream);
        call.on("stream", (remoteStream) =>
          playStream("remoteStream", remoteStream)
        );
      });
    });
  } else if (Object.keys(params).some((e) => e === "from")) {
    $('#calling-gif').hide()
    
    socket.emit("Client-receive-call", {
      peeridB: id,
      socketidA: params.from,
      socketidC: socket.id,
    });

    // Callee

    openLocalStream().then((localstream) => {
      playStream("localStream", localstream);
      peer.on("call", (call) => {
        call.answer(localstream);
        call.on("stream", (remoteStream) =>
          playStream("remoteStream", remoteStream)
        );
      });
    });
  }
});
