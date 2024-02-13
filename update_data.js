// import fs
const fs = require("fs");

async function main() {
// fetch data from the stac endpoint
const methane_stac_data = await (
  await fetch("https://earth.jpl.nasa.gov/emit-mmgis-lb/Missions/EMIT/Layers/coverage/combined_plume_metadata.json")
  ).json();
// Write the data to a file
fs.writeFileSync(
  "./data/combined_plume_metadata.json",
  JSON.stringify(methane_stac_data, null, 2)
  );


 // fetch data from https://ghg.center/api/stac/collections/emit-ch4plume-v1/items?limit=1000
 const methane_stac_geojson= await (
 await fetch("https://ghg.center/api/stac/collections/emit-ch4plume-v1/items?limit=1000")
 ).json();

 // Write the data to a file
 fs.writeFileSync(
 "./data/methane_stac.geojson",
 JSON.stringify(methane_stac_geojson, null, 2)
 );

}

main()
