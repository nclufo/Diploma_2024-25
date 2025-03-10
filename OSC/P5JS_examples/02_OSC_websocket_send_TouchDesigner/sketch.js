let promptInput, slider;
//place holder values
let prompts = " a fancy banana"
let seed = 4000;
let textVal, sliderVal;

const oscPort = new osc.WebSocketPort({
  url: 'ws://localhost:8081',
});

oscPort.on('message', (msg) => {
  console.log('message', msg);
});
oscPort.on('close', () => { });

oscPort.open();

oscPort.socket.onmessage = function (e) {
  console.log('message', e);
};

function setup() {
  createCanvas(400, 400);
  textSize(20);
  textAlign(LEFT, TOP);

  // Setup the prompt input field
  createElement('p', 'Type your prompt and hit enter to send:').position(20, 0);
  promptInput = createInput();
  promptInput.position(20, 50);
  promptInput.size(350, 100);

  //Setup seed slider
  createElement('p', 'Move the slider:').position(20, 150);
  slider = createSlider(0, 5000, 0, 0);
  slider.position(20, 200);
  slider.size(360);
  slider.value(seed);
  slider.addClass("slider")

  //update canvas
  promptInput.input(updateText);
  slider.input(updateSlider);

  textSize(16)
  fill(255, 0, 0)
}

function draw() {
  //store slider.value in seed variable
  seed = slider.value();
  //store prompt.value in prompts variable
  prompts = promptInput.value();

  background(160);
  fill(0);
  text(sliderVal, 20, 250);
  text(textVal, 20, 280);
}


//only updates on change
function updateSlider() {
  sliderVal = slider.value()
  oscPort.send({
    address: "/slider",
    args: [seed]
  });
}

function updateText() {
  textVal = promptInput.value()

}

function keyPressed() {
  if (keyCode === ENTER) {
    console.log('enter')
    oscPort.send({
      address: "/prompt",
      args: [prompts]
    });
  }
}
function mousePressed() {
  //use to debug
  // oscPort.send({
  //   address: "/control",
  //   args: [prompts, seed]
  // });
}
