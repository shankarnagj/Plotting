// Set up the chart dimensions
const margin = { top: 20, right: 20, bottom: 30, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Set up the scales
let x = d3.scaleLinear().range([0, width]);
let y = d3.scaleLinear().range([height, 0]);

// Create the SVG container
const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Set up the tooltip
const tooltip = d3.select("#tooltip");

document.getElementById("functionSelect").addEventListener("change", function() {
    const customFunctionInput = document.getElementById("customFunctionInput");
    if (this.value === "custom") {
        customFunctionInput.style.display = "inline";
    } else {
        customFunctionInput.style.display = "none";
    }
});

function plotFunction() {
    // Get the function from the input
    const functionSelect = document.getElementById("functionSelect").value;
    const customFunctionInput = document.getElementById("customFunctionInput").value;
    const functionInput = functionSelect === "custom" ? customFunctionInput : functionSelect;

    // Get the x and y ranges from the input
    const xRange = document.getElementById("xRange").value.split(',').map(Number);
    const yRange = document.getElementById("yRange").value.split(',').map(Number);

    console.log(`Selected function: ${functionInput}`);
    console.log(`X range: ${xRange}`);
    console.log(`Y range: ${yRange}`);

    // Update the scales with the new ranges
    x.domain(xRange);
    y.domain(yRange);

    // Clear the previous plot
    svg.selectAll("*").remove();

    // Redraw the axes
    svg.append("g")
        .attr("transform", `translate(0,${height / 2})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .attr("transform", `translate(${width / 2},0)`)
        .call(d3.axisLeft(y));

    try {
        // Create the new function
        const f = new Function("x", `return ${functionInput};`);

        // Generate the data
        const data = d3.range(xRange[0], xRange[1] + 0.1, 0.1).map(x => ({ x: x, y: f(x) }));

        // Update y-domain based on the new data
        y.domain(d3.extent(data, d => d.y)).nice();

        // Set up the line generator
        const line = d3.line()
            .x(d => x(d.x))
            .y(d => y(d.y));

        // Add the line to the chart
        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        // Create a focus circle to highlight the closest point
        const focus = svg.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("circle")
            .attr("r", 4.5);

        focus.append("rect")
            .attr("class", "tooltip")
            .attr("width", 100)
            .attr("height", 40)
            .attr("x", 10)
            .attr("y", -22)
            .attr("rx", 4)
            .attr("ry", 4);

        focus.append("text")
            .attr("x", 18)
            .attr("y", -2);

        // Overlay to capture mouse events
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => focus.style("display", null))
            .on("mouseout", () => focus.style("display", "none"))
            .on("mousemove", mousemove);

        function mousemove(event) {
            const bisect = d3.bisector(d => d.x).left;
            const x0 = x.invert(d3.pointer(event)[0]);
            const i = bisect(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            const d = x0 - d0.x > d1.x - x0 ? d1 : d0;

            focus.attr("transform", `translate(${x(d.x)},${y(d.y)})`);
            focus.select("text").text(`x: ${d.x.toFixed(2)}, y: ${d.y.toFixed(2)}`);

            tooltip.style("left", `${event.pageX + 5}px`)
                .style("top", `${event.pageY - 28}px`)
                .style("opacity", 1)
                .html(`x: ${d.x.toFixed(2)}<br>y: ${d.y.toFixed(2)}`);
        }
    } catch (error) {
        console.error("Error in function:", error);
        alert("Invalid function. Please enter a valid JavaScript function of x.");
    }
}

// Initial plot
plotFunction();
