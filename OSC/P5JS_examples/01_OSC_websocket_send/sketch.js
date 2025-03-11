let r, g, b;

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
  textAlign(CENTER, CENTER);


}

function draw() {
  background(r, g, b);
  fill(0);
  text('test', 10, 10);
}



function mousePressed() {
  //console.log("click")
  r = random(255)
  g = random(255)
  b = random(255)
  oscPort.send({
    address: "/test",
    args: [r, g, b]
  });
}
