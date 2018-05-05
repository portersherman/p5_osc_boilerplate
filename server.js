var express = require("express");
var app = express();
var server = app.listen(8000);
app.use(express.static("public"));

var osc = require('node-osc'), io = require('socket.io').listen(8080);
io.set('log level', 1);

var oscServers = {}, oscClients = {};

io.sockets.on('connection', function (socket) {
	socket.on("config", function (obj) {
		oscServers[socket.id] = new osc.Server(obj.server.port, obj.server.host);
	    oscClients[socket.id] = new osc.Client(obj.client.host, obj.client.port);
	    oscClients[socket.id].send('/status', socket.id + ' connected' + " to port " + obj.server.port);
	    console.log(oscClients);
		oscServers[socket.id].on('message', function(msg, rinfo) {
			io.sockets.emit("message", msg);
		});
		socket.emit("connected", 1);
	});
 	socket.on("message", function (obj) {
 		console.log(obj);
 		Object.keys(oscClients).forEach((k) => {
 			// console.log(oscClients[k]);
 			oscClients[k].send(obj);
 		});
  	});
	socket.on('disconnect', function() {
		// console.log(socket);
		oscServers[socket.id].kill();
		oscClients[socket.id].kill();
		delete oscClients[socket.id];
		delete oscServers[socket.id];
  	});
});