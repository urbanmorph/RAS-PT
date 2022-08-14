import busStops2018 from "./data/bus-stops-2018.json?url";
import stopAccessibility2018 from "./data/stop-accessbility-2018.geojson?url";

function replacer(key, value) {
  if (key == "intersect_poly") return undefined;
  else if (key == "access_poly") return undefined;
  else if (key == "no_access_poly") return undefined;
  else return value;
}

function perc2color(perc) {
  var r,
    g,
    b = 0;
  g = 255;
  r = Math.round(2.55 * (100 - perc));
  var h = r * 0x10000 + g * 0x100 + b * 0x1;
  return "#" + ("000000" + h.toString(16)).slice(-6);
}

var map = L.map("map").setView(
  [12.965, 77.60],
  11
);
var intersection_polygons_2018;
var non_intersection_polygons_2018;
var chart;
var markers = [];
var popupLayer;
var busStops;

// Add basemap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  minZoom: 9,
  attribution:
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetmap</a> contributors. <a href="https://www.openstreetmap.org/fixthemap">Edit the map</a>',
  opacity: 0.5,
  maxBoundsViscosity: 0.9,
}).addTo(map);

$.getJSON(busStops2018, function (busStopsData) {
  // Add circle marker and bind tooltip with stop name for each entry of the bus stops data
  busStops = busStopsData;
});

map.on('zoomend', function() {
  if (map.getZoom() > 14) {
    busStops.forEach(function (b) {
      var circle = L.circle([b.lat, b.lon], {
        bubblingMouseEvents: true,
        color: "black",
        dashArray: null,
        dashOffset: null,
        fill: true,
        fillColor: "#000000",
        radius: 1,
        stroke: true,
      }).addTo(map);
      circle.bindTooltip(
        `<div>
                   ${b.stop_name}
               </div>`,
        { sticky: true }
      );
      markers.push(circle);
    });
  } else {
    markers.forEach(function(l) {
      map.removeLayer(l);
    })
  }
});

$.getJSON(stopAccessibility2018, function (geojson) {
  L.choropleth(geojson, {
    valueProperty: "access_percentage",
    scale: ["red", "green"],
    steps: 4,
    mode: "k",
    style: {
      color: "#fff",
      weight: 2,
      fillOpacity: 0.66,
    },
    onEachFeature: function (feature, layer) {
      var pieChart =
        "<h3>" + feature.properties.PS_Name + "</h3><div class='canvas-div'><canvas id=\"canvas\"></canvas></div>";

      layer.bindPopup(pieChart).on("popupopen", () => {
        popupLayer = layer;

        try {
          var stops = feature.properties.stops;
          var labels = stops.map((stop) => stop.stop);
          var data = stops.map((stop) => stop.percent_of_area);
          var colors = stops.map((stop) => perc2color(stop.percent_of_area));
        } catch {
          console.log("No stops for selected booth.");
          var labels = [];
          var data = [];
          var colors = [];
        }

        labels.push("No Stop");
        data.push(feature.properties.no_access_percentage);
        colors.push("rgba(255, 0, 0, 0.8)");

        var ctx = canvas.getContext("2d");
        var config = {
          type: "pie",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Stops",
                data: data,
                backgroundColor: colors,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            reponsive: true,
          },
        };

        chart = new Chart(ctx, config);

        var element = document.getElementsByClassName("canvas-div")[0];
        var height = "height:" + (300 + 25 * (stops.length - 5)) + "px;";
        element.setAttribute("style", height);
        var width = "width:" + (300 + 25 * (stops.length - 5)) + "px;";
        element.setAttribute("style", width);

        var element = document.getElementsByClassName(
          "leaflet-popup-content"
        )[0];
        var height = "height:" + (300 + 25 * (stops.length - 5)) + "px;";
        element.setAttribute("style", height);
        var width = "width:" + (300 + 25 * (stops.length - 5)) + "px;";
        element.setAttribute("style", width);
      });
      ////layer.bindTooltip('Properties: <br><pre>' + JSON.stringify(feature.properties, replacer, 4), {

      layer.on("mouseover", function () {
        non_intersection_polygons_2018 = L.polygon(
          feature.properties.no_access_poly.coordinates,
          { color: "red", interactive: false }
        ).addTo(map);
        intersection_polygons_2018 = L.polygon(
          feature.properties.access_poly.coordinates,
          { color: "blue", interactive: false }
        ).addTo(map);
      });

      layer.on("mouseout", function () {
        non_intersection_polygons_2018.remove();
        intersection_polygons_2018.remove();
        if (popupLayer !== undefined) {
          popupLayer.closePopup();
        }
      });
    },
  }).addTo(map);
});
