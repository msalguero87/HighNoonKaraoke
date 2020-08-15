'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;
var rommEntryCallback;

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }

]
};

//window.room = prompt("Enter room name:");

var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

var socket = io.connect();

function createRoom(roomName, callback){
  window.room = roomName;
  rommEntryCallback = callback;
  if (room !== "") {
    console.log('Message from client: Asking to join room ' + room);
    socket.emit('create or join', room);
  }
}

var joinRoom = createRoom;

socket.on('created', function(room, clientId) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Message from client: Room ' + room + ' is full :^(');
});

socket.on('ipaddr', function(ipaddr) {
  console.log('Message from client: Server IP address is ' + ipaddr);
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
  if(peerJoined) peerJoined();
});

socket.on('joined', function(room, clientId) {
  console.log('joined ' + room);
  isInitiator = false;
  isChannelReady = true;
  if(rommEntryCallback)
    rommEntryCallback();
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

function sendMessage(message){
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

socket.on('message', function(message){
  console.log('Client received message: ', message);
  if(message === "got user media"){
    //maybeStart();
    createPeerConnection();
  }else if(message.type === "offer"){
    if(!isInitiator && !isStarted){
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  }else if(message.type === "answer" && isStarted){
    pc.setRemoteDescription(new RTCSessionDescription(message));
  }else if(message.type === "candidate" && isStarted){
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  }else if(message === "bye" && isStarted){
    handleRemoteHangup();
  }
});

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var remoteAudio = document.querySelector("#remoteAudio");

function prepareMediaDevices(){
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  }).then(gotStream)
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
}



function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  //localVideo.srcObject = stream;
  sendMessage('got user media');
  //if (isInitiator) {
  maybeStart();
  //}
}

function maybeStart(){
  if(!isStarted && typeof localStream !== 'undefined' && isChannelReady){
    console.log('>>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log("isInitiator: ", isInitiator);
    //if(isInitiator){
      doCall();
    //}
  }
}

window.onbeforeunload = function(){
  this.sendMessage('bye');
}

function createPeerConnection(){
  try{
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created PeerConnection');
  }
  catch(e){
    console.log("failed to create peer connection ", e);
    return;
  }
}

function handleIceCandidate(event){
  console.log("ice candidate");
  console.log(event);
  if(event.candidate){
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else{
    console.log("end of candidates.");
  }
}

function handleRemoteStreamAdded(event){
  console.log("Adding Remote Stream");
  remoteStream = event.stream;
  //remoteVideo.srcObject = event.stream;
  console.log(event.stream);
  remoteAudio.srcObject = event.stream;
  //remoteAudio.play();
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}
function doCall(){
  console.log("doCall");
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function setLocalAndSendMessage(sessionDescription){
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function doAnswer(){
  console.log("doAnswer");
  pc.createAnswer().then(setLocalAndSendMessage, onCreateSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup(){
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}