/*
 * Gamepad API Test
 * Written in 2013 by Ted Mielczarek <ted@mielczarek.org>
 *
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */
var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var controllers = {};
var rAF = window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.requestAnimationFrame;
var savingQueue = [];
var recordedObject = {
  frames: 0,
  ms: [],
  buttons: [],
  sticks: []
}
onfocus = () => {
  //savingQueue = [];
  //console.log("Cleared saving queue");
};

function connecthandler(e) {
  addgamepad(e.gamepad);
}
function addgamepad(gamepad) {
  controllers[gamepad.index] = gamepad; var d = document.createElement("div");
  d.setAttribute("id", "controller" + gamepad.index);
  var t = document.createElement("h1");
  t.appendChild(document.createTextNode("gamepad: " + gamepad.id));
  d.appendChild(t);
  var b = document.createElement("div");
  b.className = "buttons";
  for (var i=0; i<gamepad.buttons.length; i++) {
    var e = document.createElement("span");
    e.className = "button";
    //e.id = "b" + i;
    e.innerHTML = i;
    b.appendChild(e);
  }
  d.appendChild(b);
  var a = document.createElement("div");
  a.className = "axes";
  for (i=0; i<gamepad.axes.length; i++) {
    e = document.createElement("meter");
    e.className = "axis";
    //e.id = "a" + i;
    e.setAttribute("min", "-1");
    e.setAttribute("max", "1");
    e.setAttribute("value", "0");
    e.innerHTML = i;
    a.appendChild(e);
  }
  d.appendChild(a);

  var saveButton = document.createElement("button");
  saveButton.textContent = "Save 60s";
  saveButton.addEventListener('click', () => {
    //savingQueue.enqueue()
    var now = new Date();
    var fileName = "controller0recording_";
    fileName += now.getFullYear() + "-";
    fileName += now.getMonth() + "-";
    fileName += now.getDate() + "_";
    fileName += now.getHours() + "-";
    fileName += now.getMinutes();

    JSONToFile(recordedObject, fileName);
    console.log("Saved");
  });
  d.appendChild(saveButton);

  document.getElementById("start").style.display = "none";
  document.body.appendChild(d);  
  rAF(updateStatus);
}

function disconnecthandler(e) {
  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  var d = document.getElementById("controller" + gamepad.index);
  document.body.removeChild(d);
  delete controllers[gamepad.index];
}

function updateStatus() {
  scangamepads();
  for (j in controllers) {
    var controller = controllers[j];
    var d = document.getElementById("controller" + j);

    var buttons = d.getElementsByClassName("button");
    var buttonString = "";
    for (var i=0; i<controller.buttons.length; i++) {
      var b = buttons[i];
      var val = controller.buttons[i];
      var pressed = val == 1.0;
      var touched = false;
      if (typeof(val) == "object") {
        pressed = val.pressed;
        if ('touched' in val) {
          touched = val.touched;
        }
        val = val.value;
      }
      var pct = Math.round(val * 100) + "%";
      b.style.backgroundSize = pct + " " + pct;
      b.className = "button";
      if (pressed) {
        b.className += " pressed";
      }
      if (touched) {
        b.className += " touched";
        buttonString += '1';
      }
      else{
        buttonString += '0';
      }
    }
    var axisString = "";
    var axes = d.getElementsByClassName("axis");
    for (var i=0; i<controller.axes.length; i++) {
      var a = axes[i];
      a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
      a.setAttribute("value", controller.axes[i]);
      var direction = controller.axes[i] >= 0 ? 1 : 0;
      if(Math.abs(controller.axes[i]) > (2/3)){
        axisString += controller.axes[i] >= 0 ? 4 : 0;
      }
      else if (Math.abs(controller.axes[i]) > (1/3)){
        axisString += controller.axes[i] >= 0 ? 3 : 1;
      }
      else{
        axisString += '0';
      }
    }
    if(j == 0){
      recordedObject.buttons.unshift(buttonString);
      recordedObject.sticks.unshift(axisString);
      recordedObject.ms.unshift(Date.now());
      recordedObject.frames++;
      if(recordedObject.frames > 4500){
        recordedObject.frames--;
        recordedObject.ms.pop();
        recordedObject.buttons.pop();
        recordedObject.sticks.pop;
      }
    }
  }
  rAF(updateStatus);
}

function scangamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && (gamepads[i].index in controllers)) {
      controllers[gamepads[i].index] = gamepads[i];
    }
  }
}

function JSONToFile (obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

if (haveEvents) {
  window.addEventListener("gamepadconnected", connecthandler);
  window.addEventListener("gamepaddisconnected", disconnecthandler);
} else if (haveWebkitEvents) {
  window.addEventListener("webkitgamepadconnected", connecthandler);
  window.addEventListener("webkitgamepaddisconnected", disconnecthandler);
} else {
  setInterval(scangamepads, 500);
}
