
var queryRoom = getParameterByName("room");
//createRoom(queryRoom)

document.getElementById('title').innerHTML = "Saloon " + queryRoom;

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function changeVolume(){
    document.getElementById('remoteAudio').volume = (document.getElementById('volumeControl').value/100);
}

var firstLoad =true;

function peerJoined(){
    document.getElementById( 'loader' ).style.display = 'none';
    document.getElementById( 'client-settings' ).style.display = 'block';
}

function iframeFinishedLoading(){
    var queryVideo = getParameterByName("video");
    if(firstLoad){
        firstLoad = false;
        document.getElementById('videoFrame').src = "https://www.youtube.com/embed/" + queryVideo;
    }
}