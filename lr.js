document.getElementById('generateData').addEventListener('click', generateData);
document.getElementById('runLR').addEventListener('click', runLinearRegression);
document.querySelectorAll('input[name="view"]').forEach((elem) => {
    elem.addEventListener('change', updateVisualization);
});

const svg = d3.select('#dataViz');
const width = +svg.attr('width');
const height = +svg.attr('height');
const margin = { top: 20, right: 30, bottom: 30, left: 40 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

let data = [];
let line = null;

const xScale = d3.scaleLinear().domain([0, plotWidth]).range([0, plotWidth]);
const yScale = d3.scaleLinear().domain([0, plotHeight]).range([plotHeight, 0]);

const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

const plotArea = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);


plotArea.append('rect')
    .attr('width', plotWidth)
    .attr('height', plotHeight)
    .attr('fill', 'none')
    .attr('stroke', '#999')  
    .attr('stroke-width', 1);  

plotArea.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${plotHeight})`)
    .call(xAxis);

plotArea.append('g')
    .attr('class', 'y-axis')
    .call(yAxis);

function generateData() {
    const numPoints = +document.getElementById('numPoints').value;
    data = [];

    for (let i = 0; i < numPoints; i++) {
        const x = (i / numPoints) * plotWidth;
        const y = plotHeight - (x + (Math.random() * plotHeight * 0.6 - plotHeight * 0.3));
        data.push({ x, y: Math.max(0, Math.min(plotHeight, y)) });
    }

    line = null;
    updateVisualization();
}

function updateVisualization() {
    plotArea.selectAll('circle').remove();
    plotArea.selectAll('path').remove();
    plotArea.selectAll('line.error').remove();

    plotArea.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 5)
        .attr('fill', 'black')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    updateRegressionLine();
}

function updateRegressionLine() {
    if (line) {
        plotArea.selectAll('path').remove();
        plotArea.selectAll('line.error').remove();

        const lineFunction = d3.line()
            .x(d => d.x)
            .y(d => line.slope * d.x + line.intercept);

        plotArea.append('path')
            .datum([{ x: 0 }, { x: plotWidth }])
            .attr('d', lineFunction)
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        const view = document.querySelector('input[name="view"]:checked').value;

        if (view !== 'none') {
            plotArea.selectAll('line.error')
                .data(data)
                .enter()
                .append('line')
                .attr('class', 'error')
                .attr('x1', d => d.x)
                .attr('y1', d => d.y)
                .attr('x2', d => d.x)
                .attr('y2', d => line.slope * d.x + line.intercept)
                .attr('stroke', 'red')
                .attr('stroke-width', 1);
        }
    }
}

function runLinearRegression() {
    const xMean = d3.mean(data, d => d.x);
    const yMean = d3.mean(data, d => d.y);

    const numerator = d3.sum(data, d => (d.x - xMean) * (d.y - yMean));
    const denominator = d3.sum(data, d => Math.pow(d.x - xMean, 2));

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    line = { slope, intercept };
    updateRegressionLine();
}

function dragstarted(event, d) {
    d3.select(this).raise().attr('stroke', 'black');
}

function dragged(event, d) {
    d.x = Math.max(0, Math.min(plotWidth, event.x));
    d.y = Math.max(0, Math.min(plotHeight, event.y));
    d3.select(this)
        .attr('cx', d.x)
        .attr('cy', d.y);
    
    runLinearRegression();
    updateRegressionLine();
}

function dragended(event, d) {
    d3.select(this).attr('stroke', null);
}