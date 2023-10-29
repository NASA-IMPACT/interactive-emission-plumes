const mapboxgl = require("mapbox-gl");

const { createColorbar, displayPropertiesWithD3, dragElement } = require("./helper");
const VMIN = 0;
const VMAX = 1500;
const IDS_ON_MAP = new Set();
const RASTER_IDS_ON_MAP = new Set();
const MAP_STYLE = process.env.MAP_STYLE;
const MAP_ACCESS_TOKEN = process.env.MAP_ACCESS_TOKEN;
import "./style.css";
mapboxgl.accessToken = MAP_ACCESS_TOKEN;
const icon_clicker = new Array(2)

const marker_props = new Object()

var counter_clicks_icon = 0
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
    $("#display_props").css({"visibility": "hidden"});

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
      '<span class="mapboxgl-ctrl-icon btn fa fa-refresh" aria-hidden="true" title="Reset To USA"></span>' +
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
    RASTER_IDS_ON_MAP.forEach((element) => {




      try {
        let layerID = "raster-layer-" + element.id;
        let layer_date = new Date(element.properties["UTC Time Observed"]);
        var start_date = new Date($("#slider-range").slider("values", 0) * 1000)
        var stop_date = new Date($("#slider-range").slider("values", 1) * 1000)
        let bool_display = toggled % 2 != 0 && layer_date >= start_date && layer_date <= stop_date;
        map.setLayoutProperty(
          layerID,
          "visibility",
          bool_display
            ? "visible"
            : "none"
        );
        $("#display_props").css({"visibility": bool_display? "visible" : "hidden"});

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
      '<span id="layer-eye" class="mapboxgl-ctrl-icon btn fa fa-eye" aria-hidden="true" title="Show/Hide layers"></span>' +
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
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.ScaleControl());
map.addControl(new LayerButtonControl());

function addRaster(item_ids, feature, polygon_id) {
  var props = feature.properties;
  var collection = "emit-ch4plume-v1";
  var assets = "ch4-plume-emissions";

  if (!IDS_ON_MAP.has(feature.id)) {
    var subset = item_ids.filter((item) =>
      props["Data Download"].includes(item.id)
    );

    subset.forEach(function (item) {
      


        var TILE_URL =
          "https://ghg.center/api/raster/stac/tiles/WebMercatorQuad/{z}/{x}/{y}@1x" +
          "?collection=" +
          collection +
          "&item=" +
          item.id +
          "&assets=" +
          assets +
          "&bidx=1&colormap_name=plasma&rescale=" +
          VMIN +
          "%2C" +
          VMAX +
          "&nodata=-9999";


        // const bbox = turf.bbox(item.geometry);

        map.addSource("raster-source-" + feature.id, {
          type: "raster",
          tiles: [TILE_URL],
          tileSize: 256,
          bounds: item.bbox,
        });

        map.addLayer({
          id: "raster-layer-" + feature.id,
          type: "raster",
          source: "raster-source-" + feature.id,
          paint: {},
        });
        
        map.moveLayer(polygon_id);
        RASTER_IDS_ON_MAP.add(feature);
      }
    );

    

    IDS_ON_MAP.add(feature.id);
  }


    map.flyTo({
      center: [
        props["Longitude of max concentration"],
        props["Latitude of max concentration"],
      ], // Zoom to the marker's coordinates
      zoom: 14, // Set the zoom level when the marker is clicked
      // essential: true, // This ensures a smooth animation
    });

    displayPropertiesWithD3(props);
    dragElement(document.getElementById("display_props"))

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
    var polygons = features
      .filter((f) => f.geometry.type === "Polygon")
      .map((f, i) => ({ id: i, feature: f }));
    const points = features
      .filter((f) => f.geometry.type === "Point")
      .map((f, i) => ({ id: i, feature: f }))
      .sort((prev, next) => {
        const prev_date = new Date(prev.feature.properties["UTC Time Observed"]).getTime();
        const next_date = new Date(next.feature.properties["UTC Time Observed"]).getTime();
        return prev_date - next_date
        
      });
    // Filter and set IDs for points
    const centers = features
      .filter((f) => f.geometry.type === "Point")
      .map((f, i) => {
        f.id = i;
        return f;
      });

    const item_ids = methane_stac_metadata.features.map((feature) => feature);

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



      points.forEach(function (point) {
        let coords = point.feature.geometry.coordinates
        const markerEl = document.createElement("div");
        markerEl.className = "marker";
        const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([coords[0], coords[1]])
        .addTo(map);


        let local_props = point.feature.properties
        

        const tooltipContent = `
        <strong> Max Methane Enh: <span style="color: red">${local_props["Max Plume Concentration (ppm m)"]} (ppm m)</span></strong><br>
        Latitude (max conc): ${coords[1].toFixed(3)}<br>
        Longitude (max conc): ${coords[0].toFixed(3)}<br>
        Time Observed: ${local_props["UTC Time Observed"]}
        `;


        const popup = new mapboxgl.Popup().setHTML(tooltipContent);
        marker.setPopup(popup);

        marker.getElement().addEventListener("mouseenter", () => {
          popup.addTo(map);
        });
  
        marker.getElement().addEventListener("mouseleave", () => {
          popup.remove();
        });

        marker_props["point-layer-" + point.id] = marker

        


        marker.getElement().addEventListener("click", (e) => {
          
          counter_clicks_icon += 1

          if (counter_clicks_icon % 2 == 0) {
            icon_clicker[0] = e.target
            icon_clicker[0].style.visibility = "hidden"
            if (icon_clicker[1]) {
              icon_clicker[1].style.visibility = "visible"
            }

          }
          else {
            icon_clicker[1] = e.target
            icon_clicker[1].style.visibility = "hidden"
            if (icon_clicker[0]) {
              icon_clicker[0].style.visibility = "visible"
            }
          }

          addRaster(
            item_ids,
            point.feature,
            "polygon-layer-" + point.id
          );
          
        });
        
      })

    $(function () {
      //

      var first_point = points[0].feature.properties["UTC Time Observed"];
      var last_point = points[points.length - 1].feature.properties["UTC Time Observed"];

      var min_start_date = new Date(first_point)
      min_start_date.setUTCHours(0,0,0,0)
      var max_stop_date = new Date(last_point)
      max_stop_date.setUTCHours(23,59,59,0)

      $("#slider-range").slider({
        range: true,
        min: min_start_date.getTime() / 1000,
        max: max_stop_date.getTime() / 1000,
        step: 86400,
        values: [
          min_start_date.getTime() / 1000,
          max_stop_date.getTime() / 1000,
        ],
        slide: function (event, ui) {
          
          let start_date = new Date(ui.values[0] * 1000);
          let stop_date = new Date(ui.values[1] * 1000);
          start_date.setUTCHours(0,0,0,0)
          stop_date.setUTCHours(23,59,59,0)


          for (const point of points) {
            let polygone_visiblity = 'visible'
            let layerID = "point-layer-" + point.id;
            let polygonID = "polygon-layer-" + point.id
            let point_date = new Date(
              point.feature.properties["UTC Time Observed"]
            );
              
            if (point_date >= start_date && point_date <= stop_date) {
              marker_props[layerID].addTo(map)
              

            }
            else {
              marker_props[layerID].remove()
              polygone_visiblity = 'none'
              
            }
            map.setLayoutProperty(
              polygonID,
              "visibility",
              polygone_visiblity
            );
            
            
          }


          for (const feature of RASTER_IDS_ON_MAP) {
            let layerID = "raster-layer-" + feature.id;
            let point_date = new Date(feature.properties["UTC Time Observed"]);
            let bool_display = toggled % 2 != 0 && point_date >= start_date && point_date <= stop_date;
            map.setLayoutProperty(
              layerID,
              "visibility",
              bool_display
                ? "visible"
                : "none"
            );
            $("#display_props").css({"visibility": bool_display? "visible" : "hidden"});

            
          }

          $("#amount").val(
            start_date.toUTCString().slice(0, -13) + " - " + stop_date.toUTCString().slice(0, -13)
          );
        },
      });
      var start_date = new Date($("#slider-range").slider("values", 0) * 1000);
      var stop_date = new Date($("#slider-range").slider("values", 1) * 1000);
      $("#amount").val(
        start_date.toUTCString().slice(0, -13) + " - " + stop_date.toUTCString().slice(0, -13)
      );
    });
  });
}

main();
