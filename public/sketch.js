// consts
const maxLifetime = 1000;
const maxChainLength = 50;
const alignTime = 100;
const spawnProb = 0.00625;
const dispLength = 1000;
const maxSize = 100;

// p5
var arrow;
var remainderX, remainderY, sizeX, sizeY;
var angles, touched, touchedAt, ripple, poles, holes;
var spawns;
var relAnglesPoles, relAnglesHoles;
var startX, startY;
var controllerX, controllerY;
var start;
var nodeSize, globalColor;
var mode;
var arrowSize;
var manip;

// osc
var incomingPort = 3333;
var connect_to_this_ip = window.location.hostname;
var outgoingPort = 3334;

function preload() {
	arrow = "↣";
}

function setup() {
  	createCanvas(windowWidth, windowHeight);
	noCursor();
  	startX = 0;
	startY = 0;
	angles = [];
	touched = [];
	touchedAt = [];
	ripple = [];
	poles = [];
	holes = [];
	mode = "prod";
	processURL(new URL(window.location.href));
	start = (mode == "dev");
	nodeSize = (arrowSize == "lg") ? 100 : 75;
	globalColor = color(29, 11, 50);
	spawns = new Chain("spawn", maxChainLength);

	relAnglesPoles = { 	"up": (1/2)*PI,
					"down": (3/2)*PI,
					"left": 0,
					"right": PI };

	relAnglesHoles = { 	"down": (1/2)*PI,
					"up": (3/2)*PI,
					"right": 0,
					"left": PI }

	setupMesh();	
	controllerX = -1;
	controllerY = -1;
	manip = false;
	setupOsc(incomingPort, outgoingPort, connect_to_this_ip);
	// setupOsc(outgoingPort, incomingPort, connect_to_this_ip);
}

function draw() {
	drawBackground(globalColor);
	if (start) {
		if (mouseIsPressed) {
	  		manipMesh();
		}
		disp();
		spawn();
		drawMesh();
		drawSpawns();
	} else {
		drawWelcome();
	}
	drawCursor();
}

function processURL(url) {
	mode = (url.searchParams.get("mode")) ? url.searchParams.get("mode") : "prod";
	arrowSize = (url.searchParams.get("size")) ? url.searchParams.get("size") : "md";
}

function setupMesh(oldAngles, oldTouched, oldTouchedAt, oldRipple, oldPoles, oldHoles) {
	remainderX = windowWidth % nodeSize;
  	remainderY = windowHeight % nodeSize;
  	sizeX = Math.floor(windowWidth / nodeSize);
  	sizeY = Math.floor(windowHeight / nodeSize);
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		if (oldAngles) {
	  			if (oldAngles[sizeX*j + i]) {
	  				angles[sizeX*j + i] = oldAngles[sizeX*j + i];
	  			} else {
	  				angles[sizeX*j + i] = Math.random() * (2*PI);
	  			}
	  		} else {
  				angles[sizeX*j + i] = Math.random() * (2*PI);
  			}

  			if (oldTouched) {
	  			touched[sizeX*j + i] = oldTouched[sizeX*j + i];
	  		} else {
				touched[sizeX*j + i] = false;
	  		}

	  		if (oldTouchedAt) {
	  			touchedAt[sizeX*j + i] = oldTouchedAt[sizeX*j + i];
	  		} else {
	  			touchedAt[sizeX*j + i] = -1;
	  		}

	  		if (oldRipple) {
	  			ripple[sizeX*j + i] = oldRipple[sizeX*j + i];
	  		} else {
				ripple[sizeX*j + i] = false;
	  		}

	  		if (oldPoles) {
	  			poles[sizeX*j + i] = oldPoles[sizeX*j + i];
	  		} else {
				poles[sizeX*j + i] = (Math.random() < 0.01);
	  		}

	  		if (oldHoles) {
	  			holes[sizeX*j + i] = oldHoles[sizeX*j + i];
	  		} else {
				holes[sizeX*j + i] = (Math.random() < 0.01);
	  		}
	  		// image(arrow, i*nodeSize + remainderX / 2, j*nodeSize + remainderY/2);
	  	}
	}
}

function drawBackground(color) {
	var r, g, b;
	r = color.levels[0];
	g = color.levels[1];
	b = color.levels[2];
	// console.log(r + " " + g + " " + b);
	if (mode == "dev") {
		background(color);
		return;
	}
	if (frameCount < dispLength/3) {
		background(	r + ((255 - r)*(1 - (frameCount)/(dispLength/3))), 
					g + ((255 - g)*(1 - (frameCount)/(dispLength/3))),
					b + ((255 - b)*(1 - (frameCount)/(dispLength/3))));
	} else if (frameCount < 2*dispLength/3) {
		background(r, g, b);
	} else if (frameCount < dispLength) {
		background(	r + ((255 - r)*((frameCount - 2*dispLength/3)/(dispLength/3))), 
					g + ((255 - g)*((frameCount - 2*dispLength/3)/(dispLength/3))),
					b + ((255 - b)*((frameCount - 2*dispLength/3)/(dispLength/3))));
	} else if (frameCount < dispLength*2) {
		background(	r + ((255 - r)*(1 - (frameCount-dispLength)/(dispLength))), 
					g + ((255 - g)*(1 - (frameCount-dispLength)/(dispLength))),
					b + ((255 - b)*(1 - (frameCount-dispLength)/(dispLength))));
	} else {
		background(color);
	}
}

function drawWelcome() {
	var titleFactor = (.25) * (frameCount) + 200;
	var subTitleFactor = (.05) * (frameCount) + 200;
	if (frameCount < dispLength/3) {
		fill(255, 255*(frameCount)/(dispLength/3));
	} else if (frameCount < 2*dispLength/3) {
		fill(255);
	} else if (frameCount < dispLength) {
		fill(255, 255*(1 - (frameCount-2*dispLength/3)/(dispLength/3)));
	} else {
		start = true;
		return;
	}
	writeCentered("ADRIFT", windowHeight/2 - 15, titleFactor, 50);
	writeCentered("BY PORTER SHERMAN", windowHeight/2 + 35, subTitleFactor, 25);
}

function writeCentered(string, y, factor, size) {
	var length = string.length;
	textAlign(CENTER);
	textSize(size);
	if (factor == 0) {
		text(string, windowWidth/2, y);
		return;
	}
	for (var i = 0; i < length; i++) {
		text(string.charAt(i), windowWidth/2+((i+1/2-length/2)/(length/2)*factor), y);
	}
}

function drawMesh() {
	var fade = (frameCount < dispLength*2);
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		push();
			translate((i+0.5)*nodeSize + remainderX/2, (j+0.5)*nodeSize + remainderY/2);	
			if (holes[sizeX*j+i]) {
				if (fade) {
					stroke(127 + ((128)*(1 - (frameCount-dispLength)/(dispLength))));
				} else {
					stroke(127);
				}
				strokeWeight(3);
				noFill();
				ellipseMode(CENTER);
				ellipse(0, 0, nodeSize/2, nodeSize/2);
			} else if (poles[sizeX*j+i]) {
				noStroke();
				if (fade) {
					fill(127 + ((128)*(1 - (frameCount-dispLength)/(dispLength))));
				} else {
					fill(127);
				}
				ellipseMode(CENTER);
				ellipse(0, 0, nodeSize/2, nodeSize/2);
			} else {
				rotate(angles[sizeX*j + i]);
				imageMode(CENTER);	
				if (touched[sizeX*j+i]) {
					fill(0);
					noStroke();
					textAlign(CENTER);
					textSize(nodeSize);
					text(arrow, 0, nodeSize/4);
				} else {
					if (ripple[sizeX*j+i]) {
						if (fade) {
							fill(127 + ((128)*(1 - (frameCount-dispLength)/(dispLength))));
						} else {
							fill(127);
						}
						noStroke();
						textAlign(CENTER);
						textSize(nodeSize);
						text(arrow, 0, nodeSize/4);
						//image(arrow_rippled, 0, 0);
					} else {
						fill(255);
						noStroke();
						textAlign(CENTER);
						textSize(nodeSize);
						text(arrow, 0, nodeSize/4);
						//image(arrow, 0, 0);
					}
				}
			}
	  		pop();
	  	}
  	}
}

function manipMesh() {
	var imgX, imgY;
	imgX = Math.floor((startX - remainderX/2) / nodeSize);
  	imgY = Math.floor((startY - remainderY/2) / nodeSize);
  	if ((imgX >= 0) && (imgY >= 0) && (imgX < sizeX) && (imgY < sizeY) && (manip)) {
  		var delta = (mouseY - startY)/windowHeight;
  		if (touched[sizeX*imgY + imgX] == false) {
    		sendOsc('/touch', [imgX, imgY, sizeX, sizeY]);
    	} else {
    		sendOsc('/angle', [angles[sizeX*imgY + imgX]]);
    	}
    	angles[sizeX*imgY + imgX] += 0.1*delta;
    	angles[sizeX*imgY + imgX] = angles[sizeX*imgY + imgX] % (2*PI);
    	// console.log(angles[sizeX*imgY + imgX]);
    	touched[sizeX*imgY + imgX] = true;
    	touchedAt[sizeX*imgY + imgX] = millis();
    }
}

function drawCursor() {
	noStroke();
	fill(255, 255, 255);
	ellipse(mouseX, mouseY, nodeSize/4, nodeSize/4);
}

function spawn() {
	if (Math.random() < spawnProb) {
		sendOsc("/spawn", [1]);
		spawns.add(Math.random()*(windowWidth - 100) + 50, Math.random()*(windowHeight - 100) + 50, maxSize, maxLifetime, globalColor);
	}
}

function drawSpawns() {
	spawns.draw(true, remainderX, remainderY);
}

function precise(x) {
  	return Number.parseFloat(x).toPrecision(4);
}

function clamp255(val) {
	return (val > 255) ? 255 : (val < 0) ? 0 : val;
}

function mousePressed() {
	manip = (!spawns.isIntersected());
	spawns.trig();
	startX = mouseX;
	startY = mouseY;
}

function mouseMoved() {
	controllerX = -1;
	controllerY = -1;
}

function doubleClicked() {
  	var fs = fullscreen();
   	fullscreen(!fs);
}

function windowResized() {
  	resizeCanvas(windowWidth, windowHeight);
  	setupMesh(angles, touched, touchedAt, ripple, poles, holes);
}

function receiveOsc(address, value) {
	console.log("received OSC: " + address + ", " + value);
		
	if (address == '/controller') {
		controllerX = value[0];
		controllerY = value[1];
	}

	if (address == '/color') {
		globalColor = color(value[0], value[1], value[2]);
		// debugger;
	}
}

function getAngleFromPixel(x, y) {
	indX = Math.floor((x - remainderX/2) / nodeSize);
	indY = Math.floor((y - remainderY/2) / nodeSize);
	// console.log(x + " " + y);
	return angles[sizeX*indY + indX];
}

function getHolesFromPixel(x, y) {
	indX = Math.floor((x - remainderX/2) / nodeSize);
	indY = Math.floor((y - remainderY/2) / nodeSize);
	// console.log(x + " " + y);
	return holes[sizeX*indY + indX];
}

function disp() {
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		// angles[sizeX*j + i] += (Math.random()-0.5) * 0.01;
	  		var totalDelta = 0;
	  		
	  		// up
	  		totalDelta += propDelta(sizeX*j + i, sizeX*((j+sizeY-1)%sizeY) + i, "up");

	  		// down
	  		totalDelta += propDelta(sizeX*j + i, sizeX*((j+1)%sizeY) + i, "down");

	  		// left
	  		totalDelta += propDelta(sizeX*j + i, sizeX*j + ((i+sizeX-1)%sizeX), "left");

	  		// right
	  		totalDelta += propDelta(sizeX*j + i, sizeX*j + ((i+1)%sizeX), "right");

  			ripple[sizeX*j+i] = (totalDelta > 0.25);

	  		if ((Math.abs(totalDelta) < 0.3) && (touched[sizeX*j+i] == true)) {
	  			if (millis() - touchedAt[sizeX*j+i] > 1000) {
	  				touched[sizeX*j+i] = false;	
	  				sendOsc('/noteoff', [i, j]);
	  			}
	  		}
	  	}
	}
}

function propDelta(cur, neighbor, rel) {
	var delta;
	if (poles[neighbor]) {
		delta = relAnglesPoles[rel] - angles[cur];
		angles[cur] += delta;
		return 0;
	} else if (holes[neighbor]) {
		delta = relAnglesHoles[rel] - angles[cur];
		angles[cur] += delta;
		return 0;
	} else {
		delta = angles[neighbor] - angles[cur];
	}
	if (!touched[cur]) {
		if (!touched[neighbor]) {
			angles[cur] += delta / (10 * alignTime);
		} else {
			angles[cur] += delta / alignTime;
		}
	} else {
		angles[cur] += delta / (100 * alignTime);
	}
	return Math.abs(delta);
}