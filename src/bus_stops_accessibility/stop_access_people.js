function replacer(key,value)
{
    if (key=="intersect_poly") return undefined;
    else if (key=="access_poly") return undefined;
    else if (key=="no_access_poly") return undefined;
    else return value;
}

var stop_access_people_2016 = L.map('stop_access_people_2016').setView([13.13, 77.63], 12)
var intersection_polygons_2016;
var non_intersection_polygons_2016;

// Add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
    minZoom: 9,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetmap</a> contributors. <a href="https://www.openstreetmap.org/fixthemap">Edit the map</a>',
    opacity: 0.5,
    maxBoundsViscosity: 0.9
}).addTo(stop_access_people_2016);

$.getJSON('./data/ac-152-accessibility-gaps-2016.geojson', function(geojson) {
    L.choropleth(geojson, {
        valueProperty: 'access_percentage',
        scale: ['red', 'green'],
        steps: 4,
        mode: 'k',
        style: {
          color: '#fff',
          weight: 2,
          fillOpacity: 0.66
        },
        onEachFeature : function(feature, layer) {
            // Bind label with polygon option variable
            layer.bindPopup('Properties: <br><pre>' + JSON.stringify(feature.properties, replacer, 4), {
                maxWidth: 1600,
                minWidth: 800
            });

            // Mouseover handler
            layer.on('mouseover', function() {
                non_intersection_polygons_2016 = L.polygon(feature.properties.no_access_poly.coordinates, {color: 'red', interactive: false}).addTo(stop_access_people_2016);
                intersection_polygons_2016 = L.polygon(feature.properties.access_poly.coordinates, {color: 'blue', interactive: false}).addTo(stop_access_people_2016);
            });

            // Mouseout handler
            layer.on('mouseout', function() {
                non_intersection_polygons_2016.remove();
                intersection_polygons_2016.remove();
            });
        }
    }).addTo(stop_access_people_2016)
});

$.getJSON('./data/bus-stops-2016.json', function(busStopsData) {
    // Add circle marker and bind tooltip with stop name for each entry of the bus stops data
    busStopsData.forEach(function (b) {
    var circle = L.circle([b.lat, b.lon], {
        bubblingMouseEvents: true,
        color: "black",
        dashArray: null,
        dashOffset: null,
        fill: true,
        fillColor: "#000000",
        radius: 1,
        stroke: true
    }).addTo(stop_access_people_2016);
    });
});

var stop_access_people_2018 = L.map('stop_access_people_2018').setView([13.13, 77.63], 12)
var intersection_polygons_2018;
var non_intersection_polygons_2018;

// Add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
    minZoom: 9,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetmap</a> contributors. <a href="https://www.openstreetmap.org/fixthemap">Edit the map</a>',
    opacity: 0.5,
    maxBoundsViscosity: 0.9
}).addTo(stop_access_people_2018);

$.getJSON('./data/ac-152-accessibility-gaps-2018.geojson', function(geojson) {
    L.choropleth(geojson, {
        valueProperty: 'access_percentage',
        scale: ['red', 'green'],
        steps: 4,
        mode: 'k',
        style: {
          color: '#fff',
          weight: 2,
          fillOpacity: 0.66
        },
        onEachFeature : function(feature, layer) {
            // Bind label with polygon option variable
            layer.bindPopup('Properties: <br><pre>' + JSON.stringify(feature.properties, replacer, 4), {
                maxWidth: 1600,
                minWidth: 800
            });

            // Mouseover handler
            layer.on('mouseover', function() {
                non_intersection_polygons_2018 = L.polygon(feature.properties.no_access_poly.coordinates, {color: 'red', interactive: false}).addTo(stop_access_people_2018);
                intersection_polygons_2018 = L.polygon(feature.properties.access_poly.coordinates, {color: 'blue', interactive: false}).addTo(stop_access_people_2018);
            });

            // Mouseout handler
            layer.on('mouseout', function() {
                non_intersection_polygons_2018.remove();
                intersection_polygons_2018.remove();
            });
        }
    }).addTo(stop_access_people_2018)
});

$.getJSON('./data/bus-stops-2018.json', function(busStopsData) {
    // Add circle marker and bind tooltip with stop name for each entry of the bus stops data
    busStopsData.forEach(function (b) {
    var circle = L.circle([b.lat, b.lon], {
        bubblingMouseEvents: true,
        color: "black",
        dashArray: null,
        dashOffset: null,
        fill: true,
        fillColor: "#000000",
        radius: 1,
        stroke: true
    }).addTo(stop_access_people_2018);
    });
});
