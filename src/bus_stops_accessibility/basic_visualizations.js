var map_people = L.map('map_people').setView([13.13, 77.63], 12)

// Add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
    minZoom: 9,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. <a href="https://www.openstreetmap.org/fixthemap">Edit the Map</a>',
    opacity: 0.5,
    maxBoundsViscosity: 0.9
}).addTo(map_people);

// Add GeoJSON
$.getJSON('./data/ac-152.geojson', function (geojson) {
  L.choropleth(geojson, {
    valueProperty: 'PEOPLE',
    scale: ['white', 'green'],
    steps: 100,
    mode: 'k',
    style: {
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8
    },
    onEachFeature: function (feature, layer) {
        layer.bindTooltip('Polling Station: ' + feature.properties.PS_Name + '<br><b>' +
            feature.properties.PEOPLE.toLocaleString() + ' people</b>')
    }
  }).addTo(map_people)
})

var map_stops = L.map('map_stops').setView([13.13, 77.63], 12)

// Add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
    minZoom: 9,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. <a href="https://www.openstreetmap.org/fixthemap">Edit the Map</a>',
    opacity: 0.5,
    maxBoundsViscosity: 0.9
}).addTo(map_stops);

// Add GeoJSON
$.getJSON('./data/ac-152.geojson', function (geojson) {
  L.choropleth(geojson, {
    valueProperty: 'NUMBER_OF_STOPS',
    scale: ['white', 'blue'],
    steps: 100,
    mode: 'q',
    style: {
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8
    },
    onEachFeature: function (feature, layer) {
        layer.bindTooltip('Polling Station: ' + feature.properties.PS_Name + '<br><b>' +
            feature.properties.NUMBER_OF_STOPS.toLocaleString() + ' stops</b>')
    }
  }).addTo(map_stops)
})

var map_people_per_stop = L.map('map_people_per_stop').setView([13.13, 77.63], 12)

// Add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
    minZoom: 9,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. <a href="https://www.openstreetmap.org/fixthemap">Edit the Map</a>',
    opacity: 0.5,
    maxBoundsViscosity: 0.9
}).addTo(map_people_per_stop);

// Add GeoJSON
$.getJSON('./data/ac-152.geojson', function (geojson) {
  L.choropleth(geojson, {
    valueProperty: 'PEOPLEPERSTOP',
    scale: ['green', 'red'],
    steps: 100,
    mode: 'k',
    style: {
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8
    },
    onEachFeature: function (feature, layer) {
        layer.bindTooltip('Polling Station: ' + feature.properties.PS_Name + '<br><b>' +
            feature.properties.PEOPLEPERSTOP.toLocaleString() + ' people per stop</b>')
    }
  }).addTo(map_people_per_stop)
})

var map_seniors_per_stop = L.map('map_seniors_per_stop').setView([13.13, 77.63], 12)

// Add basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
    minZoom: 9,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. <a href="https://www.openstreetmap.org/fixthemap">Edit the Map</a>',
    opacity: 0.5,
    maxBoundsViscosity: 0.9
}).addTo(map_seniors_per_stop);

// Add GeoJSON
$.getJSON('./data/ac-152.geojson', function (geojson) {
  L.choropleth(geojson, {
    valueProperty: 'SENIORPEOPLEPERSTOP',
    scale: ['green', 'red'],
    steps: 100,
    mode: 'k',
    style: {
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8
    },
    onEachFeature: function (feature, layer) {
        layer.bindTooltip('Polling Station: ' + feature.properties.PS_Name + '<br><b>' +
            feature.properties.SENIORPEOPLEPERSTOP.toLocaleString() + ' senior citizens per stop</b>')
    }
  }).addTo(map_seniors_per_stop)
})
