/*
 * 👋 Hello! This is an ml5.js example made and shared with ❤️.
 * Learn more about the ml5.js project: https://ml5js.org/
 * ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
 *
 * This example demonstrates tracking particular parts of the hand through ml5.handPose.
 */

let handPose;
let video;
let hands = [];

// A variable to track a pinch between thumb and index
let pinch = 0;

function preload() {
  // Load the handPose model
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(640, 480);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  // Start detecting hands from the webcam video
  handPose.detectStart(video, gotHands);
  	console.log('ml5 version:', ml5.version);
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

  // If there is a hand
  if (hands.length > 0) {
    // Find the index finger tip of hand 1
    let finger = hands[0].index_finger_tip;


    // Draw a circle at hand 1
    fill(0, 255, 0, 200);
    stroke(0);
    strokeWeight(2);
    circle(finger.x, finger.y, 50);
    

  
  }
}

// Callback function for when handPose outputs data
function gotHands(results) {
  // Save the output to the hands variable
  hands = results;
}
