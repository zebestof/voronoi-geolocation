"use strict";
var fs    = require('fs'),
	PNG   = require('pngjs').PNG
;

function DBimg(path) {
	this.path = fs.openSync(path,'r');
	// one read
	this.w    = this._readAs('readUInt32LE',0,4);
	this.h    = this._readAs('readUInt32LE',4,4);
	this.paletteSize   = this._readAs('readUInt32LE',8,4);

	this.palette = [];
	var b = new Buffer(this.paletteSize * 4);
	fs.readSync(this.path, b, 0, this.paletteSize*4, 12);
	for (var i=0 ; i<this.paletteSize*4 ; i+=4)
		this.palette.push(b.readUInt32LE(i));

	var dataSize = this.paletteSize > 255 ? this.w * this.h * 2 : this.w * this.h;
	this.data = new Buffer(dataSize);
	fs.readSync(this.path, this.data, 0, dataSize, 12+this.paletteSize*4);
};

DBimg.prototype._readAs = function(method,pos,size) {
	var b = new Buffer(size);
	fs.readSync(this.path, b, 0, size, pos);
	return b[method](0);
};

DBimg.prototype.getColorAt = function(x,y) {
	var colorIndex;
	if (this.paletteSize < 255)
		colorIndex = this.data.readUInt8(this.w * y + x);
	else
		colorIndex = this.data.readUInt16LE((this.w * y + x)*2);
	return this.palette[colorIndex];
};

DBimg.encodeData = function (png, dbPath, done) {
	done = done || null;

	var x, y,
		offset,
		color,
		colorIndex,
		w = png.width,
		h = png.height,
		palette = [],
		colorIndexByOffset = [];

	for (y = 0; y < w; y++) {
		for (x = 0; x < h; x++) {
			offset = (w * y + x) << 2;
			color = (png.data[offset+2]) | (png.data[offset+1]<< 8) | (png.data[offset]<< 16);
			colorIndex = palette.indexOf(color);
			if (colorIndex == -1) {
				colorIndex = palette.length;
				palette.push(color);
			}
			colorIndexByOffset.push(colorIndex);
		}
	}

	var output = fs.createWriteStream(dbPath),
		header = new Buffer(12 + (palette.length * 4));

	[w, h, palette.length].concat(palette).forEach(function (data, index) {
		header.writeUInt32LE(data, index * 4);
	});

	output.write(header);

	var writeMethod = (palette.length < 255) ? Buffer.prototype.writeUInt8  : Buffer.prototype.writeUInt16LE,
		indexSize   = (palette.length < 255) ? 1  : 2,
		body 		= new Buffer(Math.min(w*h*indexSize, 1024 * 1024 * 10)),
		i = 0;

	for (offset=0; offset<w*h; offset++){
		writeMethod.call(body,colorIndexByOffset[offset],i);
		i += indexSize;
		if (i === body.length) {
			output.write(body);
			i = 0;
		}
	}

	if(i != 0)
		output.write(body);

	output.end(done);
};

DBimg.Generate = function(imgPath, dbPath) {
	fs.createReadStream(imgPath)
		.pipe(new PNG({filterType: 4}))
		.on('parsed', function(){ DBimg.encodeData(this, dbPath); });
};

module.exports = DBimg;