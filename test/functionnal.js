var Locator 		   = require('../lib/locator'),
	BoundingBox 	   = require('../lib/generator.js'),
	maxLngLatNorthWest = [0, 50],
	maxLngLatSouthEast = [10, 40],
	kmPerImage 		   = 2000,
	width 			   = 750,
	height 			   = 750,
	assert             = require('chai').assert,
	geos 			   = {
			items: [{
				id: 1,
				latitude: 42,
				longitude: 2,
			},{
				id: 2,
				latitude: 44,
				longitude: 4,
			},{
				id: 3,
				latitude: 46,
				longitude: 6,
			},{
				id: 4,
				latitude: 48,
				longitude: 8,
			}
		]
	},
	boundings,l;

describe('functionnal test', function() {
	before(function(done) {
		boundings = BoundingBox.Factory(maxLngLatNorthWest, maxLngLatSouthEast, kmPerImage);
		BoundingBox.GenerateDb(boundings, width, height, geos.items, __dirname + '/build', done);
	});

	it('should give the correct colors', function() {
		l = new Locator(__dirname+'/build');
		geos.items.forEach(function(geo) {
			assert.equal(l.find(geo.longitude, geo.latitude), geo.id);
		})
	});
});