let dragan_canvas;
let drg_contx;
let drg_imdData;
let drg_dragging = false;
let line_Width = 2; 
let drg_usingBrush = false;
let brushXPoints = new Array();
let brushYPoints = new Array();
let polygonSides = 6;
let selectedTool = 'brush';
let canvasWidth = 1200;
let canvasHeight = 1200;
let brushDownPos = new Array();
let shapesList = [];
let strokeColor = 'black';
let fillColor = 'black';
class ShapeBoundBox{
    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}
class MouseDwnLocation{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}
class Location{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}
 
class PolygonPoint{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}
let shapeBndBox = new ShapeBoundBox(0,0,0,0);
let mousedown = new MouseDwnLocation(0,0);
let loc = new Location(0,0);
 
document.addEventListener('DOMContentLoaded', setupCanvas);
 
function setupCanvas() {
    setupTools();
    setupCanvasProp();
    setupEvLstnrs();
}

function setupTools() {
    const tools = ["brush", "line", "rectangle", "circle", "ellipse", "polygon", "delete"];
    tools.forEach(tool => {
        document.getElementById(tool).addEventListener("click", () => ChangeTool(tool));
    });
}

function setupCanvasProp() {
    dragan_canvas = document.getElementById('my_canv');
    drg_contx = dragan_canvas.getContext('2d');
    drg_contx.strokeStyle = strokeColor;
    drg_contx.lineWidth = line_Width;
}

function setupEvLstnrs() {
    dragan_canvas.addEventListener("mousedown", ReactToMouseDown);
    dragan_canvas.addEventListener("mousemove", ReactToMouseMove);
    dragan_canvas.addEventListener("mouseup", ReactToMouseUp);
    
    document.getElementById("delete").addEventListener("click", DeleteCanvas);
    document.getElementById('colorPicker').addEventListener('input', changeStrokeColor);
    document.getElementById('lineWidthPicker').addEventListener('input', changeLineWidth);
    document.getElementById('bgColorPicker').addEventListener('input', changeBackgroundColor);
}

function changeStrokeColor() {
    drg_contx.strokeStyle = this.value;
    strokeColor = this.value;
}

function changeLineWidth() {
    drg_contx.lineWidth = this.value;
    line_Width = this.value;
}

function changeBackgroundColor() {
    dragan_canvas.style.backgroundColor = this.value;
}
function ChangeTool(toolClicked) {
    const tools = ["brush", "line", "rectangle", "circle", "ellipse", "polygon", "delete"];
    tools.forEach(tool => {
        document.getElementById(tool).className = "";
    });

    document.getElementById(toolClicked).className = "selected";
    selectedTool = toolClicked;
}

function getElementBoundingBox(startX, startY, endX, endY) {
    let leftPosition = Math.min(startX, endX);
    let topPosition = Math.min(startY, endY);
    let boxWidth = Math.abs(endX - startX);
    let boxHeight = Math.abs(endY - startY);
    return new ShapeBoundBox(leftPosition, topPosition, boxWidth, boxHeight);
}

function drg_GetMousePosition(mouseX,mouseY){
    let canvasRect = dragan_canvas.getBoundingClientRect();
    let xPos = (mouseX - canvasRect.left) * (dragan_canvas.width / canvasRect.width);
    let yPos = (mouseY - canvasRect.top) * (dragan_canvas.height / canvasRect.height);
    return { x: xPos, y: yPos };
}
function updateBandSize(loc){
    let width = Math.abs(loc.x - mousedown.x);
    let height = Math.abs(loc.y - mousedown.y);

    let left = (loc.x > mousedown.x) ? mousedown.x : loc.x;
    let top = (loc.y > mousedown.y) ? mousedown.y : loc.y;

    shapeBndBox.width = width;
    shapeBndBox.height = height;
    shapeBndBox.left = left;
    shapeBndBox.top = top;
}
function getAnglesFromXY(mouselocX, mouselocY){
   let adjacent = mousedown.x - mouselocX;
   let opposite = mousedown.y - mouselocY;

   return convertRadiansToDegrees(Math.atan2(opposite, adjacent));
}
function salvareCanv(){
    drg_imdData=drg_contx.getImageData(0,0,dragan_canvas.width,dragan_canvas.height);
}
function redesenareCanv(){
    drg_contx.putImageData(drg_imdData,0,0);
}

function downloadImage() {
    let format = document.getElementById('download-format').value;
    switch (format) {
        case 'png':
            downloadAsPNG();
            break;
        case 'svg':
            downloadAsSVG();
            break;
    }
}
function downloadAsPNG() {
    var imgFile = document.createElement('a');
    imgFile.setAttribute('download', 'image.png');
    imgFile.setAttribute('href', dragan_canvas.toDataURL());
    imgFile.click();
}
function convertRadiansToDegrees(radians){
    if(radians < 0){
        return (360.0+(radians*(180/Math.PI))).toFixed(2);
    } else {
        return (radians*(180/Math.PI)).toFixed(2);
    }
}
function convertDegreesToRadians(degrees){
    return degrees * (Math.PI / 180);
}

function getPolygPoints(){
    let angle =  convertDegreesToRadians(getAnglesFromXY(loc.x, loc.y));
    let radiusX = shapeBndBox.width;
    let radiusY = shapeBndBox.height;
    let polygonPoints = [];
    for(let i = 0; i < polygonSides; i++){
        polygonPoints.push(new PolygonPoint(loc.x + radiusX * Math.sin(angle),
        loc.y - radiusY * Math.cos(angle)));
        angle += 2 * Math.PI / polygonSides;
    }
    return polygonPoints;
}
 
function getPolygon(){
    let polPoints = getPolygPoints();
    drg_contx.beginPath();
    drg_contx.moveTo(polPoints[0].x, polPoints[0].y);
    for(let i = 1; i <polygonSides; i++){
        drg_contx.lineTo(polPoints[i].x,polPoints[i].y);
    }
    drg_contx.closePath();
}
 
function drawSomeShape(loc){
    drg_contx.strokeStyle = strokeColor;
    drg_contx.fillStyle = fillColor;
    if (selectedTool === "brush") {
        drawWithBrush();
    } else {
     drg_contx.beginPath();
    if (selectedTool === "line") {
    drg_contx.moveTo(mousedown.x, mousedown.y);
          drg_contx.lineTo(loc.x, loc.y);
     } else if (selectedTool === "rectangle") {
          drg_contx.rect(shapeBndBox.left, shapeBndBox.top, shapeBndBox.width, shapeBndBox.height);
     } else if (selectedTool === "circle") {
          let radius = shapeBndBox.width;
            drg_contx.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2);
     } else if (selectedTool === "ellipse") {
           let radiusX = shapeBndBox.width / 2;
          let radiusY = shapeBndBox.height / 2;
       drg_contx.ellipse(mousedown.x, mousedown.y, radiusX, radiusY, Math.PI / 4, 0, Math.PI * 2);
      } else if (selectedTool === "polygon") {
        let points = getPolygPoints();
       drg_contx.moveTo(points[0].x, points[0].y);
       for (let i = 1; i < points.length; i++) {
       drg_contx.lineTo(points[i].x, points[i].y);
            }
           drg_contx.closePath();
      }
        drg_contx.stroke();
    }
}
 
function updateBandOnMove(loc){
    updateBandSize(loc);
    drawSomeShape(loc);
}
function addBrushPoint(x, y, mouseDown){
    brushXPoints.push(x);
    brushYPoints.push(y);
    brushDownPos.push(mouseDown);
}
function DeleteCanvas() {
    drg_contx.clearRect(0, 0, dragan_canvas.width, dragan_canvas.height);

    brushXPoints = [];
    brushYPoints = [];
    brushDownPos = [];

    salvareCanv();
}

function drawWithBrush(){
    for (let i = 1; i < brushXPoints.length; i++) {

     drg_contx.beginPath();
      if (brushDownPos[i]) {
          drg_contx.moveTo(brushXPoints[i - 1], brushYPoints[i - 1]);
      } else {
            drg_contx.moveTo(brushXPoints[i] - 1, brushYPoints[i]);
        }
        drg_contx.lineTo(brushXPoints[i], brushYPoints[i]);
      drg_contx.stroke();
    }
}
 
function ReactToMouseDown(e){
    dragan_canvas.style.cursor = "crosshair";
    loc = drg_GetMousePosition(e.clientX, e.clientY);
    salvareCanv();
    mousedown.x = loc.x;
    mousedown.y = loc.y;
    drg_dragging = true;
 
    if(selectedTool === 'brush'){
     drg_usingBrush = true;
        addBrushPoint(loc.x, loc.y);
    }
}; 
function ReactToMouseMove(e){
    dragan_canvas.style.cursor = "crosshair";
    loc = drg_GetMousePosition(e.clientX, e.clientY);
 
    if(selectedTool === 'brush' && drg_dragging && drg_usingBrush){
        if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight){
        addBrushPoint(loc.x, loc.y, true);
     }
       redesenareCanv();
       drawWithBrush();
    } else {
        if(drg_dragging){
        redesenareCanv();
       updateBandOnMove(loc);
       }
    }
}; 
function ReactToMouseUp(e){
    dragan_canvas.style.cursor = "default";
    loc = drg_GetMousePosition(e.clientX, e.clientY);
    redesenareCanv();
    updateBandOnMove(loc);
    drg_dragging = false;
    drg_usingBrush = false;
}
function salvareImg(){
var imageFile = document.getElementById("img_file");
    imageFile.setAttribute('download', 'image.png');
    imageFile.setAttribute('href', dragan_canvas.toDataURL());
}
