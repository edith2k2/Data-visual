function drawLevel1() {
    // Remove any existing chart before drawing a new one
    d3.select("#chart").select("svg").remove(); 
    // Show the toggle button
    document.getElementById("toggleTemp").style.display = "inline-block";

    // Set default mode to "max temperature"
    let useMaxTemp = true;

    // Dimensions
    const margin = { top: 20, right: 100, bottom: 50, left: 60 },
    width  = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("#tooltip");

    // A small helper to parse date
    const parseDate = d3.timeParse("%Y-%m-%d");

    // We’ll store aggregated data here
    let monthlyData = [];     // array of {year, month, maxTemp, minTemp, ...}
    let years = [];
    let months = [1,2,3,4,5,6,7,8,9,10,11,12];

    // Current mode: "max" or "min"
    let currentMode = "max";

    // Load the CSV
    d3.csv("data/temperature_daily.csv").then(data => {
        // 1) Parse each row
        data.forEach(d => {
            d.date = parseDate(d.date);
            d.year = d.date.getFullYear();
            d.month = d.date.getMonth() + 1;  // 1..12
            d.MaxTemp = +d.max_temperature;
            d.MinTemp = +d.min_temperature;
            if (isNaN(d.max_temperature) || isNaN(d.min_temperature)) {
                console.warn("Invalid temperature data:", d);
            }
        });

        // 2) Group by (year, month)
        const grouped = d3.rollups(
            data,
            v => {
                // For each month-year group, compute max & min
                return {
                    maxTemp: d3.max(v, d => d.MaxTemp),
                    minTemp: d3.min(v, d => d.MinTemp)
                };
            },
            d => d.year,
            d => d.month
        );
        // grouped is like: [ [year, [ [month, {maxTemp, minTemp}], ... ] ], ... ]

        // Flatten structure
        grouped.forEach(([yr, monthsArray]) => {
            monthsArray.forEach(([mo, stats]) => {
                monthlyData.push({
                    year: yr,
                    month: mo,
                    maxTemp: stats.maxTemp,
                    minTemp: stats.minTemp
                });
            });
        });

        // Collect all unique years
        years = Array.from(new Set(monthlyData.map(d => d.year))).sort();

        // Create band scales for x (years) and y (months)
        const xScale = d3.scaleBand()
            .domain(years)
            .range([0, width])
            .padding(0.05);

        const yScale = d3.scaleBand()
            .domain(months)
            .range([0, height])
            .padding(0.05);

        // For color, find global min & max of the relevant temperature measure
        // Compute min/max temperatures across all months
        const allTemps = data.flatMap(d => [+d.max_temperature, +d.min_temperature]);
        const tempExtent = d3.extent(allTemps);  // [minTemp, maxTemp]

        console.log("Temperature Scale Range:", tempExtent);  // Debugging

        // Use discrete color bins (same as Level 2)
        const colorScale = d3.scaleThreshold()
            .domain([0, 5, 10, 15, 20, 25, 30, 35, 40, 45])
            .range(["#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", 
                    "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

        // 4) Draw the cells
        svg.selectAll(".cell")
            .data(monthlyData)
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", d => xScale(d.year))
            .attr("y", d => yScale(d.month))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.maxTemp)) // default to maxTemp
            .on("mouseover", (event, d) => {
                const [mx, my] = d3.pointer(event);
                // Find max and min temps for this cell
                const maxTemp = d.maxTemp.toFixed(1);
                const minTemp = d.minTemp.toFixed(1);
                // Format the date (Year-Month)
                const dateStr = `${d.year}-${String(d.month).padStart(2, '0')}`;

                // Show tooltip with white background and black text
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.95)
                    .style("background-color", "white")
                    .style("color", "black"); 
                tooltip
                    .style("left", (mx + 70) + "px")
                    .style("top", (my) + "px")
                    .html(` Date: ${dateStr}, max: ${maxTemp}, min: ${minTemp}`);
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });

        // Create and append x-axis
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis);

        // Create and append y-axis
        const yAxis = d3.axisLeft(yScale).tickFormat(d => {
            // Convert month number to short month name.
            const date = new Date(2000, d - 1, 1);
            return d3.timeFormat("%b")(date);
        });
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // 5) Legend
        // We can create a small group for the legend, or use d3-legend.
        const legendHeight = 150;
        const legendWidth  = 20;
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 10}, 0)`);

        // Create discrete legend
        legend.selectAll("rect")
            .data(colorScale.domain())  
            .enter().append("rect")
            .attr("y", (d, i) => i * (legendHeight / colorScale.domain().length))
            .attr("width", legendWidth)
            .attr("height", legendHeight / colorScale.domain().length)
            .attr("fill", (d, i) => colorScale(d));

        // Add Labels for the Legend Thresholds
        legend.selectAll("text")
            .data(colorScale.domain())
            .enter().append("text")
            .attr("x", legendWidth + 5)
            .attr("y", (d, i) => (i * (legendHeight / colorScale.domain().length)) + 12)
            .attr("font-size", "12px")
            .text(d => `${d}°C`);

        // Legend Title
        legend.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .attr("font-size", "12px")
            .text("Temperature (°C)");

        // 6) Toggle between max and min temperature
        d3.select("#toggleTemp").on("click", () => {
            currentMode = (currentMode === "max") ? "min" : "max";
            d3.select("#toggleTemp").text(currentMode === "max" ? "Switch to Min Temp" : "Switch to Max Temp");

            // Update the fills
            svg.selectAll(".cell")
                .transition()
                .duration(600)
                .attr("fill", d => colorScale(
                    currentMode === "max" ? d.maxTemp : d.minTemp
                ));
        });
    });
}
window.drawLevel1 = drawLevel1;
