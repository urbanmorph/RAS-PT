import { BASE_URL, pageLoader, perc2color } from "../utils";

let intersection_polygons,
  non_intersection_polygons,
  stops = [],
  popupLayer;

class LeafletMap {
  constructor(domId, center) {
    this.mapInstance = null;
    this.data = {
      stops: [],
      accessibility: [],
      destinations: [],
    };
    this.chloroplethLayer = null;
    this.legend = null;
    this.initMap(domId, center);
    this.initEvents();
    this.addStops();
    this.clearStops();
    this.getWard();
  }

  initMap = (domId, center) => {
    this.mapInstance = L.map(domId).setView(center, 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 9,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetmap</a> contributors. <a href="https://www.openstreetmap.org/fixthemap">Edit the map</a>',
      opacity: 0.4,
      maxBoundsViscosity: 0.9,
    }).addTo(this.mapInstance);
  };

  initEvents = () => {
    this.mapInstance.on("zoomend", () => {
      if (this.mapInstance.getZoom() > 11) {
        this.addStops();
      } else {
        this.clearStops();
      }
    });
  };

  addStops = () => {
    this.data.stops.forEach((b) => {
      const stop = L.circle([b.lat, b.lon], {
        bubblingMouseEvents: true,
        color: "black",
        fill: true,
        fillColor: "#000000",
        radius: 15,
        stroke: true,
      }).addTo(this.mapInstance);
      stop.bindTooltip(
        `<div>
          ${b.name}
        </div>`,
        { sticky: true }
      );
      stops.push(stop);
    });
  }

  clearStops = () => {
    stops.forEach((l) => {
      this.mapInstance.removeLayer(l);
    });
  }

  getWard = (ward_id, ward_name,) => {
      if (ward_id === undefined) {
        return `<h5>Outside BBMP Limits</h5>`;
      } else {
        return `<h5>Part of Ward ${ward_id} (${ward_name})</h5>`;
      }
  }

  updateData = async (files) => {
    const [stopsData, accessibilityData, destinationsData] = await pageLoader(files);

    this.data.stops = stopsData;
    this.data.destinations = destinationsData;

    if (this.chloroplethLayer) {
      this.mapInstance.removeLayer(this.chloroplethLayer);
      this.mapInstance.removeControl(this.legend);
      this.clearStops();
    }

    this.chloroplethLayer = L.chloropleth(accessibilityData, {
      valueProperty: function (feature) {
        return Math.round(feature.properties.access_percentage);
      },
      scale: ["red", "green"],
      steps: 4,
      mode: "e",
      style: {
        color: "#fff",
        weight: 0.5,
        fillOpacity: 0.5,
      },
      onEachFeature: (feature, layer) => {
        const { stops = [], people, employees, access_percentage, routes, new_ward_id, new_ward_name} = feature.properties;
        const popupInfo = `${this.getWard(new_ward_id, new_ward_name)}<b>${stops.length} bus stops</b> for <b>${people + employees} people</b> in this booth.<br><b>${access_percentage}%</b> of this booth's area is within 500m of a bus stop.<br><b>${Math.floor(routes.length)} bus routes</b> pass through these ${stops.length} stops.<br>`

        layer.bindPopup(popupInfo).on("popupopen", () => {
          popupLayer = layer;
        });

        layer.on("mouseover", () => {
          non_intersection_polygons = L.polygon(
            feature.properties.no_access_poly.coordinates,
            { color: "red", interactive: false }
          ).addTo(this.mapInstance);
          intersection_polygons = L.polygon(
            feature.properties.stop_access_poly.coordinates,
            { color: "blue", interactive: false }
          ).addTo(this.mapInstance);
          if (popupLayer !== undefined) {
            popupLayer.closePopup();
          }
        });

        layer.on("mouseout", function () {
          if (non_intersection_polygons) {
            non_intersection_polygons.remove();
          }
          if (intersection_polygons) {
            intersection_polygons.remove();
          }
        });
      },
    }).addTo(this.mapInstance);

    if (this.mapInstance.getZoom() > 11) {
      this.addStops();
    }

    // Add legend (don't forget to add the CSS from index.html)
    var chloroplethData = this.chloroplethLayer
    this.legend = L.control({ position: 'bottomright' })
    this.legend.onAdd = function () {
      var div = L.DomUtil.create('div', 'info legend')
      var limits = chloroplethData.options.limits
      var colors = chloroplethData.options.colors
      var labels = []

      // Add min & max
      div.innerHTML = 'Percent of booth within 500m of a bus stop<p><div class="labels"><div class="min">' + limits[0] + '%</div> \
        <div class="max">' + limits[limits.length - 1] + '%</div></div>'

      limits.forEach(function (limit, index) {
        labels.push('<li style="background-color: ' + colors[index] + '"></li>')
      })

      div.innerHTML += '<ul>' + labels.join('') + '</ul>'
      return div
    }
    this.legend.addTo(this.mapInstance)
  };
}

const defaultAssemblyConstituency = "ac150";
const leafletInstance = new LeafletMap("map", [12.965, 77.6]);

const updateAssemblyConstituency = (assemblyConstituencyId) => {
  leafletInstance.updateData([
    `${BASE_URL}bus_stops/${assemblyConstituencyId}.json`,
    `${BASE_URL}stops_accessibility/${assemblyConstituencyId}.geojson`,
  ]);
};

const assemblyConstituenciesAvailable = [
  "Yelahanka (150)",
  "Krishnarajapuram (151)",
  "Byatarayanapura (152)",
  "Yeshwantpur (153)",
  "Rajarajeshwarinagar (154)",
  "Dasarahalli (155)",
  "Mahalakshmi Layout (156)",
  "Malleshwaram (157)",
  "Hebbal (158)",
  "Pulakeshinagar (159)",
  "Sarvagnanagar (160)",
  "C. V. Raman Nagar  (161)",
  "Shivajinagar (162)",
  "Shanti Nagar (163)",
  "Gandhi Nagar (164)",
  "Rajaji Nagar (165)",
  "Govindraj Nagar (166)",
  "Vijay Nagar (167)",
  "Chamrajpet (168)",
  "Chickpet (169)",
  "Basavanagudi (170)",
  "Padmanabhanagar (171)",
  "B.T.M. Layout (172)",
  "Jayanagar (173)",
  "Mahadevapura (174)",
  "Bommanahalli (175)",
  "Bangalore South (176)",
  "Anekal (177)"
];
const selectInput = document.getElementById("assemblyConstituency-dropdown");
selectInput.innerHTML = assemblyConstituenciesAvailable
  .map((b, count) => `<option value="ac${150 + count}">${b}</option>`)
  .join("");
selectInput.addEventListener("change", (e) => {
  updateAssemblyConstituency(e.target.value);
});
updateAssemblyConstituency(defaultAssemblyConstituency);
