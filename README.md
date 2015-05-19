
# Voronoi Geolocation

## About
[Voronoi](http://en.wikipedia.org/wiki/Voronoi_diagram) geolocation allows you geolocate a lat-long to the nearest city.
to generate the file (which are "compressed" raw images) just run :

## Install
```
npm install && npm start
```

## Method Breakdown
Here is a breakdown of the file creation:
- get points that corresponds to the cities (here city hall)
- generate voronoi diagram with these points
- draw cell from voronoi in [canvas](https://github.com/Automattic/node-canva) using [transverse mercator](http://en.wikipedia.org/wiki/Transverse_Mercator_projection) projection
- fill cell with city's id's color (e.g. a city with id 0 will be black)
- export the canvas to png then to raw data then to a custom format for weight issue

Here is how the city is retrieved:
- get lat-long
- retrieve the matching file
- recreate the projection to get a pixel position from lat-long
- read the number at pixel position which is the id of a city

## Testing the lib

```javascript
var geos    = require('../resources/geo.json').items;
var Locator = require('./locator');
var l = new Locator(__dirname+'/build');
var geoById = {};
geos.forEach(function(geo) { geoById[geo.id] = geo; })
var g = geos[Math.floor(geos.length*Math.random())];
console.log(g)
var id = l.find(g.longitude, g.latitude);
console.log(geoById[''+id]);
```

## Notes
Due the compression system a map can only contain the value max of UINT16 (65535)


## Authors
[Zebestof](http://www.zebestof.com/fr/accueil/)

## Documentation
Not yet.

## Dependencies
- [node-canvas](https://github.com/Automattic/node-canvas)
- [pngjs](https://github.com/niegowski/node-pngjs)
- [d3](https://github.com/mbostock/d3)

## License

The MIT License (MIT)

Copyright (c) 2015 Zebestof

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
