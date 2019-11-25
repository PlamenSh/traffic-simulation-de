/* 
  Global overall scenario settings and graphics objects

 refSizePhys  => reference size in m (generally smaller side of canvas)
 refSizePix   => reference size in pixel (generally smaller side of canvas)
 scale = refSizePix/refSizePhys 
       => roads have full canvas regardless of refSizePhys, refSizePix

 (1) refSizePix=Math.min(canvas.width, canvas.height) determined during run  

 (2) refSizePhys smaller  => all phys roadlengths smaller
  => vehicles and road widths appear bigger for a given screen size 
  => chose smaller for mobile, 

  Example: refSizePhys propto sqrt(refSizePix) => roads get more compact 
  and vehicles get smaller, both on a sqrt basis

  Or jump at trigger refSizePix<canvasSizeCrit propto clientSize 
  => css cntrl normal/mobile with 2 fixed settings

  NOTICE: canvas has strange initialization of width=300 in firefox 
  and DOS when try sizing in css (see there) only 
*/

// override standard dettings control_gui.js
density = 0.02; 
var scenarioString="OnRamp"; // needed in handleDependencies in canvas_gui

var userCanDistortRoads=false;
var userCanDropObjects=true;
var nLanes_main=3;
var nLanes_rmp=1;

var simDivWindow=document.getElementById("contents");
var canvas = document.getElementById("canvas"); 
var ctx = canvas.getContext("2d"); // graphics context
canvas.width  = simDivWindow.clientWidth; 
canvas.height  = simDivWindow.clientHeight;


console.log("before addTouchListeners()");
addTouchListeners();
console.log("after addTouchListeners()");

// ## Road / Vehicle sizes
var laneWidth = 7; // remains constant => road becomes more compact for smaller
// var laneWidthRamp=5; // main lanewidth used
var car_length = 7; // car length in m
var car_width = 5; // car width in m
var truck_length = 15; // trucks
var truck_width = 7; 






//##################################################################
// init overall scaling (critAspectRatio should be consistent with 
// width/height in css.#contents)
//##################################################################

var isSmartphone = false;//mqSmartphone();

var refSizePhys=(isSmartphone) ? 150 : 250; // also adapt in updateDimensions

var critAspectRatio=120./95.; // from css file width/height of #contents

var refSizePix=Math.min(canvas.height,canvas.width/critAspectRatio);
var scale=refSizePix/refSizePhys;

//xxxnew [position]
var hasChanged=true; // window or physical dimensions have changed
var hasChangedPhys=true; // physical road dimensions have changed 
                          // in last updateDimensions
                          // (only true when switching from/to mobile version)


//xxxnew
//<NETWORK>
//##################################################################
// init Specification of physical road network geometry
// If viewport or refSizePhys changes => updateDimensions();
//##################################################################

// all relative "Rel" settings with respect to refSizePhys, not refSizePix!

var center_xRel = 0.30;//0.43
var center_yRel = -0.80;//-0.54
var arcRadiusRel = 0.15;//0.35;
var rampLenRel=0.95;


// xxxnew
// !!slight double-coding with updateDimensions unavoidable since
// updateDimensions needs roads (mainroad.roadLen ...) 
// which are not yet defined here

var center_xPhys = center_xRel * refSizePhys; //[m]
var center_yPhys = center_yRel * refSizePhys;

var arcRadius = arcRadiusRel * refSizePhys;
var arcLen=arcRadius*Math.PI;
var straightLen = refSizePhys * critAspectRatio - center_xPhys;
var mainroadLen = arcLen + 2 * straightLen;
var rampLen=rampLenRel*refSizePhys; 
var mergeLen=0.5*rampLen;
var mainRampOffset=mainroadLen-straightLen+mergeLen-rampLen;
var taperLen=0.2*rampLen;
var rampRadius=4*arcRadius;

/**
  general helper functions for tapering (i.e., first/last) 
  section of offramps/onramps.
  Gives (positive) lateral offset in direction of the road from/to which 
  this ramp diverges/merges 
  relative to the decisionpoint of last diverge/merge
  @param u: arclength of the ramp
  @param taperLen: length of the tapering section
  @param laneWidth: width of the ramp (only single-lane assumed)
  @param rampLen: total length of ramp (needed for onramps ony)
  @return: lateral offset in [0,laneWidth]
*/
function taperDiverge(u, taperLen, laneWidth) {
  var res = u < 0.5 * taperLen ? laneWidth * (1 - 2 * Math.pow(u / taperLen, 2)) :
                  u < taperLen ? 2 * laneWidth * Math.pow((taperLen - u) / taperLen, 2) : 0;
  return res;
}

function taperMerge(u, taperLen, laneWidth, rampLen) {
  return taperDiverge(rampLen - u, taperLen, laneWidth);
}



var isRing = false;  // 0: false; 1: true
var fracTruckToleratedMismatch=1.0; // 100% allowed=>changes only by sources
var speedInit=20; // IC for speed
// last arg = doGridding (true: user can change road geometry)

//userCanDistortRoads=true; //!! test  



// add standing virtual vehicle at the end of ramp (1 lane)
// prepending=unshift (strange name)



var detectors = [];

//</NETWORK>


//#########################################################
// model initialization (models and methods defined in control_gui.js)
//#########################################################
updateModels(); // defines longModelCar,-Truck,LCModelCar,-Truck,-Mandatory


//####################################################################
// Global graphics specification
//####################################################################
var drawBackground=true; // if false, default unicolor background
var drawRoad=true; // if false, only vehicles are drawn
var userCanvasManip; // true only if user-driven geometry changes

var vmin_col=0; // min speed for speed colormap (drawn in red)
var vmax_col=100/3.6; // max speed for speed colormap (drawn in blue-violet)
//####################################################################
// Images
//####################################################################

// init background image
var background = new Image();
background.src ='figs/SmallMammaMap.jpg'; 

// init vehicle image(s)
carImg = new Image();
carImg.src = 'figs/blackCarCropped.gif';
truckImg = new Image();
truckImg.src = 'figs/truck1Small.png';

// init traffic light images
traffLightRedImg = new Image();
traffLightRedImg.src='figs/trafficLightRed_affine.png';
traffLightGreenImg = new Image();
traffLightGreenImg.src='figs/trafficLightGreen_affine.png';

//define obstacle image names
obstacleImgNames = []; // srcFiles[0]='figs/obstacleImg.png'
obstacleImgs = []; // srcFiles[0]='figs/obstacleImg.png'
for (var i=0; i<10; i++){
  obstacleImgs[i]=new Image();
  obstacleImgs[i].src = (i==0)
    ? "figs/obstacleImg.png"
    : "figs/constructionVeh"+(i)+".png";
  obstacleImgNames[i] = obstacleImgs[i].src;
}

// ## Road images
roadImgs1 = []; // road with lane separating line
roadImgs2 = []; // road without lane separating line

for (var i = 0; i < 4; i++){
  roadImgs1[i] = new Image();
  roadImgs1[i].src="figs/road"+(i+1)+"lanesCropWith.png"
  roadImgs2[i] = new Image();
  roadImgs2[i].src="figs/road"+(i+1)+"lanesCropWithout.png"
}

roadImg1 = new Image();
roadImg1 = roadImgs1[nLanes_main - 1];
roadImg2 = new Image();
roadImg2 = roadImgs2[nLanes_main - 1];

// rampImg = new Image();
// rampImg = roadImgs1[nLanes_rmp - 1];
var rampImg = new Image();
var rampImg = roadImgs1[nLanes_rmp - 1];

// ## Traffic objects
var trafficLights = 0;
var limitters = 0;
var positionX = 0.6;
var positionY = 0.6;
var trafficObjPanelRows = 0;
var trafficObjPanelCols = 0;
var trafficObjs = new TrafficObjects(canvas, trafficLights, limitters, positionX, positionY, trafficObjPanelRows, trafficObjPanelCols);


//############################################
// run-time specification and functions
//############################################
var time = 0;
var itime = 0;
var fps = 30;
var dt = timewarp / fps;