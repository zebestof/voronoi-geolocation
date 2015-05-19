#!/usr/bin/env node
"use strict";

var path = require('path'),
	fs 	 = require('fs');

if (!process.env.FEED) {
	console.log('Please add "FEED=<path_to_file>"');
	return;
}

var geos      		   = require(path.join('..', process.env.FEED)),
	BoundingBox 	   = require('../lib/generator.js'),
	maxLngLatNorthWest = [-12.336640, 73.042122],
	maxLngLatSouthEast = [38.041500, 32.970699], // european area
	kmPerImage 		   = 750,
	width 			   = 750,
	height 			   = 750,
	buildDir 		   = __dirname+'/../build';



if (!fs.existsSync(buildDir)) {
	fs.mkdirSync(buildDir);
}

var boundings = BoundingBox.Factory(maxLngLatNorthWest, maxLngLatSouthEast, kmPerImage);
BoundingBox.GenerateDb(boundings, width, height, geos, buildDir);
