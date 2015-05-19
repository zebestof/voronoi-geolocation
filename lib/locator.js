"use strict";
var fs  = require('fs'),
	D3  = require('d3'),
	db  = require('./dbimg')
;

var Locator = function(path) {
	this.parts = [];
	this.index = JSON.parse(fs.readFileSync(path+'/index.json'));
	this.index.forEach(function(part, i){
		this.index[i].db = new db(path+'/'+part.name);
	}, this)
}

Locator.prototype.find = function(lng, lat) {
	var part, info;
	for(var i=0; i<this.index.length; i++) {
		part = this.index[i];
		if (lng > part.lnglatNorthWest[0] && lng < part.lnglatSouthEast[0]
			&& lat > part.lnglatSouthEast[1] && lat < part.lnglatNorthWest[1]) {
			info = part;
			break;
		}
	}
	if (!info)
		return null;

	if (!info.d3Projection) {
		info.d3Projection = D3.geo.transverseMercator();
		info.d3Projection.rotate(info.projection.rotate)
				   .scale(info.projection.scale)
				   .translate(info.projection.translate);
	}

	var coord = info.d3Projection([lng, lat]);
	return info.db.getColorAt(Math.round(coord[0]), Math.round(coord[1]));
};


module.exports = Locator;