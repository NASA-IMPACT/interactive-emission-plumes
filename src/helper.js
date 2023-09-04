const d3 = require('d3')



function generateScale(min, max, step) {
    const numbers = [];
    for (let i = min; i <= max; i += step) {
        numbers.push(i);
    }
    numbers[numbers.length -1] += "+"
    return numbers;
}

function createColorbar(VMIN,VMAX ) {

    // Create a color scale using D3
    const colorScale = d3.scaleSequential(d3.interpolatePlasma)
        .domain([VMIN, VMAX]); // Set VMIN and VMAX as your desired min and max values

    // Create a colorbar element
    const colorbar = d3.select("body")
        .append("div")
        .attr("class", "colorbar");

    colorbar.append("svg")
        .attr("width", 300) // Adjust the width as needed
        .attr("height", 30) // Adjust the height as needed
        .append("g")
        .selectAll("rect")
        .data(d3.range(VMIN, VMAX, (VMAX - VMIN) / 100)) // Adjust the number of color segments as needed
        .enter().append("rect")
        .attr("height", 20)
        .attr("width", 3) // Adjust the width of each color segment
        .attr("x", (d, i) => i * 3)
        .attr("fill", d => colorScale(d));

    // Define custom scale labels
    const scaleLabels = generateScale(VMIN, VMAX, 200);

    // Create a container for horizontal scale labels
    const scaleLabelContainer = colorbar.append("div")
        .attr("class", "scale-label-container");

    // Create scale label elements horizontally
    scaleLabelContainer.selectAll("div")
        .data(scaleLabels)
        .enter().append("div")
        .attr("class", "colorbar-scale-label-horizontal")
        .text(d => d); // Set the label text

    // Add the label "Plume Concentration (ppm m)" under the scale labels
    colorbar.append("div")
        .attr("class", "colorbar-label")
        .style("text-align", "center") // Center the label
        .style("margin-bottom", "12px") // Adjust margin as needed
        .html("<strong>Plume Concentration (ppm m)</strong>");

    // Add CSS styles to position and style the colorbar
    colorbar.style("position", "absolute")
        .style("top", "60px") // Adjust the top position as needed
        .style("left", "50px") // Adjust the left position as needed
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "12px");

    // Add CSS styles to style horizontal scale labels
    scaleLabelContainer.style("display", "flex")
        .style("justify-content", "space-between")
        .style("margin-bottom", "12px"); // Adjust margin as needed


    const dateRangeContainer =  colorbar.append("p")
    .attr("class", "scale-label-container");
    dateRangeContainer
    .append("label")
    .attr("for", "amount")
    .text("Date range:");
    dateRangeContainer
    .append("input")
    .attr("type", "text")
    .attr("id", "amount")
    .style("border", "0")
    .style("color", "#f6931f") // Adjust margin as needed
    .style("font-weight", "bold")
    .style("size", "100")
    .style("width", "240px")
 // Add the label "Plume Concentration (ppm m)" under the scale labels
    colorbar.append("div")
    .attr("id", "slider-range")

}


function displayProperties(properties) {
    // Extract the properties from the feature


    // Create an HTML string to display the properties
    let html = '<div><h2>Feature Properties</h2><ul>';

    // Iterate through the properties and create list items
    for (const key in properties) {
        if (key !== 'style') {
            html += `<li><strong>${key}:</strong> ${properties[key]}</li>`;
        }
    }

    html += '</ul></div>';

   return html
}


function displayPropertiesWithD3(properties) {
        // Create a display_div element


    // Create an HTML string to display the properties
    let html = '<table>'

    // Iterate through the properties and create list items
    for (const key in properties) {

        if (key !== 'style') {
            value = properties[key]
            if (value.toString().startsWith('https://')) {
                value = `<a href="${value}">Download file</a>`


            }
            html += `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`;
        }
    }
    html += '</table>'


    d3.select("body").select("#display_props").remove();




    const display_div = d3.select("body")
    .append("div")
    .attr("id", "display_props")
    .html(html)


    // Add CSS styles to position and style the display_div
    display_div.style("position", "absolute")
    .style("top", "8%") // Adjust the top position as needed
    .style("left", "70%") // Adjust the left position as needed
    .style("background-color", "#2370a2")
    .style("padding", "12px");



}






module.exports = {createColorbar: createColorbar, displayProperties: displayProperties, displayPropertiesWithD3: displayPropertiesWithD3};
