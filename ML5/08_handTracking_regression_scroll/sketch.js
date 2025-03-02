// Hand Regressor.
// Uses https://unpkg.com/ml5@1/dist/ml5.js

let handPose;
let video;
let hands = [];
let handTrackOptions = { maxHands: 1, flipHorizontal: true };

// Interface
let dataButton;
let dataLabel;
let trainButton;

const N_LANDMARKS = 21;
let sampleCount = 0;
let bTrainingCompleted = false;
let theResults;
let brain;
let trainingData = [];

let posX;

let img;
let allImages = [];
let totalImages = 9;
let index = 0; //global declare to display first image. 

//----------------------------------------------------
const neuralNetworkOptions = {
  task: "regression",
  debug: true,
};

//------------------------------------------
function preload() {
  // Load the handpose model.
  handPose = ml5.handPose(handTrackOptions);
  
  //load your images.For ease name all your images in sequence and named 0.jpg, 1.jpg, 2.jpg, etc. etc so we can iterate through the filenames easily with a for loop. Check if you are loading jpg or png!
  
  // img = loadImage("0.png");
  
// Populate the array with images!
  for (let i = 0; i < totalImages; i++) { //load up to totalImage amount. 
    allImages[i] = loadImage(i + ".png"); 
  }
}
function gotHands(results) {
  // Callback function for when handPose outputs data.
  // Save the output to the hands variable
  hands = results;
}

//------------------------------------------
function setup() {
  let myCanvas = createCanvas(640, 480);
  myCanvas.position(0, 0);

  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // ML5 handPose: detect hands from the webcam video
  handPose.detectStart(video, gotHands);

  // ML5 Neural Net:
  ml5.setBackend("webgl");

  trainButton = createButton("Train model");
  trainButton.mousePressed(trainModelFunction);
  trainButton.position(520, 35);
  trainButton.size(80, 40);

  // Create the model.
  let options = {
    inputs: N_LANDMARKS * 2,
    outputs: 1,
    task: "regression",
    debug: true,
  };
  brain = ml5.neuralNetwork(options);
}

//------------------------------------------
function draw() {
  // Draw the webcam video
  background("white");
  drawVideoBackground();
  drawHandPoints();

  if (bTrainingCompleted) {
    doRegression();  
  }
  drawResults();
  
  //if we have results (something trained)
  if(theResults && theResults.length > 0){
       //use the prediction and training values to move a shape 
	fill(255,0,0);
    
	rect(posX, 200, 50, 50);
    
    //use posX to control other things
    // depending on what you control you may need to map it differently on line 175
    
    //mouse movement 
  index = round(map(posX, 0, width, 0, totalImages-1));

  //draw the image at the index number to the canvas
 image(allImages[index], 0, 0);
}



}

//------------------------------------------
function keyPressed() {
  if (key == " ") {
    addTrainingExample();
  }
}

//------------------------------------------
// Add a training example
function addTrainingExample() {
  let inputs = getInputData();
  if (inputs && inputs.length > 0) {
    let target = map(mouseX, 0, width, 0, 1);
    brain.addData(inputs, [target]);
    sampleCount++;
  }
}

//------------------------------------------
// Train the model
function trainModelFunction() {
  brain.normalizeData();
  let options = {
    epochs: 30,
  };
  brain.train(options, finishedTrainingCallback);
  bTrainingCompleted = true;
}

//------------------------------------------
// Begin prediction
function finishedTrainingCallback() {
  print("Finished Training");
}

//------------------------------------------
function doRegression() {
  if (bTrainingCompleted) {
    let freshInput = getInputData();
    if (freshInput) {
      brain.predict([freshInput], (results, err) => {
        if (err) {
          console.log(err);
          return;
        }
        theResults = results;
      });
    }
  }
}

//------------------------------------------
function drawResults() {
  stroke("black");
  fill("lightgray");
  rect(0, 0, width, 110);
  fill("white");
  rect(0, 0, width, 20);

  fill("black");
  noStroke();
  textAlign(LEFT);
  let ty = 20;
  text(
    "Step 1: Create a fist, set training value to 0 with mouse, press Space to add samples.",
    10,
    (ty += 15)
  );
  text(
    "Step 2: Open palm, set training value to 1 with mouse, press Space to add samples.",
    10,
    (ty += 15)
  );
  text("Sample count = " + sampleCount, 10, (ty += 15));

  // theResults[i].confidence;

  if (bTrainingCompleted) {
    if (theResults && theResults.length > 0) {
      let prediction = theResults[0].value; // 0...1
      let px = map(prediction, 0, 1, 0, width);
      posX = px; //assign px to posX variable to be used in draw loop.
      
      fill("black");
      rect(px, 0, 3, 20);
      if (prediction < 0.5) {
        textAlign(LEFT);
        text("prediction val: " + nf(prediction, 1, 3), px + 5, 15);
      } else {
        textAlign(RIGHT);
        text("prediction val: " + nf(prediction, 1, 3), px - 5, 15);
      }
    }
  } 
  
  else {
    let trainingValue = map(mouseX, 0, width, 0, 1);
    let px = map(trainingValue, 0, 1, 0, width);

    fill("black");
    rect(px, 0, 3, 20);
    if (trainingValue < 0.5) {
      textAlign(LEFT);
      text("training val: " + nf(trainingValue, 1, 3), px + 5, 15);
    } else {
      textAlign(RIGHT);
      text("training val: " + nf(trainingValue, 1, 3), px - 5, 15);
    }
  }
}

//------------------------------------------
function drawHandPoints() {
  // Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      stroke("black");
      fill("red");
      strokeWeight(1);
      circle(keypoint.x, keypoint.y, 10);
    }
  }
}

//------------------------------------------
function getInputData() {
  // Copy the hand data into a normalized format for the brain.
  if (hands.length > 0) {
    const landmarkData = [];
    var firstHandIndex = 0;

    // Compute the centroid (averageX, averageY) of the hand
    var avgx = 0;
    var avgy = 0;
    for (var j = 0; j < N_LANDMARKS; j++) {
      let keypoint = hands[firstHandIndex].keypoints[j];
      avgx += keypoint.x;
      avgy += keypoint.y;
    }
    avgx /= N_LANDMARKS;
    avgy /= N_LANDMARKS;

    // Create a copy of the hand data--but subtract the centroid.
    // This way, we're not training on WHERE the hand is located!
    for (var j = 0; j < N_LANDMARKS; j++) {
      let keypoint = hands[firstHandIndex].keypoints[j];
      landmarkData.push(keypoint.x - avgx);
      landmarkData.push(keypoint.y - avgy);
    }
    return landmarkData;
  }
  return null;
}

//------------------------------------------
function drawVideoBackground() {
  push();
  if (handTrackOptions.flipHorizontal) {
    translate(width, 0);
    scale(-1, 1);
  }
  let opacity = 90; // reduce this to make video transparent
  tint(255, 255, 255, opacity);
  image(video, 0, 0, width, height);
  pop();
}
