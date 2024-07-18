document.getElementById('generateData').addEventListener('click', generateData);
document.getElementById('runSVM').addEventListener('click', runSVM);

const svg = d3.select('#dataViz')
    .style('border', '1px solid black');

const width = +svg.attr('width');
const height = +svg.attr('height');
const padding = 20;  

let data = [];

function generateData() {
    // Clear the existing data and visualization
    data = [];
    svg.selectAll('*').remove();

    const numPoints = +document.getElementById('numPoints').value;
    const clusterPercent = +document.getElementById('clusterPercent').value;

    const clusterRadius = Math.min(width, height) / 3; // Increased radius for more spread
    const clusterCenters = [
        { x: padding + Math.random() * (width / 2 - 2 * padding), y: padding + Math.random() * (height - 2 * padding) },
        { x: (width / 2) + padding + Math.random() * (width / 2 - 2 * padding), y: padding + Math.random() * (height - 2 * padding) }
    ];

    for (let i = 0; i < numPoints; i++) {
        const clusterIndex = i < (numPoints * clusterPercent / 100) ? 0 : 1;
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * clusterRadius;
        const x = clusterCenters[clusterIndex].x + radius * Math.cos(angle);
        const y = clusterCenters[clusterIndex].y + radius * Math.sin(angle);

        data.push({
            x: Math.max(padding, Math.min(width - padding, x)),
            y: Math.max(padding, Math.min(height - padding, y)),
            label: clusterIndex
        });
    }

    updateVisualization();
}

function updateVisualization() {
    svg.selectAll('circle').remove(); 
    svg.selectAll('line').remove();   

    svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 5)
        .attr('fill', d => d.label === 0 ? 'orange' : 'purple')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));
}

function runSVM() {
    svg.selectAll('.boundary-line').remove(); 

    const features = data.map(d => [d.x / width, d.y / height]); // Normalize features
    const labels = data.map(d => d.label === 0 ? -1 : 1);

    const svm = new SVM({
        x: features,
        y: labels
    });

    svm.train();

    const weights = svm.getWeights();
    const bias = svm.getBias();

    // Calculate two points on the decision boundary
    const x1 = 0;
    const y1 = (-weights[0] * x1 - bias) / weights[1];
    const x2 = 1;
    const y2 = (-weights[0] * x2 - bias) / weights[1];

    // Draw the decision boundary
    svg.append('line')
        .attr('class', 'boundary-line')
        .attr('x1', x1 * width)
        .attr('y1', y1 * height)
        .attr('x2', x2 * width)
        .attr('y2', y2 * height)
        .attr('stroke', 'black')
        .attr('stroke-width', 2);

    // Update classification text
    const majorityLabel = data.filter(d => d.label === 0).length > data.length / 2 ? 'orange' : 'purple';
    d3.select('#classification').text(`Classification: ${majorityLabel}`);
}

function dragStarted(event, d) {
    d3.select(this).raise().attr('stroke', 'black');
    svg.selectAll('.boundary-line').remove(); 
}

function dragged(event, d) {
    d3.select(this)
        .attr('cx', d.x = Math.max(padding, Math.min(width - padding, event.x)))
        .attr('cy', d.y = Math.max(padding, Math.min(height - padding, event.y)));
}

function dragEnded(event, d) {
    d3.select(this).attr('stroke', null);
    runSVM(); 
}

class SVM {
    constructor(data) {
        this.x = data.x;
        this.y = data.y;
        this.w = [Math.random() - 0.5, Math.random() - 0.5];
        this.b = Math.random() - 0.5;
        this.learningRate = 0.01;
        this.iterations = 2000;
        this.C = 1.0; // Regularization parameter
    }

    train() {
        for (let iter = 0; iter < this.iterations; iter++) {
            let cost = 0;
            for (let i = 0; i < this.x.length; i++) {
                const xi = this.x[i];
                const yi = this.y[i];
                const prediction = this.w[0] * xi[0] + this.w[1] * xi[1] + this.b;
                const hinge_loss = Math.max(0, 1 - yi * prediction);
                cost += hinge_loss;
                
                if (hinge_loss > 0) {
                    this.w[0] += this.learningRate * (this.C * yi * xi[0] - 2 * 0.01 * this.w[0]);
                    this.w[1] += this.learningRate * (this.C * yi * xi[1] - 2 * 0.01 * this.w[1]);
                    this.b += this.learningRate * this.C * yi;
                } else {
                    this.w[0] -= this.learningRate * 2 * 0.01 * this.w[0];
                    this.w[1] -= this.learningRate * 2 * 0.01 * this.w[1];
                }
            }
            if (cost / this.x.length < 0.01) break; // Early stopping if cost is low
        }
    }

    getWeights() {
        return this.w;
    }

    getBias() {
        return this.b;
    }
}
