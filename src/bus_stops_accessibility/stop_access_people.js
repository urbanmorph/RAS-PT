import { BASE_URL, pageLoader, perc2color } from "../utils";

let intersection_polygons,
  non_intersection_polygons,
  stops = [],
  offices = [],
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
    this.initMap(domId, center);
    this.initEvents();
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
      if (this.mapInstance.getZoom() > 14) {
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
      } else {
        stops.forEach((l) => {
          this.mapInstance.removeLayer(l);
        });
      }
    });
  };

  updateData = async (files) => {
    const [stopsData, accessibilityData, destinationsData] = await pageLoader(files);

    this.data.stops = stopsData;
    this.data.destinations = destinationsData;

    if (this.chloroplethLayer) {
      this.mapInstance.removeLayer(this.chloroplethLayer);
    }
    this.chloroplethLayer = L.chloropleth(accessibilityData, {
      valueProperty: "access_percentage",
      scale: ["red", "green"],
      steps: 4,
      mode: "e",
      style: {
        color: "#fff",
        weight: 0.5,
        fillOpacity: 0.5,
      },
      onEachFeature: (feature, layer) => {
        const { stops = [], people, employees, access_percentage, routes} = feature.properties;
        const popupInfo = `<b>${stops.length} bus stops</b> for <b>${people + employees} people</b> in this booth.<br><b>${access_percentage}%</b> of this booth's area is within 500m of a bus stop.<br><b>${Math.floor(routes.length)} bus routes</b> pass through these ${stops.length} stops.<br>`;

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
  };
}

const defaultAssemblyConstituency = "ac152";
const leafletInstance = new LeafletMap("map", [12.965, 77.6]);

const updateAssemblyConstituency = (assemblyConstituencyId) => {
  leafletInstance.updateData([
    `${BASE_URL}bus_stops/${assemblyConstituencyId}.json`,
    `${BASE_URL}stops_accessibility/${assemblyConstituencyId}.geojson`,
    `${BASE_URL}bangalore_offices_access.json`,
  ]);
};

const assemblyConstituenciesAvailable = [
  "none",
  "ac151",
  "ac152",
  "ac153",
  "ac159",
  "ac160",
  "ac161",
  "ac163",
  "ac165",
  "ac172",
  "ac174",
];
const selectInput = document.getElementById("assemblyConstituency-dropdown");
selectInput.innerHTML = assemblyConstituenciesAvailable
  .map((b) => `<option value="${b}">${b.toUpperCase()}</option>`)
  .join("");
selectInput.addEventListener("change", (e) => {
  updateAssemblyConstituency(e.target.value);
});
updateAssemblyConstituency(defaultAssemblyConstituency);
