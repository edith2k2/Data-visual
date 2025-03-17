// heatmap-level2.js
function drawLevel2() {
// Clear the existing visualization
d3.select("#chart").select("svg").remove();
    // Set dimensions and margins for the SVG container.
// Increase the dimensions of the SVG container
const margin = { top: 30, right: 120, bottom: 60, left: 80 },
    width = 1200 - margin.left - margin.right,     // Increased from 1000
    height = 800 - margin.top - margin.bottom;     // Increased from 600

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

// Date parser for "YYYY-MM-DD"
const parseDate = d3.timeParse("%Y-%m-%d");

// Load and process the CSV data
d3.csv("data/temperature_daily.csv").then(rawData => {

// Convert data types
rawData.forEach(d => {
d.date = parseDate(d.date.trim());
d.year = d.date.getFullYear();
d.month = d.date.getMonth() + 1;
d.day = d.date.getDate();
d.max_temperature = +d.max_temperature;
d.min_temperature = +d.min_temperature;
});

// Get the most recent year in the dataset
const maxYear = d3.max(rawData, d => d.year);
    
// Filter to show only the last 10 years
const filteredData = rawData.filter(d => d.year > maxYear - 10);


// **Step 1: Group Data by Year and Month**
const grouped = d3.rollups(
    filteredData,
    v => ({
        daily: v.map(d => ({ day: d.day, maxTemp: d.max_temperature, minTemp: d.min_temperature })),
        maxTemp: d3.max(v, d => d.max_temperature),  // Use max 
        minTemp: d3.min(v, d => d.min_temperature)   // Use min 
    }),
    d => d.year,
    d => d.month
);

// Flatten into an array for D3
const monthlyData = [];
grouped.forEach(([year, monthsArr]) => {
    monthsArr.forEach(([month, val]) => {
        monthlyData.push({
            year: year,
            month: month,
            daily: val.daily,
            maxTemp: val.maxTemp,  
            minTemp: val.minTemp   
        });
    });
});


// **Step 2: Define Scales**
const years = Array.from(new Set(monthlyData.map(d => d.year))).sort();
const months = [1,2,3,4,5,6,7,8,9,10,11,12];

const cellSize = Math.min(width / years.length, height / months.length);

// Recalculate width and height to maintain proper spacing
const adjustedWidth = cellSize * years.length;
const adjustedHeight = cellSize * months.length;

// Update the scales to use the new dimensions
const xScale = d3.scaleBand()
    .domain(years)
    .range([0, adjustedWidth])
    .padding(0.02);

const yScale = d3.scaleBand()
    .domain(months)
    .range([0, adjustedHeight])
    .padding(0.02);

// Compute temperature range for color scale
const allTemps = monthlyData.flatMap(d => [d.maxTemp, d.minTemp]);
const tempExtent = d3.extent(allTemps);

// color range from blue to red
const colorRange = [
    "#4575b4", // Dark blue (Coldest)
    "#74add1", // Medium blue
    "#abd9e9", // Light blue
    "#e0f3f8", // Very light blue
    "#ffffbf", // Light yellow
    "#fee090", // Yellow
    "#fdae61", // Light orange
    "#f46d43", // Orange
    "#d73027", // Red
    "#a50026"  // Dark red (Hottest)
  ];
  
  //  temperature thresholds 
  const tempThresholds = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];

// Discrete color scale mapping temperatures to bins
const colorScale = d3.scaleThreshold()
  .domain(tempThresholds)
  .range(colorRange);

// **Step 3: Create Cells**
const cell = svg.selectAll(".month-cell")
.data(monthlyData)
.enter().append("g")
.attr("class", "month-cell")
.attr("transform", d => `translate(${xScale(d.year)},${yScale(d.month)})`);

const cellWidth = xScale.bandwidth();
const cellHeight = yScale.bandwidth();

// Draw background rectangle (color by average max temperature)
cell.append("rect")
    .attr("width", cellWidth)
    .attr("height", cellHeight)
    .attr("fill", d => colorScale(d.maxTemp))  // Use maxTemp instead of avgMax
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
            .html(`
                <strong>${d.year}-${String(d.month).padStart(2,"0")}</strong><br>
                Max: ${d.maxTemp.toFixed(1)} °C<br>
                Min: ${d.minTemp.toFixed(1)} °C
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

// **Step 4: Draw Mini Line Charts**
// After calculating monthlyData, determine the global min and max temperatures
// This will be used for all mini charts
const globalMinTemp = d3.min(monthlyData.flatMap(d => 
    d.daily.map(dd => dd.minTemp)
));

const globalMaxTemp = d3.max(monthlyData.flatMap(d => 
    d.daily.map(dd => dd.maxTemp)
));

cell.each(function(d) {
    const g = d3.select(this);

    const dailyData = d.daily;
    const daysInMonth = d3.max(dailyData, dd => dd.day);

    const xMini = d3.scaleLinear().domain([1, daysInMonth]).range([4, cellWidth - 4]);
    
    // Use the global min and max temperature for ALL mini charts
    const yMini = d3.scaleLinear()
      .domain([globalMinTemp, globalMaxTemp])
      .range([cellHeight - 4, 4]);

    // Line generator for max temperature
    const maxLineGen = d3.line()
      .x(dd => xMini(dd.day))
      .y(dd => yMini(dd.maxTemp))
      .curve(d3.curveMonotoneX);

    //  Line generator for min temperature
    const minLineGen = d3.line()
      .x(dd => xMini(dd.day))
      .y(dd => yMini(dd.minTemp))
      .curve(d3.curveMonotoneX);

    // Plot max temperature line (e.g., red)
    g.append("path")
      .attr("d", maxLineGen(dailyData))
      .attr("stroke", "#4daf4a")
      .attr("fill", "none")
      .attr("stroke-width", 2);

    // Plot min temperature line (e.g., blue)
    g.append("path")
      .attr("d", minLineGen(dailyData))
      .attr("stroke", "#a6cee3")
      .attr("fill", "none")
      .attr("stroke-width", 2);
  });
xScale.padding(0.02);  // Reduce padding to make cells larger
yScale.padding(0.02);
// **Step 5: Add Axes**
const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
const yAxis = d3.axisLeft(yScale).tickFormat(d => {
const date = new Date(2000, d - 1, 1);
return d3.timeFormat("%b")(date);
});

svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("font-size", "14px");

svg.append("g")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "14px");

// Heatmap Legend (Stepwise Colors)
const legendHeight = 180;
const legendWidth = 20;

const legend = svg.append("g")
  .attr("transform", `translate(${width + 20}, 10)`);

// Create a legend scale (vertical bars for each threshold)
legend.selectAll("rect")
  .data(tempThresholds)
  .enter().append("rect")
    .attr("y", (d, i) => i * (legendHeight / tempThresholds.length))
    .attr("width", legendWidth)
    .attr("height", legendHeight / tempThresholds.length)
    .attr("fill", (d, i) => colorRange[i]);

// Add labels for the thresholds
legend.selectAll("text")
  .data(tempThresholds)
  .enter().append("text")
    .attr("x", legendWidth + 5)
    .attr("y", (d, i) => (i * (legendHeight / tempThresholds.length)) + 10)
    .attr("font-size", "12px")
    .text(d => `${d}°C`);

// Legend Title
legend.append("text")
  .attr("x", 0)
  .attr("y", -10)
  .attr("font-size", "12px")
  .text("Temperature (°C)");

//  Line Chart Legend
const lineLegend = svg.append("g")
    .attr("transform", `translate(${width + 20}, ${legendHeight + 40})`);

lineLegend.append("line")
    .attr("x1", 0).attr("y1", 0)
    .attr("x2", 20).attr("y2", 0)
    .attr("stroke", "#39A96B")
    .attr("stroke-width", 2);

lineLegend.append("text")
    .attr("x", 30).attr("y", 5)
    .attr("font-size", "12px")
    .text("Max Temp");

lineLegend.append("line")
    .attr("x1", 0).attr("y1", 20)
    .attr("x2", 20).attr("y2", 20)
    .attr("stroke", "#AAAAAA")
    .attr("stroke-width", 2);

lineLegend.append("text")
    .attr("x", 30).attr("y", 25)
    .attr("font-size", "12px")
    .text("Min Temp");

});
}

window.drawLevel2 = drawLevel2;