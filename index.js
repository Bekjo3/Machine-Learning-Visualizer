document.getElementById("knnRadio").addEventListener("change", updateVisualizer);
document.getElementById("svmRadio").addEventListener("change", updateVisualizer);

function updateVisualizer() {
    const visualizer = document.getElementById("visualizer");
    const description = document.getElementById("description");

    if (document.getElementById("knnRadio").checked) {
        visualizer.src = "knn.html";
        description.innerText = "This visualizer allows you to generate random data points and run the K-Nearest Neighbors (K-NN) algorithm to classify a target point. You can move points around to see how the nearest neighbors change in real-time.";
    } else if (document.getElementById("svmRadio").checked) {
        visualizer.src = "svm.html";
        description.innerText = "This visualizer allows you to generate random data points and run the Support Vector Machine (SVM) algorithm to classify a target point. You can move points around to see how the separating hyperplane changes in real-time.";
    }
}

document.getElementById("toggleDescription").addEventListener("click", function() {
    const content = document.getElementById("descriptionContent");
    if (content.style.display === "block") {
        content.style.display = "none";
    } else {
        content.style.display = "block";
    }
});

document.getElementById("learnAboutProject").addEventListener("click", function() {
    const content = document.getElementById("descriptionContent");
    content.style.display = content.style.display === "block" ? "none" : "block";
});