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
      opacity: 0.5,
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

    L.choropleth(accessibilityData, {
      valueProperty: "access_percentage",
      scale: ["red", "green"],
      steps: 4,
      mode: "k",
      style: {
        color: "#fff",
        weight: 2,
        fillOpacity: 0.66,
      },
      onEachFeature: (feature, layer) => {
        const pieChart = `<h3>${feature.properties.PS_Name}</h3>
          <div class='canvas-div'>
            <canvas id="canvas"></canvas>
          </div>
        `;

        layer.bindPopup(pieChart).on("popupopen", () => {
          popupLayer = layer;
          const { stops = [] } = feature.properties;
          const labels = [...stops.map((stop) => stop.stop), "No Stop"];
          const data = [
            ...stops.map((stop) => stop.percent_of_area),
            feature.properties.no_access_percentage,
          ];
          const colors = [
            ...stops.map((stop) => perc2color(stop.percent_of_area)),
            "rgba(255, 0, 0, 0.8)",
          ];

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
            options: {
              maintainAspectRatio: false,
              reponsive: true,
            },
          });

          const canvasElement =
            document.getElementsByClassName("canvas-div")[0];
          canvasElement.style.height = `${300 + 25 * (stops.length - 5)}px`;
          canvasElement.style.width = `${300 + 25 * (stops.length - 5)}px`;

          const element = document.getElementsByClassName(
            "leaflet-popup-content"
          )[0];
          element.style.height = `${300 + 25 * (stops.length - 5)}px`;
          element.style.width = `${300 + 25 * (stops.length - 5)}px`;
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
leafletInstance.updateData([
  `${BASE_URL}bus-stops-2018.json`,
  `${BASE_URL}stop-accessbility-2018.geojson`,
]);
