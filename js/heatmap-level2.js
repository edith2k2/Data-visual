// heatmap-level2.js
function drawLevel2() {
// Clear the existing visualization
d3.select("#chart").select("svg").remove();
    // Set dimensions and margins for the SVG container.
const margin = { top: 20, right: 100, bottom: 50, left: 60 },
width  = 1000 - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

const svg = d3.select("#chart")
.append("svg")
.attr("width",  width  + margin.left + margin.right)
.attr("height", height + margin.top  + margin.bottom)
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

// **Step 1: Group Data by Year and Month**
const grouped = d3.rollups(
rawData,
v => ({
daily: v.map(d => ({ day: d.day, maxTemp: d.max_temperature, minTemp: d.min_temperature })),
avgMax: d3.mean(v, d => d.max_temperature),
avgMin: d3.mean(v, d => d.min_temperature)
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
  daily: val.daily,  // Daily temperature variations
  avgMax: val.avgMax,
  avgMin: val.avgMin
});
});
});

// **Step 2: Define Scales**
const years = Array.from(new Set(monthlyData.map(d => d.year))).sort();
const months = [1,2,3,4,5,6,7,8,9,10,11,12];

const xScale = d3.scaleBand()
.domain(years)
.range([0, width])
.padding(0.05);

const yScale = d3.scaleBand()
.domain(months)
.range([0, height])
.padding(0.05);

// Compute temperature range for color scale
const allAvgs = monthlyData.flatMap(d => [d.avgMax, d.avgMin]);
const tempExtent = d3.extent(allAvgs);

const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
.domain(tempExtent);

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
.attr("fill", d => colorScale(d.avgMax))
.on("mouseover", (event, d) => {
tooltip.style("opacity", 1)
  .html(`
    <strong>${d.year}-${String(d.month).padStart(2,"0")}</strong><br>
    Avg Max: ${d.avgMax.toFixed(1)} °C<br>
    Avg Min: ${d.avgMin.toFixed(1)} °C
  `)
  .style("left", (event.pageX + 10) + "px")
  .style("top", (event.pageY - 28) + "px");
})
.on("mouseout", () => tooltip.style("opacity", 0));

// **Step 4: Draw Mini Line Charts**
cell.each(function(d) {
const g = d3.select(this);

const dailyData = d.daily;
const daysInMonth = d3.max(dailyData, dd => dd.day);

// Scales for mini line charts
const xMini = d3.scaleLinear()
.domain([1, daysInMonth])
.range([4, cellWidth - 4]);

const tempMin = d3.min(dailyData, dd => dd.minTemp);
const tempMax = d3.max(dailyData, dd => dd.maxTemp);

const yMini = d3.scaleLinear()
.domain([tempMin, tempMax])
.range([cellHeight - 4, 4]);

// Line generator
const lineGen = d3.line()
.x(dd => xMini(dd.day))
.y(dd => yMini(dd.maxTemp))
.curve(d3.curveMonotoneX);

g.append("path")
.attr("class", "mini-line")
.attr("d", lineGen(dailyData))
.attr("stroke", "#2c7fb8")
.attr("fill", "none")
.attr("stroke-width", 1.5);
});

// **Step 5: Add Axes**
const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
const yAxis = d3.axisLeft(yScale).tickFormat(d => {
const date = new Date(2000, d - 1, 1);
return d3.timeFormat("%b")(date);
});

svg.append("g")
.attr("transform", `translate(0, ${height})`)
.call(xAxis);

svg.append("g")
.call(yAxis);

// **Step 6: Add Legend**
const legendHeight = 150;
const legendWidth  = 20;
const legend = svg.append("g")
.attr("transform", `translate(${width + 10}, 0)`);

const legendScale = d3.scaleLinear()
.domain(tempExtent)
.range([legendHeight, 0]);

const legendAxis = d3.axisRight(legendScale).ticks(5);

const gradient = legend.append("defs")
.append("linearGradient")
.attr("id", "tempGradient")
.attr("x1", "0%").attr("y1", "100%")
.attr("x2", "0%").attr("y2", "0%");

gradient.selectAll("stop")
.data([
{offset: "0%", color: d3.interpolateYlOrRd(0)},
{offset: "100%", color: d3.interpolateYlOrRd(1)}
])
.enter().append("stop")
.attr("offset", d => d.offset)
.attr("stop-color", d => d.color);

legend.append("rect")
.attr("width", legendWidth)
.attr("height", legendHeight)
.style("fill", "url(#tempGradient)");

legend.append("g")
.attr("transform", `translate(${legendWidth},0)`)
.call(legendAxis);
});
}

window.drawLevel2 = drawLevel2;