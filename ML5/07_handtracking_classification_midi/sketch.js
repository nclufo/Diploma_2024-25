// ROCK PAPER SCISSORS DETECTOR
// Train Rock, Paper, Scissors with ML5 handPose + p5
// Requires: https://unpkg.com/ml5@1/dist/ml5.js
// Documentation: https://docs.ml5js.org/#/reference/handpose
// Documentation: https://docs.ml5js.org/#/reference/neural-network

let handPose;
let video;
let hands = [];
let poseOptions = { maxHands: 1, flipHorizontal: true, runtime: "mediapipe" };
let brain; // the neural network

// Interface
let dataLabelDropdown;
let dataButton;
let trainButton;

const N_LANDMARKS = 21;
const CATEGORIES = ["Rock", "Paper", "Scissors"];
let sampleCounts = [0, 0, 0];
let bTrainingCompleted = false;
let theResults;

//-----------------------------------------------
function preload() {
  // Load the handPose model.
  console.log("ml5 version:", ml5.version);
  ml5.setBackend("webgl");
  handPose = ml5.handPose(poseOptions);
}

//-----------------------------------------------
// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}

//-----------------------------------------------
function setup() {
  let myCanvas = createCanvas(640, 480);
  myCanvas.position(0, 0);

  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // start detecting hands from the webcam video
  handPose.detectStart(video, gotHands);

  // Make some buttons and UI elements
  dataLabelDropdown = createSelect();
  for (let i = 0; i < CATEGORIES.length; i++) {
    dataLabelDropdown.option(CATEGORIES[i]);
  }
  dataLabelDropdown.position(320, 35);
  dataLabelDropdown.size(80, 40);

  dataButton = createButton("Add example");
  dataButton.mousePressed(addExampleFunction);
  dataButton.position(420, 35);
  dataButton.size(80, 40);

  trainButton = createButton("Train model");
  trainButton.mousePressed(trainModelFunction);
  trainButton.position(520, 35);
  trainButton.size(80, 40);

  // Create the neural network model.
  let neuralNetworkOptions = {
    inputs: N_LANDMARKS * 2,
    outputs: CATEGORIES.length,
    task: "classification",
    debug: true,
  };
  brain = ml5.neuralNetwork(neuralNetworkOptions);

  ////
  //Adding MIDI functionality
  ////

  WebMidi.enable()
    .then(onEnabled)
    .catch((err) => alert(err));
}

//-----------------------------------------------
function draw() {
  background(255);

  drawVideo();
  drawHands();
  if (bTrainingCompleted) {
    classify();
  }

  //do something with results
  if (theResults) {
    //print all results
    //console.log(theResults[0].label);

    //important lines!!!!
    if (theResults[0].label == "Rock") {
      //chnage MIDI velocity
      sendMidiControlChange(1, 80);
      //if you want to change a specific note it looks like this:
      //play note
      // myOutput.playNote(61, 1, {duration: 1000, rawAttack: 100});

      console.log("Rock");
    } else if (theResults[0].label == "Paper") {
      //chnage MIDI velocity
      sendMidiControlChange(1, 100);
      console.log("Paper");
    } else if (theResults[0].label == "Scissors") {
      //chnage MIDI velocity
      sendMidiControlChange(1, 127);
      console.log("Scissors");
    }
  }

  drawResults();
}

//-----------------------------------------------
function drawVideo() {
  // Draw the webcam video
  push();
  if (poseOptions.flipHorizontal) {
    translate(width, 0);
    scale(-1, 1);
  }
  let transparency = 50; // reduce this to make video transparent
  tint(255, 255, 255, transparency);
  image(video, 0, 0, width, height);
  pop();
}

//-----------------------------------------------
function drawHands() {
  // Draw all the tracked hand points
  if (hands.length > 0) {
    let hand = hands[0];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      fill("red");
      stroke("black");
      circle(keypoint.x, keypoint.y, 10);
    }

    let whichHand = hand.handedness;
    let wx = hand.keypoints[0].x;
    let wy = hand.keypoints[0].y;
    noStroke();
    textSize(14);
    text(whichHand, wx, wy - 50);
  }
}

//------------------------------------------
function drawResults() {
  noStroke();
  fill("lightgray");
  rect(0, 0, width, 110);
  textSize(14);

  fill(0);
  text("press 'S' to save model after training stage", 320, 100);

  if (bTrainingCompleted) {
    if (theResults && theResults.length > 0) {
      for (let j = 0; j < CATEGORIES.length; j++) {
        let jthCategory = CATEGORIES[j];

        for (let i = 0; i < theResults.length; i++) {
          let ithLabel = theResults[i].label;
          if (ithLabel === jthCategory) {
            let ithConfidence = theResults[i].confidence;

            let str = ithLabel + ": ";
            str += nf(ithConfidence, 1, 2);
            fill("black");
            noStroke();
            text(str, 120, 25 + j * 30);

            stroke("black");
            fill("white");
            rect(10, 10 + j * 30, 100, 20);
            fill("darkgray");
            rect(10, 10 + j * 30, 100 * ithConfidence, 20);
          }
        }
      }
    }
  } else {
    for (let j = 0; j < CATEGORIES.length; j++) {
      let str = CATEGORIES[j] + " samples: " + sampleCounts[j];
      fill("black");
      noStroke();
      text(str, 10, 25 + j * 30);
    }
  }
}

//------------------------------------------
function getLandmarks() {
  // Reformat the landmarks, and center at an origin!
  // Instead of an array of keypoints[21][2]
  // the neural net wants an interleaved array, landmarks[21*2]
  if (hands.length > 0) {
    let hand0 = hands[0];

    // compute centroid of hand
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < N_LANDMARKS; i++) {
      let keypoint = hand0.keypoints[i];
      cx += keypoint.x;
      cy += keypoint.y;
    }
    cx /= N_LANDMARKS;
    cy /= N_LANDMARKS;

    // return hand data, centered on centroid.
    // This makes it work everywhere the hand appears.
    const landmarkData = [];
    for (let i = 0; i < N_LANDMARKS; i++) {
      let px = hand0.keypoints[i].x;
      let py = hand0.keypoints[i].y;
      landmarkData.push(px - cx);
      landmarkData.push(py - cy);
    }
    return landmarkData;
  }
  return null;
}

//------------------------------------------
// Add a training example
function addExampleFunction() {
  let inputs = getLandmarks();
  if (inputs && inputs.length > 0) {
    // Associate the current data with the current label
    let currentLabel = dataLabelDropdown.value();
    brain.addData(inputs, [currentLabel]);

    for (let i = 0; i < CATEGORIES.length; i++) {
      if (currentLabel === CATEGORIES[i]) {
        sampleCounts[i]++;
      }
    }
  }
}

//------------------------------------------
// Train the model
function trainModelFunction() {
  let bDataExistsForAllCategories = true;
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (sampleCounts[i] === 0) {
      bDataExistsForAllCategories = false;
    }
  }

  if (bDataExistsForAllCategories) {
    brain.normalizeData();
    let trainingOptions = {
      epochs: 32,
      batchSize: 12,
    };
    brain.train(trainingOptions, finishedTrainingCallback);
  } else {
    print("Make sure data exists for all categories");
  }
}

//------------------------------------------
// Begin prediction
function finishedTrainingCallback() {
  bTrainingCompleted = true;
  print("Finished Training");
}

//------------------------------------------
function classify() {
  if (bTrainingCompleted) {
    let inputs = getLandmarks();
    if (inputs && inputs.length > 0) {
      brain.classify(inputs, gotResultsCallback);
    }
  }
}

//------------------------------------------
function keyPressed() {
  if (key == "s") {
    //brain.saveData("myTrainingData.json");
    brain.save();
  }
}

//------------------------------------------
function gotResultsCallback(results, error) {
  if (error) {
    console.error(error);
    return;
  }
  if (results) {
    theResults = results;
    // print(results[0].label);
  }
}

//------------MIDI------------------------------
//this example changes velocity but look at the webMIDI reference for changing notes:

function onEnabled() {
  //WebMIDI Example Output Setup:

  console.log("WebMIDI Enabled");

  // Inputs
  WebMidi.inputs.forEach((input) =>
    console.log("Input: ", input.manufacturer, input.name)
  );

  // Outputs
  WebMidi.outputs.forEach((output) =>
    console.log("Output: ", output.manufacturer, output.name)
  );

  //Looking at the first output available to us
  console.log(WebMidi.outputs[0]);

  //assign that output as the one we will use later
  myOutput = WebMidi.outputs[0];
}

function sendMidiControlChange(ccNumber, ccValue) {
  if (myOutput) {
    myOutput.sendControlChange(ccNumber, ccValue); // Send CC number with value
    console.log(ccNumber, ccValue);
  }
}
