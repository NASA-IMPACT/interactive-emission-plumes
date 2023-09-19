const d3 = require("d3");

function generateScale(min, max, step) {
  const numbers = [];
  for (let i = min; i <= max; i += step) {
    numbers.push(i);
  }
  numbers[numbers.length - 1] += "+";
  return numbers;
}


function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  elmnt.onmousedown = dragMouseDown;


  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}


function createColorbar(VMIN, VMAX) {

  // Create a color scale using D3
  const colorScale = d3
    .scaleSequential(d3.interpolatePlasma)
    .domain([VMIN, VMAX]); // Set VMIN and VMAX as your desired min and max values

  // Create a colorbar element
  const colorbar = d3.select("body").append("div").attr("class", "colorbar");

  colorbar
    .append("svg")
    .attr("width", 300) // Adjust the width as needed
    .attr("height", 12) // Adjust the height as needed
    .attr("rx", 10)
    .append("g")
    .selectAll("rect")
    .data(d3.range(VMIN, VMAX, (VMAX - VMIN) / 100)) // Adjust the number of color segments as needed
    .enter()
    .append("rect")
    .attr("height", 20)
    .attr("width", 3) // Adjust the width of each color segment

    .attr("x", (d, i) => i * 3)
    .attr("fill", (d) => colorScale(d));

  // Define custom scale labels
  const scaleLabels = generateScale(VMIN, VMAX, 300);

  // Create a container for horizontal scale labels
  const scaleLabelContainer = colorbar
    .append("div")
    .attr("class", "scale-label-container");

  // Create scale label elements horizontally
  scaleLabelContainer
    .selectAll("div")
    .data(scaleLabels)
    .enter()
    .append("div")
    .attr("class", "colorbar-scale-label-horizontal")
    .text((d) => d); // Set the label text

  // Add the label "Methane enhancement (ppm m)" under the scale labels
  colorbar
    .append("div")
    .attr("class", "colorbar-label")
    .style("text-align", "center") // Center the label
    .style("margin-bottom", "12px") // Adjust margin as needed
    .html("<strong>Methane enhancement (ppm m)</strong>");

  // Add CSS styles to position and style the colorbar
  colorbar
    .style("position", "absolute")
    .style("bottom", "60px") // Adjust the top position as needed
    .style("right", "50px") // Adjust the left position as needed
    .style("background-color", "white")
    .style("padding", "12px");

  // Add CSS styles to style horizontal scale labels
  scaleLabelContainer
    .style("display", "flex")
    .style("justify-content", "space-between")
    .style("margin-bottom", "12px"); // Adjust margin as needed
  const dateRange = d3.select("body").append("div").attr("class", "date-range");

  const dateRangeContainer = dateRange
    .append("p")
    .attr("class", "scale-label-container");
  dateRangeContainer.append("label").attr("for", "amount").text("Date range:");
  dateRangeContainer
    .append("input")
    .attr("type", "text")
    .attr("id", "amount")
    .style("border", "0")
    .style("color", "#f6931f") // Adjust margin as needed
    .style("font-weight", "bold")
    .style("size", "100")
    .style("width", "240px");
  dateRange.append("div").attr("id", "slider-range");

  dateRange
    .style("position", "absolute")
    .style("top", "60px") // Adjust the top position as needed
    .style("left", "50px") // Adjust the left position as needed
    .style("background-color", "white");
}

const getFilename = function (pathStr) {
  return pathStr.substring(pathStr.lastIndexOf("/") + 1);
};

function displayPropertiesWithD3(properties) {

  const important_keys = [
    "Max Plume Concentration (ppm m)"
  ]


  const combinedList = important_keys.concat(Object.keys(properties));

  const new_sorted_properties = [...new Set(combinedList)];
  // Create a display_div element

  // Create an HTML string to display the properties
  let html =
    "<span id=\"close\" onclick=\"document.getElementById('display_props').style.display='none'\" >x</span><table>";
  

  const keys_to_exclude = [
    "id",
    "SceneFID",
    "map_endtime",
    "Scene FIDs",
    "style",
    "DCID",
    "DAAC Scene Numbers",
    "plume_complex_count",
  ];

   // Iterate through the properties and create list items
  new_sorted_properties.forEach(key => {
    if (!keys_to_exclude.includes(key)) {

      value = properties[key];
      if (value.toString().startsWith("https://")) {
        value = `<a href="${value}" target="_blank" >${getFilename(value)} <svg width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 16 16" aria-hidden="true" class="expand-top-right__CollecticonExpandTopRight-sc-1bjhv94-0"><title>expand top right icon</title><path d="M3,5h4V3H1v12h12V9h-2v4H3V5z M16,8V0L8,0v2h4.587L6.294,8.294l1.413,1.413L14,3.413V8H16z"></path></svg></a>`;
      }
      html += `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`;

    }
  })
  html += "</table>";

  d3.select("body").select("#display_props").remove();

  const display_div = d3
    .select("body")
    .append("div")
    .attr("id", "display_props")
    .html(html);

  // Add CSS styles to position and style the display_div
  display_div.style("position", "absolute");
}

module.exports = {
  createColorbar: createColorbar,
  displayPropertiesWithD3: displayPropertiesWithD3,
  dragElement: dragElement
};
