"use strict";
var D3        = require('d3'),
	Canvas 	  = require('canvas'),
	fs        = require('fs'),
	PNG       = require('pngjs').PNG,
	db        = require('./dbimg')
;

var BoundingBox = function(lnglatNorthWest, lnglatSouthEast, size) {
	this.lnglatNorthWest = lnglatNorthWest;
	this.lnglatSouthEast = lnglatSouthEast;
	this.size = size;
};

BoundingBox.Factory = function(maxLnglatNorthWest, maxLnglatSouthEast, size) {
	var results = [],
		lnglatSouthEast,
		lnglatNorthWest = [maxLnglatNorthWest[0], maxLnglatNorthWest[1]];

	while (lnglatNorthWest[1] > maxLnglatSouthEast[1]) {
		while (lnglatNorthWest[0] < maxLnglatSouthEast[0]) {
    		lnglatSouthEast = getLnglatSouthEast(lnglatNorthWest, size);
    		results.push(new BoundingBox(lnglatNorthWest, lnglatSouthEast, size));
    		lnglatNorthWest = [lnglatSouthEast[0], lnglatNorthWest[1]]
    	}
    	lnglatNorthWest = [maxLnglatNorthWest[0],lnglatSouthEast[1]]
    }

    return results;
};


BoundingBox.GenerateDb = function (boundingBoxes,  width, height, geos,  basePath, done) {
	var canvas = new Canvas(width, height),
		index  = [],
		json;

	var progress = function(current){
		if( current < boundingBoxes.length){
			json = boundingBoxes[current].toDb(canvas, geos, basePath+'/'+current+'.db', progress.bind(null, current+1));
			json.name = current+'.db';
			index.push(json);
		} else {
			fs.writeFileSync(basePath+'/index.json', JSON.stringify(index));
			if (done)
				done();
		}
	};

	progress(0);
};

BoundingBox.prototype.toDb = function(canvas, geos, name, done) {
	var stream = canvas.createPNGStream();
	var out    = fs.createWriteStream(name);

	stream.pipe(out);
	var json = this.createVoronoi(canvas, geos);
	stream.pipe(new PNG()).on('parsed', function () { db.encodeData(this, name, done); });

	return json;
};

BoundingBox.prototype.createVoronoi = function(canvas, geos) {
	var projection = this.getProjection(canvas.width, canvas.height);
	var center     = [-projection.rotate()[0],-projection.rotate()[1]];

	var cities = geos.filter(function(city) {
		return distance(city.longitude, city.latitude, center[0], center[1]) < this.size * 2000
	}, this)
	.map(function(city) {
		return projection([city.longitude, city.latitude]).concat(numberToHexColor([city.id]));
	});

	var voronoi = D3.geom.voronoi()(cities);

	var ctx = canvas.getContext('2d');
  	ctx.antialias = 'none';
  	voronoi.forEach(function(polygon){
  		ctx.fillStyle = polygon.point[2];
  		ctx.beginPath();
  		polygon.forEach(function (vertice, i) {
	  		if (i == 0)
				ctx.moveTo(vertice[0], vertice[1]);
		    else
				ctx.lineTo(vertice[0], vertice[1]);
		});
		ctx.fill();
  	});

  	return {
		lnglatNorthWest: this.lnglatNorthWest,
		lnglatSouthEast: this.lnglatSouthEast,
		size : this.size,
		width: this.width,
		height: this.height,
		points: cities.length,
		projection: this.projection
	}
};

BoundingBox.prototype.getProjection = function(width, height) {
	this.width = width;
	this.height = height;
	var projection = D3.geo.transverseMercator()
	var centerLocation = projection.invert([
		projection(this.lnglatNorthWest)[0] + (projection(this.lnglatSouthEast)[0] - projection(this.lnglatNorthWest)[0])/2,
		projection(this.lnglatNorthWest)[1] + (projection(this.lnglatSouthEast)[1] - projection(this.lnglatNorthWest)[1])/2
	]);

	projection.rotate([-centerLocation[0], -centerLocation[1]]);
	projection.scale(1).translate([0, 0]);

	var b = [[projection(this.lnglatNorthWest)[0], projection(this.lnglatNorthWest)[1]], [projection(this.lnglatSouthEast)[0], projection(this.lnglatSouthEast)[1]] ];
	var s = 0.9 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
	var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

	this.projection = {
		rotate : [-centerLocation[0], -centerLocation[1],0],
		scale  : s,
		translate :t
	}
	return projection.scale(s).translate(t);
};

function numberToHexColor(num) {
	var color = Number(num).toString(16);
    if (String(color).length != 6)
       color =  Array(7-color.length).join('0') + color;
    return '#' + color;
};

function getLnglatSouthEast(lnglatNorthWest, d) {
  //φ is latitude, λ is longitude
  var φ1 = lnglatNorthWest[1] * (Math.PI/180),
      λ1 = lnglatNorthWest[0] * (Math.PI/180),
      R  = 6378.1,
      brng = 90 * (Math.PI/180)
    ;
  var φ2 = Math.asin( Math.sin(φ1)*Math.cos(d/R) + Math.cos(φ1)*Math.sin(d/R)*Math.cos(brng));
  var λ2 = λ1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(φ1), Math.cos(d/R)-Math.sin(φ1)*Math.sin(φ2));

  brng = 180 * (Math.PI/180);
  var φ3 = Math.asin( Math.sin(φ1)*Math.cos(d/R) + Math.cos(φ1)*Math.sin(d/R)*Math.cos(brng) );
  var λ3 = λ1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(φ1), Math.cos(d/R)-Math.sin(φ1)*Math.sin(φ3));
  return [λ2* (180/Math.PI),φ3* (180/Math.PI)];
};

function distance(lon1,lat1,lon2,lat2) {
	var R = 6371000; // metres
	var φ1 = lat1 * (Math.PI/180);
	var φ2 = lat2 * (Math.PI/180);
	var Δφ = (lat2-lat1) * (Math.PI/180);
	var Δλ = (lon2-lon1) * (Math.PI/180);

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	        Math.cos(φ1) * Math.cos(φ2) *
	        Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return R * c;
}


module.exports = BoundingBox;