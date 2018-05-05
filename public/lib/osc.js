var socket;
var isConnected = false;

function sendOsc(address, value) {
  if (isConnected == true)
  {
 	socket.emit('message', [address].concat(value));
  }    
}

function setupOsc(oscPortIn, oscPortOut, whichIP) {
	socket = io.connect(window.location.hostname, { port: 8080, forceNew: true, rememberTransport: false });
	socket.on('connect', function() {
		socket.emit('config', {	
			server: { port: oscPortIn},
			client: { port: oscPortOut, host: whichIP}
		});
    isConnected = true;
	});
	socket.on('message', function(msg) {
		if (msg[0] == '#bundle') {
			for (var i=2; i<msg.length; i++) {
				receiveOsc(msg[i][0], msg[i].splice(1));
			}
		} else {
			receiveOsc(msg[0], msg.splice(1));
		}
	});
	socket.on('disconnect', function() {
		socket.disconnect();
		isConnected = false;
	})
}