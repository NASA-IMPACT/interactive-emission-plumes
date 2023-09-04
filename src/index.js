
const mapboxgl = require('mapbox-gl')
const turf = require('@turf/turf')
const {createColorbar, displayPropertiesWithD3} = require('./helper')

const VMIN = 0;
const VMAX = 1500;
const IDS_ON_MAP = new Set();
const MAP_STYLE = process.env.MAP_STYLE;
const MAP_ACCESS_TOKEN = process.env.MAP_ACCESS_TOKEN
import './style.css'
mapboxgl.accessToken = MAP_ACCESS_TOKEN

const map = new mapboxgl.Map({
    container: 'map',
    style: MAP_STYLE, // You can choose any Mapbox style
    center: [-98, 39],// Initial center coordinates
    zoom: 4, // Initial zoom level
  });




function addRaster(item_ids,outlines, feature) {


    var props = feature.properties;
    var collection = 'nasa-jpl-plumes-emissions-updated';
    var assets = 'ch4-plume-emissions';


    if (!IDS_ON_MAP.has(feature.id)) {
      var outlineShape = turf.polygon(outlines[feature.id].geometry.coordinates);
      var subset = item_ids.filter((item) => item.id.startsWith(props['Scene FID']));

      subset.forEach(function (item) {
        var itemShape = turf.polygon(item.geometry.coordinates);
        if (turf.booleanIntersects(itemShape, outlineShape)) {
          var TILE_URL =
            'https://dev.ghg.center/api/raster/stac/tiles/WebMercatorQuad/{z}/{x}/{y}@1x' +
            '?collection=' +
            collection +
            '&item=' +
            item.id +
            '&assets=' +
            assets +
            '&resampling=bilinear&bidx=1&colormap_name=plasma&rescale=' +
            VMIN +
            '%2C' +
            VMAX +
            '&nodata=-9999';

          const bbox = turf.bbox(item.geometry);



        
          map.addSource('raster-source-' + feature.id, {
            type: 'raster',
            tiles: [TILE_URL],
            tileSize: 256,
            bounds: bbox,
          });

          map.addLayer({
            id: 'raster-layer-' + feature.id,
            type: 'raster',
            source: 'raster-source-' + feature.id,
            paint: {},
          });
        }
      });

      IDS_ON_MAP.add(feature.id);
    }

    if (IDS_ON_MAP.size === 1) {
      createColorbar(VMIN, VMAX);
    }


    if (map.getZoom() < 12) {

    map.flyTo({
        center: [props['Longitude of max concentration'], props['Latitude of max concentration']], // Zoom to the marker's coordinates
        zoom: 12, // Set the zoom level when the marker is clicked
        essential: true // This ensures a smooth animation
    });

    displayPropertiesWithD3(props)

    }

    



    
  }

async function main () {
    const methan_metadata = await (await fetch("./data/methane_metadata.json")).json()
    const  methane_stac_metadata = await (await fetch("./data/methane_stac_metadata.json")).json()

    // while ( !map.loaded()) {
    //     console.log("not loaded")
    // }

    map.on('load', () => {


    var features = methan_metadata.features;
      // Filter and set IDs for polygons
    const outlines = features
      .filter((f) => f.geometry.type === "Polygon")
      .map((f, i) => {
          f.id = i;
          return f;
      });
    var polygons = features.filter((f) => f.geometry.type === 'Polygon').map((f, i) => ({ id: i, feature: f }));
    var points = features.filter((f) => f.geometry.type === 'Point').map((f, i) => ({ id: i, feature: f }));
      
      

    // Filter and set IDs for points
    const centers = features
      .filter((f) => f.geometry.type === "Point")
      .map((f, i) => {
          f.id = i;
          return f;
      });

    const item_ids = methane_stac_metadata.features.map((feature) => feature);

    polygons.forEach(function (polygon) {
        polygon.feature.properties.id = polygon.id;
        polygon.feature.properties.SceneFID = polygon.feature.properties['Scene FID'];
        map.on('click', 'polygon-layer-' + polygon.id, function (e) {
          addRaster(item_ids,outlines, polygons[e.features[0].properties.id].feature);
        });
      });
    points.forEach(function (point) {
        point.feature.properties.id = point.id;
        point.feature.properties.SceneFID = point.feature.properties['Scene FID'];
        map.on('click', 'point-layer-' + point.id, function (e) {   
        addRaster(item_ids, outlines, points[e.features[0].properties.id].feature);
        
        });
      });
       // Add your polygons and points as layers to the map
       polygons.forEach(function (polygon) {
        map.addSource('polygon-source-' + polygon.id, {
          type: 'geojson',
          data: polygon.feature,
        });
  
        map.addLayer({
          id: 'polygon-layer-' + polygon.id,
          type: 'fill',
          source: 'polygon-source-' + polygon.id,
          paint: {
            'fill-color': '#ff0000', // Change the fill color as desired
            'fill-opacity': 0.5, // Adjust opacity as desired
          },
        });
      });

    

    map.loadImage('./marker-sdf.png', function (error, image) {
        if (error) throw error;
    
        // Add the SDF-enabled marker icon to the map's image assets
        map.addImage('sdf-marker', image, { sdf: true });
    
        points.forEach(function (point) {
            map.addSource('point-source-' + point.id, {
                type: 'geojson',
                data: point.feature,
            });
    
            map.addLayer({
                id: 'point-layer-' + point.id,
                type: 'symbol', 
                source: 'point-source-' + point.id,
                layout: {
                    'icon-image': 'sdf-marker', // Use the SDF-enabled marker icon
                    'icon-size': 0.3, // Adjust the icon size as needed
                    'icon-allow-overlap': true, // Allow overlapping markers
                },
                paint: {
                    'icon-color': '#2370a2', // Set the marker color to blue (#0000FF)
                },
            });
        });
    });    



    })

}

main()