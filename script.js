// Initialize variables
let data = [];
let target = null;
const svgWidth = 600;
const svgHeight = 400;
let previousNeighbors = [];

// D3.js setup
const dataSvg = d3.select("#dataViz");
const knnSvg = d3.select("#knnViz");

// Create a color scale function
function colorScale(category) {
    const colorKeys = Object.keys(colorNames);
    return colorKeys[category % colorKeys.length];
}

const colorNames = {
    "#f1f13c": "Yellow",
    "#d62728": "Red",
    "#1f77b4": "Blue",
    "#2ca02c": "Green",
    "#9467bd": "Purple",
    "#8c564b": "Brown",
    "#e377c2": "Pink",
    "#7f7f7f": "Gray",
    "#ff7f0e": "Orange",
    "#17becf": "Cyan"
};

document.getElementById("generateData").addEventListener("click", generateData);
document.getElementById("runKNN").addEventListener("click", runKNN);

function generateData() {
    const numPoints = parseInt(document.getElementById("numPoints").value);
    const numCategories = parseInt(document.getElementById("numCategories").value);
    const clusterPercent = parseInt(document.getElementById("clusterPercent").value) / 100;

    data = [];
    for (let i = 0; i < numPoints; i++) {
        const cluster = Math.random() < clusterPercent;
        const x = cluster ? Math.random() * 200 + 200 : Math.random() * svgWidth;
        const y = cluster ? Math.random() * 200 + 100 : Math.random() * svgHeight;
        data.push({
            x: x,
            y: y,
            category: Math.floor(Math.random() * numCategories)
        });
    }

    target = { x: Math.random() * svgWidth, y: Math.random() * svgHeight };

    updateVisualization();

    // Clear KNN visualization when data is generated
    knnSvg.selectAll("*").remove();
    previousNeighbors = []; // Reset previous neighbors
}

function updateVisualization() {
    dataSvg.selectAll("*").remove();

    dataSvg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .attr("fill", d => colorScale(d.category))
        .call(d3.drag().on("drag", dragged));  // Add drag behavior

    if (target) {
        dataSvg.append("circle")
            .attr("cx", target.x)
            .attr("cy", target.y)
            .attr("r", 7)
            .attr("fill", "black")
            .call(d3.drag().on("drag", targetDragged)); // Add drag behavior to target
    }
}

function runKNN() {
    const k = parseInt(document.getElementById("numNeighbors").value);
    const weighting = document.getElementById("weighting").value;

    // Calculate distances
    data.forEach(d => {
        d.distance = Math.sqrt((d.x - target.x) ** 2 + (d.y - target.y) ** 2);
    });

    // Sort by distance
    data.sort((a, b) => a.distance - b.distance);

    // Get k nearest neighbors
    const neighbors = data.slice(0, k);

    // Classification based on majority vote
    const counts = {};
    neighbors.forEach(n => {
        counts[n.category] = (counts[n.category] || 0) + 1;
    });

    const predictedCategory = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const predictedColorName = colorNames[Object.keys(colorNames)[predictedCategory]];

    updateKnnVisualization(target, neighbors, predictedColorName, counts);
}

function updateKnnVisualization(target, neighbors, predictedColorName, counts) {
    knnSvg.selectAll("*").remove();

    // Draw the neighbors in sorted order in knnSvg with black dots and lines proportional to distance
    knnSvg.selectAll("line")
        .data(neighbors)
        .enter()
        .append("line")
        .attr("x1", 50)
        .attr("y1", (d, i) => 20 + i * 20)
        .attr("x2", d => 50 + d.distance)
        .attr("y2", (d, i) => 20 + i * 20)
        .attr("stroke", "black");

    knnSvg.selectAll("circle.black")
        .data(neighbors)
        .enter()
        .append("circle")
        .attr("class", "black")
        .attr("cx", 50)
        .attr("cy", (d, i) => 20 + i * 20)
        .attr("r", 5)
        .attr("fill", "black");

    knnSvg.selectAll("circle.color")
        .data(neighbors)
        .enter()
        .append("circle")
        .attr("class", "color")
        .attr("cx", d => 50 + d.distance)
        .attr("cy", (d, i) => 20 + i * 20)
        .attr("r", 5)
        .attr("fill", d => colorScale(d.category));

    // Draw the target and lines in dataSvg
    dataSvg.selectAll("circle").remove();

    dataSvg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .attr("fill", d => colorScale(d.category))
        .call(d3.drag().on("drag", dragged));  // Add drag behavior

    dataSvg.append("circle")
        .attr("cx", target.x)
        .attr("cy", target.y)
        .attr("r", 7)
        .attr("fill", "black")
        .call(d3.drag().on("drag", targetDragged)); // Add drag behavior to target

    const previousNeighborIndices = new Set(previousNeighbors.map(d => d.index));
    const currentNeighborIndices = new Set(neighbors.map(d => d.index));

    // Remove lines for points that are no longer neighbors
    previousNeighbors.forEach(n => {
        if (!currentNeighborIndices.has(n.index)) {
            d3.select(`#line-${n.index}`).remove();
        }
    });

    neighbors.forEach((n, i) => {
        if (!previousNeighborIndices.has(n.index)) {
            dataSvg.append("line")
                .attr("id", `line-${n.index}`)
                .attr("x1", target.x)
                .attr("y1", target.y)
                .attr("x2", n.x)
                .attr("y2", n.y)
                .attr("stroke", "black");
        } else {
            d3.select(`#line-${n.index}`)
                .attr("x2", n.x)
                .attr("y2", n.y);
        }
    });

    previousNeighbors = neighbors.map((n, i) => ({ ...n, index: i }));

    // Display counts in knnSvg
    knnSvg.append("text")
        .attr("x", 335)
        .attr("y", 20)
        .text(`Classification: ${predictedColorName}`);

    // Convert counts object to array of key-value pairs
    let countsArray = Object.keys(counts).map(category => [category, counts[category]]);

    // Sort array by counts in descending order
    countsArray.sort((a, b) => b[1] - a[1]);

    let y = 40;
    for (let [category, count] of countsArray) {
        const colorName = colorNames[Object.keys(colorNames)[category]];
        knnSvg.append("text")
            .attr("x", 335)
            .attr("y", y + 10)
            .text(`${colorName}: ${count}`);
        y += 20;
    }
}

// Drag event handler for data points
function dragged(event, d) {
    // Boundary check
    d.x = Math.max(0, Math.min(svgWidth, event.x));
    d.y = Math.max(0, Math.min(svgHeight, event.y));
    d3.select(this).attr("cx", d.x).attr("cy", d.y);
    updateVisualization();  // Update visualization on drag
    runKNN();  // Update K-NN visualization on drag
}

// Drag event handler for target point
function targetDragged(event) {
    // Boundary check
    target.x = Math.max(0, Math.min(svgWidth, event.x));
    target.y = Math.max(0, Math.min(svgHeight, event.y));
    d3.select(this).attr("cx", target.x).attr("cy", target.y);
    updateVisualization();  // Update visualization on drag
    runKNN();  // Update K-NN visualization on drag
}
