const mapboxgl = require("mapbox-gl");
const turf = require("@turf/turf");
const { createColorbar, displayPropertiesWithD3 } = require("./helper");
import mapMarkerIcon from "./marker-sdf.png";
const VMIN = 0;
const VMAX = 1500;
const IDS_ON_MAP = new Set();
const RASTER_IDS_ON_MAP = new Set();
const MAP_STYLE = process.env.MAP_STYLE;
const MAP_ACCESS_TOKEN = process.env.MAP_ACCESS_TOKEN;
import "./style.css";
mapboxgl.accessToken = MAP_ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: MAP_STYLE, // You can choose any Mapbox style
  center: [-98, 39], // Initial center coordinates
  zoom: 4, // Initial zoom level
});

class HomeButtonControl {
  onClick() {
    // Set the map's center and zoom to the desired location
    map.flyTo({
      center: [-98, 39], // Replace with the desired latitude and longitude
      zoom: 4,
    });
  }
  onAdd(map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
    this.container.addEventListener("contextmenu", (e) => e.preventDefault());
    this.container.addEventListener("click", (e) => this.onClick());
    this.container.innerHTML =
      '<div class="tools-box">' +
      "<button>" +
      '<span class="mapboxgl-ctrl-icon btn fa fa-home" aria-hidden="true" title="Reset To USA"></span>' +
      "</button>" +
      "</div>";
    return this.container;
  }
  onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}
let toggled = 1;

class LayerButtonControl {
  onClick() {
    $("#layer-eye").toggleClass("fa-eye fa-eye-slash");
    toggled += 1;

    // Set the map's center and zoom to the desired location
    IDS_ON_MAP.forEach((element) => {
      let layerID = "raster-layer-" + element;

      try {
        map.setLayoutProperty(
          layerID,
          "visibility",
          toggled % 2 == 0 ? "none" : "visible"
        );
      } catch (error) {
        console.log(error);
      }
    });
  }
  onAdd(map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
    this.container.addEventListener("contextmenu", (e) => e.preventDefault());
    this.container.addEventListener("click", (e) => this.onClick());
    this.container.innerHTML =
      '<div class="tools-box">' +
      "<button>" +
      '<span id="layer-eye" class="mapboxgl-ctrl-icon btn fa fa-eye" aria-hidden="true" title="Description"></span>' +
      "</button>" +
      "</div>";
    return this.container;
  }
  onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}

map.addControl(new HomeButtonControl());
map.addControl(new mapboxgl.ScaleControl());
map.addControl(new LayerButtonControl());

function addRaster(item_ids, outlines, feature, polygon_id) {
  var props = feature.properties;
  var collection = "emit-ch4plume-v1-lpdaac";
  var assets = "ch4-plume-emissions";

  if (!IDS_ON_MAP.has(feature.id)) {
    var outlineShape = turf.polygon(outlines[feature.id].geometry.coordinates);
    var subset = item_ids.filter((item) =>
      props["Data Download"].includes(item.id)
    );

    subset.forEach(function (item) {
      var itemShape = turf.polygon(item.geometry.coordinates);
      if (turf.booleanIntersects(itemShape, outlineShape)) {
        var TILE_URL =
          "https://ghg.center/api/raster/stac/tiles/WebMercatorQuad/{z}/{x}/{y}@1x" +
          "?collection=" +
          collection +
          "&item=" +
          item.id +
          "&assets=" +
          assets +
          "&resampling=bilinear&bidx=1&colormap_name=plasma&rescale=" +
          VMIN +
          "%2C" +
          VMAX +
          "&nodata=-9999";

        const bbox = turf.bbox(item.geometry);

        map.addSource("raster-source-" + feature.id, {
          type: "raster",
          tiles: [TILE_URL],
          tileSize: 256,
          bounds: bbox,
        });

        map.addLayer({
          id: "raster-layer-" + feature.id,
          type: "raster",
          source: "raster-source-" + feature.id,
          paint: {},
        });
        
        console.log(polygon_id);
        map.moveLayer(polygon_id);
        RASTER_IDS_ON_MAP.add(feature);
      }
    });

    IDS_ON_MAP.add(feature.id);
  }

  if (map.getZoom() < 12) {
    map.flyTo({
      center: [
        props["Longitude of max concentration"],
        props["Latitude of max concentration"],
      ], // Zoom to the marker's coordinates
      zoom: 14, // Set the zoom level when the marker is clicked
      essential: true, // This ensures a smooth animation
    });

    displayPropertiesWithD3(props);
  }
}

async function main() {
  const methan_metadata = await (
    await fetch("./data/combined_plume_metadata.json")
  ).json();
  const methane_stac_metadata = await (
    await fetch("./data/methane_stac.geojson")
  ).json();

  map.on("load", () => {
    // When the geolocate control is clicked, set the map's center and zoom

    createColorbar(VMIN, VMAX);

    var features = methan_metadata.features;
    // Filter and set IDs for polygons
    const outlines = features
      .filter((f) => f.geometry.type === "Polygon")
      .map((f, i) => {
        f.id = i;
        return f;
      });
    var polygons = features
      .filter((f) => f.geometry.type === "Polygon")
      .map((f, i) => ({ id: i, feature: f }));
    var points = features
      .filter((f) => f.geometry.type === "Point")
      .map((f, i) => ({ id: i, feature: f }));

    // Filter and set IDs for points
    const centers = features
      .filter((f) => f.geometry.type === "Point")
      .map((f, i) => {
        f.id = i;
        return f;
      });

    const item_ids = methane_stac_metadata.features.map((feature) => feature);
    // polygons.forEach(function (polygon) {
    //   polygon.feature.properties.id = polygon.id;
    //   polygon.feature.properties.SceneFID =
    //     polygon.feature.properties["Scene FID"];
    //   map.on("click", "polygon-layer-" + polygon.id, function (e) {
    //     addRaster(
    //       item_ids,
    //       outlines,
    //       polygons[e.features[0].properties.id].feature,
    //       "polygon-layer-" + polygon.id
    //     );
    //   });
    // });
    points.forEach(function (point) {
      point.feature.properties.id = point.id;
      point.feature.properties.SceneFID = point.feature.properties["Scene FID"];
      map.on("click", "point-layer-" + point.id, function (e) {
        addRaster(
          item_ids,
          outlines,
          points[e.features[0].properties.id].feature,
          "polygon-layer-" + point.id
        );
      });
    });
    // Add your polygons and points as layers to the map
    polygons.forEach(function (polygon) {
      map.addSource("polygon-source-" + polygon.id, {
        type: "geojson",
        data: polygon.feature,
      });

      map.addLayer({
        id: "polygon-layer-" + polygon.id,
        type: "line",
        source: "polygon-source-" + polygon.id,

        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#ff0000",
          "line-width": 3,
        },
      });
    });

    map.loadImage(mapMarkerIcon, function (error, image) {
      if (error) throw error;

      // Add the SDF-enabled marker icon to the map's image assets
      map.addImage("sdf-marker", image, { sdf: true });

      points.forEach(function (point) {
        map.addSource("point-source-" + point.id, {
          type: "geojson",
          data: point.feature,
        });

        map.addLayer({
          id: "point-layer-" + point.id,
          type: "symbol",
          source: "point-source-" + point.id,
          layout: {
            "icon-image": "sdf-marker", // Use the SDF-enabled marker icon
            "icon-size": 0.2, // Adjust the icon size as needed
            "icon-allow-overlap": true, // Allow overlapping markers
          },
          paint: {
            "icon-color": "#A84B65",
          },
        });
      });
    });

    $(function () {
      //
      var point_1 = points[0].feature.properties["UTC Time Observed"];
      var point_2 =
        points[points.length - 1].feature.properties["UTC Time Observed"];

      $("#slider-range").slider({
        range: true,
        min: new Date(point_1).getTime() / 1000,
        max: new Date(point_2).getTime() / 1000,
        step: 86400,
        values: [
          new Date(point_1).getTime() / 1000,
          new Date(point_2).getTime() / 1000,
        ],
        slide: function (event, ui) {
          let start_date = new Date(ui.values[0] * 1000);
          let stop_date = new Date(ui.values[1] * 1000);
          for (const point of points) {
            let layerID = "point-layer-" + point.id;
            let point_date = new Date(
              point.feature.properties["UTC Time Observed"]
            );
            map.setLayoutProperty(
              layerID,
              "visibility",
              point_date >= start_date && point_date <= stop_date
                ? "visible"
                : "none"
            );
          }

          for (const feature of RASTER_IDS_ON_MAP) {
            let layerID = "raster-layer-" + feature.id;
            let point_date = new Date(feature.properties["UTC Time Observed"]);
            map.setLayoutProperty(
              layerID,
              "visibility",
              point_date >= start_date && point_date <= stop_date
                ? "visible"
                : "none"
            );
          }

          // Set the map's center and zoom to the desired location

          $("#amount").val(
            start_date.toDateString() + " - " + stop_date.toDateString()
          );
        },
      });
      var start_date = new Date($("#slider-range").slider("values", 0) * 1000);
      var stop_date = new Date($("#slider-range").slider("values", 1) * 1000);
      $("#amount").val(
        start_date.toDateString() + " - " + stop_date.toDateString()
      );
    });
  });
}

main();
