document.addEventListener('DOMContentLoaded', (event) => {
    const defaultOptions = {
        C: 1,
        tol: 1e-4,
        maxPasses: 10,
        maxIterations: 10000,
        kernel: 'linear',
        alphaTol: 1e-6,
        random: Math.random,
        whitening: true
    };

    class Kernel {
        constructor(type, options) {
            this.type = type;
            this.options = options;
        }

        compute(X) {
            if (this.type === 'linear') {
                return this.linear(X);
            }
        }

        linear(X) {
            const N = X.length;
            const kernelMatrix = Array(N).fill(0).map(() => Array(N).fill(0));
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    kernelMatrix[i][j] = this.dot(X[i], X[j]);
                }
            }
            return kernelMatrix;
        }

        dot(x1, x2) {
            let sum = 0;
            for (let i = 0; i < x1.length; i++) {
                sum += x1[i] * x2[i];
            }
            return sum;
        }
    }

    class SVM {
        constructor(options) {
            this.options = Object.assign({}, defaultOptions, options);
            this.kernel = new Kernel(this.options.kernel, this.options.kernelOptions);
            this.b = 0;
            this.W = null;
        }

        train(features, labels) {
            const { C, tol, maxPasses, maxIterations } = this.options;
            const N = labels.length;
            const D = features[0].length;
            let alphas = new Array(N).fill(0);
            let passes = 0;
            let iter = 0;
            this.b = 0;
            let kernelMatrix = this.kernel.compute(features);

            while (passes < maxPasses && iter < maxIterations) {
                let numChangedAlphas = 0;
                for (let i = 0; i < N; i++) {
                    const Ei = this._marginOnePrecomputed(i, kernelMatrix) - labels[i];
                    if ((labels[i] * Ei < -tol && alphas[i] < C) || (labels[i] * Ei > tol && alphas[i] > 0)) {
                        let j = i;
                        while (j === i) {
                            j = Math.floor(Math.random() * N);
                        }
                        const Ej = this._marginOnePrecomputed(j, kernelMatrix) - labels[j];
                        const oldAi = alphas[i];
                        const oldAj = alphas[j];
                        let L, H;
                        if (labels[i] !== labels[j]) {
                            L = Math.max(0, alphas[j] - alphas[i]);
                            H = Math.min(C, C + alphas[j] - alphas[i]);
                        } else {
                            L = Math.max(0, alphas[i] + alphas[j] - C);
                            H = Math.min(C, alphas[i] + alphas[j]);
                        }
                        if (L === H) continue;
                        const eta = 2 * kernelMatrix[i][j] - kernelMatrix[i][i] - kernelMatrix[j][j];
                        if (eta >= 0) continue;
                        alphas[j] -= (labels[j] * (Ei - Ej)) / eta;
                        if (alphas[j] > H) alphas[j] = H;
                        else if (alphas[j] < L) alphas[j] = L;
                        if (Math.abs(alphas[j] - oldAj) < 1e-5) continue;
                        alphas[i] += labels[i] * labels[j] * (oldAj - alphas[j]);
                        const b1 = this.b - Ei - labels[i] * (alphas[i] - oldAi) * kernelMatrix[i][i] - labels[j] * (alphas[j] - oldAj) * kernelMatrix[i][j];
                        const b2 = this.b - Ej - labels[i] * (alphas[i] - oldAi) * kernelMatrix[i][j] - labels[j] * (alphas[j] - oldAj) * kernelMatrix[j][j];
                        if (0 < alphas[i] && alphas[i] < C) {
                            this.b = b1;
                        } else if (0 < alphas[j] && alphas[j] < C) {
                            this.b = b2;
                        } else {
                            this.b = (b1 + b2) / 2;
                        }
                        numChangedAlphas++;
                    }
                }
                if (numChangedAlphas === 0) {
                    passes++;
                } else {
                    passes = 0;
                }
                iter++;
            }

            this.W = new Array(D).fill(0);
            for (let i = 0; i < N; i++) {
                for (let d = 0; d < D; d++) {
                    this.W[d] += alphas[i] * labels[i] * features[i][d];
                }
            }
        }

        predictOne(x) {
            return this.marginOne(x) >= 0 ? 1 : -1;
        }

        predict(features) {
            if (Array.isArray(features[0])) {
                return features.map(x => this.predictOne(x));
            } else {
                return this.predictOne(features);
            }
        }

        marginOne(x) {
            return this.W.reduce((sum, w_i, i) => sum + w_i * x[i], 0) + this.b;
        }

        _marginOnePrecomputed(i, kernelMatrix) {
            let sum = this.b;
            for (let j = 0; j < kernelMatrix.length; j++) {
                sum += kernelMatrix[i][j] * this.W[j];
            }
            return sum;
        }
    }

    document.getElementById('generateData').addEventListener('click', generateData);
    document.getElementById('runSVM').addEventListener('click', runSVM);

    let dataPoints = [];
    let features = [];
    let labels = [];

    function generateData() {
        const numPoints = +document.getElementById('numPoints').value;
        const clusterPercent = +document.getElementById('clusterPercent').value;
        const numCluster1 = Math.floor((clusterPercent / 100) * numPoints);
        const numCluster2 = numPoints - numCluster1;

        dataPoints = [];

        for (let i = 0; i < numCluster1; i++) {
            dataPoints.push({ x: Math.random() * 300, y: Math.random() * 200, cluster: 0 });
        }

        for (let i = 0; i < numCluster2; i++) {
            dataPoints.push({ x: Math.random() * 300 + 300, y: Math.random() * 200 + 200, cluster: 1 });
        }

        features = dataPoints.map(d => [d.x, d.y]);
        labels = dataPoints.map(d => d.cluster === 0 ? -1 : 1);

        updateVisualization(dataPoints);
    }

    function runSVM() {
        const kernelType = document.getElementById('kernel').value;
        const options = {
            kernel: kernelType
        };
        const svm = new SVM(options);

        svm.train(features, labels);
        drawDecisionBoundary(svm);
    }

    function updateVisualization(dataPoints) {
        const svg = d3.select('#dataViz');
        svg.selectAll('*').remove();

        const width = +svg.attr('width');
        const height = +svg.attr('height');

        svg.selectAll('circle')
            .data(dataPoints)
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 5)
            .attr('fill', d => d.cluster === 0 ? 'orange' : 'purple')
            .call(d3.drag().on('drag', function (event, d) {
                d3.select(this)
                    .attr('cx', d.x = Math.max(0, Math.min(width, event.x)))
                    .attr('cy', d.y = Math.max(0, Math.min(height, event.y)));
                updateFeaturesAndLabels();
            }));
    }

    function updateFeaturesAndLabels() {
        features = dataPoints.map(d => [d.x, d.y]);
        labels = dataPoints.map(d => d.cluster === 0 ? -1 : 1);
    }

    function drawDecisionBoundary(svm) {
        const svg = d3.select('#dataViz');
        const width = +svg.attr('width');
        const height = +svg.attr('height');

        if (svm.options.kernel === 'linear' && svm.W) {
            const w = svm.W;
            const b = svm.b;

            const x1 = 0;
            const y1 = (-b - w[0] * x1) / w[1];
            const x2 = width;
            const y2 = (-b - w[0] * x2) / w[1];

            svg.append('line')
                .attr('x1', x1)
                .attr('y1', y1)
                .attr('x2', x2)
                .attr('y2', y2)
                .attr('stroke', 'black')
                .attr('stroke-width', 2);
        } else {
            console.log('Non-linear kernel or weights not available');
        }
    }
});
