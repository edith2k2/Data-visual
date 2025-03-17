function drawLevel2() {
    // Remove previous chart
    d3.select("#chart").select("svg").remove(); 

    // Show the toggle button for cell colors
    document.getElementById("toggleTemp").style.display = "inline-block";

    // Default: Show Max Temperature Colors
    let useMaxCellColor = true;

    // Set margins and dimensions for the SVG container
    const margin = { top: 30, right: 120, bottom: 60, left: 80 },
          width = 1200 - margin.left - margin.right,
          height = 800 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Load the CSV data
    d3.csv("data/temperature_daily.csv").then(rawData => {
        // Parse and format the data
        rawData.forEach(d => {
            d.date = d3.timeParse("%Y-%m-%d")(d.date.trim());
            d.year = d.date.getFullYear();
            d.month = d.date.getMonth() + 1;
            d.day = d.date.getDate();
            d.max_temperature = +d.max_temperature;
            d.min_temperature = +d.min_temperature;
        });

        // Filter data for the last 10 years
        const maxYear = d3.max(rawData, d => d.year);
        const filteredData = rawData.filter(d => d.year > maxYear - 10);

        // Group data by year and month
        const grouped = d3.rollups(
            filteredData,
            v => ({
                daily: v.map(d => ({ day: d.day, maxTemp: d.max_temperature, minTemp: d.min_temperature })),
                maxTemp: d3.max(v, d => d.max_temperature),
                minTemp: d3.min(v, d => d.min_temperature)
            }),
            d => d.year,
            d => d.month
        );

        // Flatten the grouped data into an array
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

        // Get unique years and months
        const years = Array.from(new Set(monthlyData.map(d => d.year))).sort();
        const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        // Calculate cell size and adjusted dimensions
        const cellSize = Math.min(width / years.length, height / months.length);
        const adjustedWidth = cellSize * years.length;
        const adjustedHeight = cellSize * months.length;

        // Create scales for x and y axes
        const xScale = d3.scaleBand()
            .domain(years)
            .range([0, adjustedWidth])
            .padding(0.02);

        const yScale = d3.scaleBand()
            .domain(months)
            .range([0, adjustedHeight])
            .padding(0.02);

        // Create a color scale for the heatmap
        const colorScale = d3.scaleThreshold()
            .domain([0, 5, 10, 15, 20, 25, 30, 35, 40, 45])
            .range(["#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

        // Create groups for each month cell
        const cell = svg.selectAll(".month-cell")
            .data(monthlyData)
            .enter().append("g")
            .attr("class", "month-cell")
            .attr("transform", d => `translate(${xScale(d.year)},${yScale(d.month)})`);

        const cellWidth = xScale.bandwidth();
        const cellHeight = yScale.bandwidth();

        // Add x-axis (years)
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        svg.append("g")
            .attr("transform", `translate(0, ${adjustedHeight})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "14px");

        // Add y-axis (months)
        const yAxis = d3.axisLeft(yScale).tickFormat(d => {
            const date = new Date(2000, d - 1, 1);
            return d3.timeFormat("%b")(date); // Convert month number to abbreviation
        });
        svg.append("g")
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "14px");

        // Function to update cell colors based on max or min temperature
        function updateCellColors() {
            cell.selectAll("rect")
                .attr("fill", d => colorScale(useMaxCellColor ? d.maxTemp : d.minTemp));
        }
        // Create tooltip if it doesn't exist
        let tooltip = d3.select("body").select(".tooltip");
        if (tooltip.empty()) {
        tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "white")
            .style("color", "black") 
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("padding", "10px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("font-family", "sans-serif")
            .style("box-shadow", "0 3px 6px rgba(0,0,0,0.2)")
            .style("z-index", 1000); // Make sure tooltip appears above other elements
}
        // Add rectangles for each cell
        cell.append("rect")
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                // Find max and min temps for this cell
                const maxTemp = d.maxTemp.toFixed(1);
                const minTemp = d.minTemp.toFixed(1);
                
                // Format the date (Year-Month)
                const monthName = new Date(2000, d.month - 1, 1).toLocaleString('default', { month: 'short' });
                const dateStr = `${monthName} ${d.year}`;
                
                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9)
                    .style("background-color", "white")
                    .style("color", "black") ;
                    
                tooltip.html(`Date: ${d.year}-${String(d.month).padStart(2, '0')}, max: ${maxTemp}, min: ${minTemp}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Initial draw of cell colors
        updateCellColors();

        // Calculate global min and max temperatures for line charts
        const globalMinTemp = d3.min(monthlyData.flatMap(d => d.daily.map(dd => dd.minTemp)));
        const globalMaxTemp = d3.max(monthlyData.flatMap(d => d.daily.map(dd => dd.maxTemp)));

        // Add line charts for daily temperatures within each cell
        cell.each(function(d) {
            const g = d3.select(this);
            const dailyData = d.daily;
            const daysInMonth = d3.max(dailyData, dd => dd.day);

            const xMini = d3.scaleLinear().domain([1, daysInMonth]).range([4, cellWidth - 4]);
            const yMini = d3.scaleLinear()
                .domain([globalMinTemp, globalMaxTemp])
                .range([cellHeight - 4, 4]);

            // Line for Max Temperature (Green)
            const maxLineGen = d3.line()
                .x(dd => xMini(dd.day))
                .y(dd => yMini(dd.maxTemp))
                .curve(d3.curveMonotoneX);

            g.append("path")
                .attr("d", maxLineGen(dailyData))
                .attr("stroke", "#4daf4a")
                .attr("fill", "none")
                .attr("stroke-width", 2);

            // Line for Min Temperature (Blue)
            const minLineGen = d3.line()
                .x(dd => xMini(dd.day))
                .y(dd => yMini(dd.minTemp))
                .curve(d3.curveMonotoneX);

            g.append("path")
                .attr("d", minLineGen(dailyData))
                .attr("stroke", "#a6cee3")
                .attr("fill", "none")
                .attr("stroke-width", 2);
        });

        // Heatmap Legend (Stepwise Colors)
        const legendHeight = 180;
        const legendWidth = 20;

        const legend = svg.append("g")
            .attr("transform", `translate(${width + 20}, 10)`);

        // Create a legend scale (vertical bars for each threshold)
        legend.selectAll("rect")
            .data(colorScale.domain())  // Use the thresholds for discrete colors
            .enter().append("rect")
            .attr("y", (d, i) => i * (legendHeight / colorScale.domain().length))
            .attr("width", legendWidth)
            .attr("height", legendHeight / colorScale.domain().length)
            .attr("fill", (d, i) => colorScale(d));

        // Add Labels for the Thresholds
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

        // Line Chart Legend
        const lineLegend = svg.append("g")
            .attr("transform", `translate(${width + 20}, ${legendHeight + 40})`);

        lineLegend.append("line")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", 20).attr("y2", 0)
            .attr("stroke", "#4daf4a")
            .attr("stroke-width", 2);

        lineLegend.append("text")
            .attr("x", 30).attr("y", 5)
            .attr("font-size", "12px")
            .text("Max Temp");

        lineLegend.append("line")
            .attr("x1", 0).attr("y1", 20)
            .attr("x2", 20).attr("y2", 20)
            .attr("stroke", "#a6cee3")
            .attr("stroke-width", 2);

        lineLegend.append("text")
            .attr("x", 30).attr("y", 25)
            .attr("font-size", "12px")
            .text("Min Temp");

        // Toggle Button for Max/Min Temperature
        document.getElementById("toggleTemp").addEventListener("click", () => {
            useMaxCellColor = !useMaxCellColor;
            document.getElementById("toggleTemp").innerText = useMaxCellColor ? "Show Min Temp Colors" : "Show Max Temp Colors";
            updateCellColors();
        });
    });
}

window.drawLevel2 = drawLevel2;