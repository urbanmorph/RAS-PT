import { BASE_URL, pageLoader, perc2color } from "../utils";

let intersection_polygons_2018,
  non_intersection_polygons_2018,
  markers = [],
  popupLayer;

class LeafletMap {
  constructor(domId, center) {
    this.mapInstance = null;
    this.data = {
      stops: [],
      accessibility: [],
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
          const circle = L.circle([b.lat, b.lon], {
            bubblingMouseEvents: true,
            color: "black",
            fill: true,
            fillColor: "#000000",
            radius: 1,
            stroke: true,
          }).addTo(this.mapInstance);
          circle.bindTooltip(
            `<div>
              ${b.stop_name}
            </div>`,
            { sticky: true }
          );
          markers.push(circle);
        });
      } else {
        markers.forEach((l) => {
          this.mapInstance.removeLayer(l);
        });
      }
    });
  };

  updateData = async (files) => {
    const [stopsData, accessibilityData] = await pageLoader(files);

    this.data.stops = stopsData;

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

const updateBooth = (boothId) => {
  leafletInstance.updateData([
    `${BASE_URL}bus_stops/${boothId}.json`,
    `${BASE_URL}stops_accessibility/${boothId}.geojson`,
  ]);
};

const boothsAvailable = [
  "ac151",
  "ac152",
  "ac153",
  "ac159",
  "ac161",
  "ac163",
  "ac165",
  "ac174",
];
const selectInput = document.getElementById("booth-dropdown");
selectInput.innerHTML = boothsAvailable
  .map((b) => `<option value="${b}">${b.toUpperCase()}</option>`)
  .join("");
selectInput.addEventListener("change", (e) => {
  updateBooth(e.target.value);
});
updateBooth(boothsAvailable[0]);
