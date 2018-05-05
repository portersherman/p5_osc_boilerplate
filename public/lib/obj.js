function wrapX(x, remainderX, remainderY) {
	return remainderX/2 + ((x - remainderX/2) + (windowWidth - remainderX)) % (windowWidth - remainderX);
}

function wrapY(y, remainderX, remainderY) {
	return remainderY/2 + ((y - remainderY/2) + (windowHeight - remainderY)) % (windowHeight - remainderY);
}

function Point(x, y, size, lifetime, globalColor) {
	this.x = x;
	this.y = y;
	this.lifetime = lifetime;
	this.maxLifetime = lifetime;
	this.emitted = -1;
	this.trig = false;
	this.size = size;
	this.maxSize = size;
	this.dir = getAngleFromPixel(x, y);
	this.color = globalColor;
	this.above = (127 < (0.2126 * globalColor.levels[0] + 0.7152*globalColor.levels[1] + 0.0722*globalColor.levels[2]));
}

Point.prototype.setTrig = function(trig) {
	this.trig = trig;
}

Point.prototype.getTrig = function() {
	return this.trig;
}

Point.prototype.update = function(remainderX, remainderY) {
	var newDir;
	this.lifetime -= 1;
	this.size = this.maxSize*(this.lifetime/this.maxLifetime);
	this.x += Math.cos(this.dir) * (0.5 * (1 - (this.size/this.maxSize)));
	this.y += Math.sin(this.dir) * (0.5 * (1 - (this.size/this.maxSize)));
	if (!getHolesFromPixel(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY))) {
		newDir = getAngleFromPixel(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY));
		if ((Math.abs(newDir - this.dir) > 0.05) && (this.trig) && (millis() - this.emitted > 500)) {
			this.emitted = millis();
			sendOsc('/cross', this.size);
		}
		this.dir = newDir;
	}
}

Point.prototype.display = function(remainderX, remainderY) {
	var newColor;
	var intersected;
	var dx = (mouseX-wrapX(this.x, remainderX, remainderY));
	var dy = (mouseY-wrapY(this.y, remainderX, remainderY));
	intersected = (Math.sqrt(dx*dx + dy*dy) < this.size/2);
	if (this.trig) {
		strokeWeight(4);
		if (intersected) {
			stroke(this.getNewColor(true));
		} else {
			stroke(this.getNewColor(false));
		}
		newColor = this.getNewColor(true);
	} else if (intersected) {
		newColor = this.getNewColor(false);
		strokeWeight(4);
		stroke(this.getNewColor(true));
	} else {
		newColor = this.getNewColor(false);
		noStroke();
	}
	fill(newColor);
	ellipse(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY), this.size, this.size);
	this.update(remainderX, remainderY);
	return intersected;
}

Point.prototype.link = function(prev) {
	var newColor = this.getNewColor(false);
	if (prev) {
		strokeWeight(3.0);
		stroke(newColor);
	    line(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY), wrapX(prev.x, remainderX, remainderY), wrapY(prev.y, remainderX, remainderY));
	}
}

Point.prototype.getNewColor = function(noComp) {
	if (noComp) {
		return color(255);
	} else {
		var temprgb=this.color;
		var temphsv=RGB2HSV(temprgb);
		temphsv.hue=HueShift(temphsv.hue, 180.0);
		temprgb=HSV2RGB(temphsv);
		return temprgb;
	}
}
	

function Chain(type, length) {
	this.points = [];
	this.drawn = false;
	this.type = type;
	this.maxChainLength = length;
	this.intersected = false;
	this.intersections = [];
	this.xInt = -1;
	this.yInt = -1;
}

Chain.prototype.isIntersected = function() {
	return this.intersected;
}

Chain.prototype.add = function(x, y, size, lifetime, globalColor) {
	if (this.type === "mouse") {
		this.points.push(new Point(x, y, size,lifetime, globalColor));
	} else {
		this.points.splice(Math.random() * (this.points.length - 1), 0, new Point(x, y, size, lifetime, globalColor));
	} 
	
	if (this.points.length > this.maxChainLength) {
		this.points.pop();
	}
}

Chain.prototype.draw = function(link, remainderX, remainderY) {
	var intersected = false;
	for (var i = this.points.length - 1; i >= 0; i--) {
		if (this.points[i].lifetime <= 0) {
			this.points.splice(i, 1);
		} else {
			this.points[i].link(this.points[i+1]);
		}
	}
	for (var i = this.points.length - 1; i >= 0; i--) {
		var nowIntersected = (this.points[i].display(remainderX, remainderY));
		intersected = (nowIntersected) || intersected;
		if (nowIntersected) {
			this.xInt = this.points[i].x;
			this.yInt = this.points[i].y;
			this.intersections[i] = true;
		} else {
			this.intersections[i] = false;
		}
	}
	if ((this.intersected != intersected) && (intersected == false)) {
		sendOsc('/intersect', [wrapX(this.xInt, remainderX, remainderY), wrapY(this.yInt, remainderX, remainderY), windowWidth, windowHeight]);
	}
	this.intersected = intersected;
	this.drawn = true;
}

Chain.prototype.trig = function() {
	for (var i = 0; i < this.points.length; i++) {
		if (this.intersections[i] || this.points[i].getTrig()) {
			if (!this.points[i].getTrig()) {
				sendOsc('/trig', [i]);	
			}
			this.points[i].setTrig(true);
		} else {
			this.points[i].setTrig(false);
		}

	}
}