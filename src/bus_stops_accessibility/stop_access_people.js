import { BASE_URL, pageLoader, perc2color } from "../utils";

let intersection_polygons_2018,
  non_intersection_polygons_2018,
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
    this.choroplethLayer = null;
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
            radius: 1,
            stroke: true,
          }).addTo(this.mapInstance);
          stop.bindTooltip(
            `<div>
              ${b.stop_name}
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

    this.data.destinations.forEach((b) => {
      const office = L.circle([b.lat, b.lon], {
        bubblingMouseEvents: true,
        color: "white",
        weight: 1.5,
        fill: true,
        fillOpacity: 0.8,
        // in below, 7 is max number of stops for an office in the dataset, currently hardcoded. TODO: Dynamically calculate percentage
        fillColor: perc2color(b.stops.length * (100 / 7)),
        radius: 40 + Math.sqrt(b.employees),
        stroke: true,
      }).addTo(this.mapInstance);
      office.bindTooltip(
        `<div>
          ${b.employees}
        </div>`,
        { sticky: true }
      );
      offices.push(office);
    });

    if (this.choroplethLayer) {
      this.mapInstance.removeLayer(this.choroplethLayer);
    }
    this.choroplethLayer = L.choropleth(accessibilityData, {
      valueProperty: "access_percentage",
      scale: ["red", "green"],
      steps: 4,
      mode: "k",
      style: {
        color: "#fff",
        weight: 0.5,
        fillOpacity: 0.5,
      },
      onEachFeature: (feature, layer) => {
        const { stops = [] } = feature.properties;
        const people = parseInt(
          (feature.properties.access_percentage * feature.properties.people) /
            100
        );
        const seniors = parseInt(
          (feature.properties.access_percentage * feature.properties.seniors) /
            100
        );
        const women = parseInt(
          (feature.properties.access_percentage * feature.properties.women) /
            100
        );
        const pieChart = `<b>${stops.length} stops</b> providing access to <b>${feature.properties.access_percentage}%</b> of the:<br>
          <b>${people}</b> people<br>
          <b>${seniors}</b> senior citizens.<br>
          <b>${women}</b> women.<br>
          <div class='canvas-div'>
            <canvas id="canvas"></canvas>
          </div>
        `;

        layer.bindPopup(pieChart).on("popupopen", () => {
          popupLayer = layer;
          const labels = ["Access", "No Access"];
          const data = [
            feature.properties.access_percentage,
            feature.properties.no_access_percentage,
          ];
          const colors = ["rgba(0, 255, 0, 0.8)", "rgba(255, 0, 0, 0.8)"];

          new Chart(canvas.getContext("2d"), {
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
          });

          const canvasElement =
            document.getElementsByClassName("canvas-div")[0];
          canvasElement.style.height = "200px";
          canvasElement.style.width = "200px";

          const element = document.getElementsByClassName(
            "leaflet-popup-content"
          )[0];
          element.style.height = "200px";
          element.style.width = "200px";
        });

        layer.on("mouseover", () => {
          non_intersection_polygons_2018 = L.polygon(
            feature.properties.no_access_poly.coordinates,
            { color: "red", interactive: false }
          ).addTo(this.mapInstance);
          intersection_polygons_2018 = L.polygon(
            feature.properties.access_poly.coordinates,
            { color: "blue", interactive: false }
          ).addTo(this.mapInstance);
          if (popupLayer !== undefined) {
            popupLayer.closePopup();
          }
        });

        layer.on("mouseout", function () {
          if (non_intersection_polygons_2018) {
            non_intersection_polygons_2018.remove();
          }
          if (intersection_polygons_2018) {
            intersection_polygons_2018.remove();
          }
        });
      },
    }).addTo(this.mapInstance);
  };
}

const leafletInstance = new LeafletMap("map", [12.965, 77.6]);

const officeIcon = L.icon({
  iconUrl: `${BASE_URL}office.png`,
  iconSize:     [10, 10], // size of the icon
});

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
  "ac161",
  "ac163",
  "ac165",
  "ac174",
];
const selectInput = document.getElementById("assemblyConstituency-dropdown");
selectInput.innerHTML = assemblyConstituenciesAvailable
  .map((b) => `<option value="${b}">${b.toUpperCase()}</option>`)
  .join("");
selectInput.addEventListener("change", (e) => {
  updateAssemblyConstituency(e.target.value);
});
updateAssemblyConstituency(assemblyConstituenciesAvailable[0]);
