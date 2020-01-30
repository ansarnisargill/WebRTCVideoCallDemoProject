var LAST_MESSAGE_ID = 0;
var PreviousSlideNo = 0;
var allowdUserToChangeSlides = 'manit';
var socket = io();
var Users = [];
function callEverybodyElse(roomName, otherPeople) {

    easyrtc.setRoomOccupantListener(null); // so we're only called once.

    var list = [];
    var connectCount = 0;
    for (var easyrtcid in otherPeople) {
        list.push(easyrtcid);
    }
    //
    // Connect in reverse order. Latter arriving people are more likely to have
    // empty slots.
    //
    function establishConnection(position) {
        function callSuccess() {
            connectCount++;
            if (connectCount < maxCALLERS && position > 0) {
                establishConnection(position - 1);
            }
        }
        function callFailure(errorCode, errorText) {
            easyrtc.showError(errorCode, errorText);
            if (connectCount < maxCALLERS && position > 0) {
                establishConnection(position - 1);
            }
        }
        easyrtc.call(list[position], callSuccess, callFailure);

    }
    if (list.length > 0) {
        establishConnection(list.length - 1);
    }
}

function loginSuccess() { }
async function sendText(e) {
    var text = document.getElementById('textentryField').value;
    if (text === "") {
        return;
    }
    GetDateAndDayPortion(new Date());
    var stringToSend = `<b>${capitalizeFirstLetter(localStorage.UserName)}:</b> ${text}`;
    if (stringToSend && stringToSend != "") {
        for (var i = 0; i < maxCALLERS; i++) {
            var easyrtcid = easyrtc.getIthCaller(i);
            if (easyrtcid && easyrtcid != "") {
                easyrtc.sendPeerMessage(easyrtcid, "im", stringToSend);
            }
        }
    }
    showMessage(stringToSend, new Date().toUTCString(), true, false);
    document.getElementById('textentryField').value = "";
    return false;
}
function SendSmsOnEnter(event) {
    var x = event.code;
    if (x === 'Enter') {
        //event.preventDefault();
        document.getElementById("textentrySubmit").click();
    }

}

function showMessage(content, date, IsOwner, AppendToLast) {
    let showMessage;
    if (IsOwner) {
        showMessage = true;
    }
    else {
        showMessage = ShowMessageFilter(content);
    }
    if (showMessage) {
        var ul = document.getElementById("MessageList");
        var li = document.createElement("li");
        li.innerHTML = content;
        if (IsOwner) {
            li.setAttribute("style", "color:yellow;");
        }
        else {
            li.setAttribute("style", "color:white;");
        }
        if (AppendToLast) {
            ul.appendChild(li);
        }
        else {
            ul.insertBefore(li, ul.firstChild);
        }
    }

}

function messageListener(easyrtcid, msgType, content) {
    for (var i = 0; i < maxCALLERS; i++) {
        if (easyrtc.getIthCaller(i) == easyrtcid) {
            showMessage(content, new Date().toUTCString(), false, false);
        }
    }
}
async function ShowPreviousMessages() {
    let res = await fetch('/Rooms/GetMessages/' + LAST_MESSAGE_ID + '/' + localStorage.RoomName);
    let messages = await res.json();
    if (messages.length > 0) {
        for (let message of messages) {
            ShowSinglePreviousMessage(message.Message, message.Sender, message.TimeStamp);
            LAST_MESSAGE_ID = message.ID;
        }
    }
}
function ShowSinglePreviousMessage(content, user, dateString) {

    if (localStorage.UserName === user) {
        showMessage(content, dateString, true, true);
    }
    else {
        showMessage(content, dateString, false, true);
    }

}
function SetPresentaionSize() {
   
    document.getElementById("MessagePane").style.height = (window.innerHeight - 495) + "px";

}

async function appInit() {
    var RoomName = localStorage.RoomName;
    easyrtc.setRoomOccupantListener(callEverybodyElse);
    var roomNameForChat = RoomName.replace(new RegExp(" ", 'g'), "");
    easyrtc.easyApp(roomNameForChat, "box0", ["box1", "box2", "box3"], loginSuccess);
    easyrtc.setPeerListener(messageListener);
    easyrtc.setDisconnectListener(function () {
        easyrtc.showError("LOST-CONNECTION", "Lost connection to signaling server");
    });
    easyrtc.setOnCall(function (easyrtcid, slot) {
        console.log("getConnection count=" + easyrtc.getConnectionCount());
        boxUsed[slot + 1] = true;
        document.getElementById(getIdOfBox(slot + 1)).style.visibility = "visible";
    });

    easyrtc.setOnHangup(function (easyrtcid, slot) {
        boxUsed[slot + 1] = false;
        if (activeBox > 0 && slot + 1 == activeBox) {
            //collapseToThumb();
        }
        setTimeout(function () {
            document.getElementById(getIdOfBox(slot + 1)).style.visibility = "hidden";
        }, 20);
    });
    document.getElementById("roomName").innerText = RoomName;
}
function GetDateAndDayPortion(dateString) {
    var toReturn;
    var date = new Date(Date.parse(dateString));
    if (datesAreOnSameDay(new Date(), date)) {
        toReturn = date.getHours() + " : " + date.getMinutes();
    }
    else {
        toReturn = date.format("dS mmm yy, hh:MM");
    }
    return toReturn;

}
function datesAreOnSameDay(first, second) {
    return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}



function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function ClearText() {
    document.getElementById("MessageList").innerHTML = "";
    LAST_MESSAGE_ID = 0;
}
