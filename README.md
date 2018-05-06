# p5-osc

Single-server, multiple client LAN framework for use in distributed graphics projects implemented in p5.js. Local 
communication uses Open Sound Control to permit front-end javascript running on client machines to send server-side mesages 
to programs running on the host machine.

Any number of client connections can be established.

The clients can send OSC messages from front-end javascript that will be broadcasted server-side on the host machine.

The host machine can send OSC messages from server-side programs (such as Max/MSP) to front-end javascript on client machines.

"receiveOsc()" can be found in sketch.js
"sendOsc('/address', [values])" can be called anywhere in front-end javascript

To build, run "npm install" from the project root, and "npm start" on the host machine. Connect clients using through the 
host machine's public IP on port 8000

Enjoy!

Porter

Credit to Jeff Snyder for framework structure
