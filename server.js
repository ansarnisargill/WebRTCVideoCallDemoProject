// Load required modules
var http = require("http");
var express = require("express");
var socketIo = require("socket.io");
const hbs = require("hbs");
const bodyParser = require('body-parser');
const session = require("express-session");
const fileUpload = require('express-fileupload');
const PORT = process.env.PORT || 3000;

var easyrtc = require("open-easyrtc");
process.title = "node-easyrtc";
var app = express();
app.use(session({
    secret: 'DHA GUJRANWALA',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.set('view engine', "hbs");
app.set('views', './views');
app.get('/', (req, res) => {
    res.render('Home', {});
});

var webServer = http.createServer({
}, app);


var socketServer = socketIo.listen(webServer, { "log level": 1 });

var myIceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    {
        urls: 'turn:numb.viagenie.ca',
        credential: '4j8z26irNFNkYf4',
        username: 'ansarnisargill@gmail.com'
    },
    {
        urls: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        urls: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        urls: 'turn:turn.bistri.com:80',
        credential: 'homeo',
        username: 'homeo'
    }
];
easyrtc.setOption("appIceServers", myIceServers);
easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function (socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function (err, connectionObj) {
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }
        connectionObj.setField("credential", msg.msgData.credential, { "isShared": false });
        console.log("[" + easyrtcid + "] Credential saved!", connectionObj.getFieldValueSync("credential"));
        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function (connectionObj, roomName, roomParameter, callback) {
    console.log("[" + connectionObj.getEasyrtcid() + "] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function (err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function (appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

// Listen on port 8080
webServer.listen(PORT, function () {
    console.log('listening on https://localhost:' + PORT);
});
