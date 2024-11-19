const container = document.querySelector("#container");
const fileInput = document.querySelector("#file-input");
let notificationsComplete = false;

async function loadTrainingData() {
  const labels = [
    "Magnus Carlsen",
    "J97",
    "Cristiano Ronaldo",
    "Mark Zuckerberg",
    "Elon Musk",
  ];

  const faceDescriptors = [];
  for (const label of labels) {
    const descriptors = [];
    for (let i = 1; i <= 5; i++) {
      const image = await faceapi.fetchImage(`./data/${label}/${i}.jpeg`);
      const detection = await faceapi
        .detectSingleFace(image)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection) {
        descriptors.push(detection.descriptor);
      } else {
        console.error(`Face not detected in ${label}/${i}.jpeg`);
      }
    }
    faceDescriptors.push(
      new faceapi.LabeledFaceDescriptors(label, descriptors)
    );
    Toastify({
      text: `Training completed for ${label}!`,
      gravity: "bottom",
      position: "left",
      duration: 3000,
      callback: () => {
        // Check if it's the last notification
        if (label === labels[labels.length - 1]) {
          notificationsComplete = true;
          enableUploadButton();
        }
      },
    }).showToast();
  }

  return faceDescriptors;
}


let faceMatcher;
async function init() {
  await Promise.all([
    faceapi.loadSsdMobilenetv1Model("./models"),
    faceapi.loadFaceRecognitionModel("./models"),
    faceapi.loadFaceLandmarkModel("./models"),
  ]);

  Toastify({
    text: "Recognition model loaded successfully!",
    gravity: "bottom",
    position: "left",
    duration: 3000
  }).showToast();

  const trainingData = await loadTrainingData();
  faceMatcher = new faceapi.FaceMatcher(trainingData, 0.65);

  console.log(faceMatcher);
  document.querySelector("#loading").remove();
}

init();

fileInput.addEventListener("change", async () => {
  const files = fileInput.files;

  const image = await faceapi.bufferToImage(files[0]);
  const canvas = faceapi.createCanvasFromMedia(image);

  container.innerHTML = "";
  container.append(image);
  container.append(canvas);

  const size = {
    width: image.width,
    height: image.height,
  };

  faceapi.matchDimensions(canvas, size);

  const detections = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withFaceDescriptors();
  const resizedDetections = faceapi.resizeResults(detections, size);

  for (const detection of resizedDetections) {
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
    const label = `${bestMatch.label} (${Math.round(
      bestMatch.distance * 100
    )}%)`;
    const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
      label: label,
    });
    drawBox.draw(canvas);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const audio = new Audio("./lofi.mp3");
  const playButton = document.getElementById("play-button");
  const stopButton = document.getElementById("stop-button");

  playButton.addEventListener("click", () => {
    audio.play();
    playButton.disabled = true;
    stopButton.disabled = false;
  });

  stopButton.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0; // Reset playback
    playButton.disabled = false;
    stopButton.disabled = true;
  });

  // Reset buttons when audio ends
  audio.addEventListener("ended", () => {
    playButton.disabled = false;
    stopButton.disabled = true;
  });
});

function enableUploadButton() {
  const uploadButton = document.querySelector("#custom-file-input");
  const fileInput = document.querySelector("#file-input");
  uploadButton.classList.remove("disabled");
  uploadButton.style.backgroundColor = "#007bff";
  fileInput.disabled = false;
}