// ## not sure !?
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

// ## Road / Vehicle sizes
var laneWidth = 7; // remains constant => road becomes more compact for smaller
// var laneWidthRamp=5; // main lanewidth used
var car_length = 7; // car length in m
var car_width = 5; // car width in m
var truck_length = 15; // trucks
var truck_width = 7; 

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

var isRing = false;  // 0: false; 1: true
var fracTruckToleratedMismatch=1.0; // 100% allowed=>changes only by sources
var speedInit=20; // IC for speed
// last arg = doGridding (true: user can change road geometry)

var time = 0;
var itime = 0;
var fps = 30;
var dt = timewarp / fps;

var drawBackground=true; // if false, default unicolor background
var drawRoad=true; // if false, only vehicles are drawn
var userCanvasManip; // true only if user-driven geometry changes

var vmin_col=0; // min speed for speed colormap (drawn in red)
var vmax_col=100/3.6; // max speed for speed colormap (drawn in blue-violet)

// ## end of 'not sure'


// ## Model initialization (models and methods defined in control_gui.js)
updateModels(); // defines longModelCar,-Truck,LCModelCar,-Truck,-Mandatory

// ## Init road images
roadImgs1 = []; // road with lane separating line
roadImgs2 = []; // road without lane separating line

for (var i = 0; i < 4; i++) {
    roadImgs1[i] = new Image();
    roadImgs1[i].src = "figs/road" + (i + 1) + "lanesCropWith.png"
    roadImgs2[i] = new Image();
    roadImgs2[i].src = "figs/road" + (i + 1) + "lanesCropWithout.png"
}

roadImg1 = new Image();
roadImg1 = roadImgs1[2];
roadImg2 = new Image();
roadImg2 = roadImgs2[2];

rampImg = new Image();
rampImg = roadImgs1[0];

// ## Init background image
var background = new Image();
background.src ='figs/backgroundGrass.jpg'; 

// ## Init vehicle image(s)
carImg = new Image();
carImg.src = 'figs/blackCarCropped.gif';
truckImg = new Image();
truckImg.src = 'figs/truck1Small.png';

// ## Init traffic light images
// TODO r those needed?
traffLightRedImg = new Image();
traffLightRedImg.src='figs/trafficLightRed_affine.png';
traffLightGreenImg = new Image();
traffLightGreenImg.src='figs/trafficLightGreen_affine.png';

// ## ...
obstacleImgNames = []; // srcFiles[0]='figs/obstacleImg.png'
obstacleImgs = []; // srcFiles[0]='figs/obstacleImg.png'
for (var i=0; i<10; i++){
  obstacleImgs[i]=new Image();
  obstacleImgs[i].src = (i==0)
    ? "figs/obstacleImg.png"
    : "figs/constructionVeh"+(i)+".png";
  obstacleImgNames[i] = obstacleImgs[i].src;
}

// ## Traffic objects
var trafficLights = 0;
var trafficLimitters = 0;
var trafficPositionX = 0.6;
var trafficPositionY = 0.6;
var trafficPanelRows = 0;
var trafficPanelCols = 0;
var trafficObjs = new TrafficObjects(canvas, trafficLights, trafficLimitters, trafficPositionX, trafficPositionY, trafficPanelRows, trafficPanelCols);

// ## Street waypoint speed detectors
var detectors = [];
// detectors.push(new stationaryDetector(mainroad, 0.10 * mainroadLen, 10))
// detectors.push(new stationaryDetector(mainroad, 0.60 * mainroadLen, 10))
// detectors.push(new stationaryDetector(mainroad, 0.90 * mainroadLen, 10))

// ## Used in updateSim to update street params
var streetCallbacks = [];

// ## Used in drawSim to update street params
var streetsParams = [];

function updateDimensions() { // if viewport or sizePhys changed
    refSizePhys=(isSmartphone) ? 150 : 250; // also adapt in definition above
    refSizePix=Math.min(canvas.height,canvas.width/critAspectRatio);
    scale=refSizePix/refSizePhys;
    
    center_xPhys=center_xRel*refSizePhys; //[m]
    center_yPhys=center_yRel*refSizePhys;
  
    if (hasChangedPhys) {
      arcRadius=arcRadiusRel*refSizePhys;
      arcLen=arcRadius*Math.PI;
      straightLen=refSizePhys*critAspectRatio-center_xPhys;
      mainroadLen=mainroad.roadLen=arcLen+2*straightLen; //xxxnew
      rampLen=ramp.roadLen=rampLenRel*refSizePhys; //xxxnew
      mergeLen=0.5*rampLen;
      mainRampOffset=mainroadLen-straightLen+mergeLen-rampLen;
      taperLen=0.2*rampLen;
      rampRadius=4*arcRadius;
  
      // xxxnew bring traj to roads 
      // not needed if doGridding is false since then external traj reference
      if (userCanDistortRoads) {
        network.forEach(netItem => netItem.gridTrajectories(trajNet_x[i], trajNet_y[i]));
      }
    
      // update positions of fixed obstacles to new road lengths/geometry
      // (e.g. onramp: ramp via the ref virtualStandingVeh)
      // see "Specification of logical road network" below
      virtualStandingVeh.u = ramp.roadLen - 0.9 * taperLen; //xxxnew
    }
    
    if(true){
      console.log("updateDimensions: mainroadLen=",mainroadLen,
          " isSmartphone=",isSmartphone, 
          " hasChangedPhys=",hasChangedPhys);
    }
  }

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


function updateSim() {
  time += dt; // dt depends on timewarp slider (fps=const)
  itime++;

  if (canvas.width != simDivWindow.clientWidth || canvas.height != simDivWindow.clientHeight) {
    hasChanged = true;
    canvas.width = simDivWindow.clientWidth;
    canvas.height = simDivWindow.clientHeight;

    if (isSmartphone != mqSmartphone()) {
      isSmartphone = mqSmartphone();
      hasChangedPhys = true;
    }

    updateDimensions(); // updates refsizePhys, -Pix, scale, geometry
 
    trafficObjs.calcDepotPositions(canvas);
  }

  // ## Update streets
  streetCallbacks.forEach(callback => callback());
 
  // (2a) update moveable speed limits
  network.forEach(netItem => netItem.updateSpeedlimits(trafficObjs));
  // mainroad.veh.filter(mainroadVeh => mainroadVeh.speed < 0).forEach(mainroadVeh => console.error("speed " + mainroadVeh.speed + " of mainroad vehicle is negative!"));

  // (4) update detector readings
  detectors.forEach(detector => detector.update(time, dt));

  //  (5) without this zoomback cmd, everything works but depot vehicles
  // just stay where they have been dropped outside of a road
  if(userCanDropObjects && !isSmartphone && !trafficObjPicked) {
    trafficObjs.zoomBack();
  }
}



function drawSim() {
  var movingObserver = false;
  var uObs = 0;//0 * time;

  var relTextsize_vmin=(isSmartphone) ? 0.03 : 0.02;
  var textsize = relTextsize_vmin * Math.min(canvas.width, canvas.height);

  // (2) reset transform matrix and draw background
  // (only needed if no explicit road drawn)
  ctx.setTransform(1,0,0,1,0,0);
  if (drawBackground) {
    if (hasChanged || itime <= 2 || itime == 10 || itime == 20 || userCanvasManip || movingObserver || !drawRoad) {
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }
  }

  // (3) draw mainroad and ramp
  // (always drawn; changedGeometry only triggers making a new lookup table)

  //!! all args at and after umin,umax=0,ramp.roadLen are optional
  // here only example for complete args (only in coffeemeterGame relevant

  var changedGeometry = true;//userCanvasManip || hasChanged || itime <= 1 || true; 

  // ramp.draw(rampImg, rampImg, scale, changedGeometry,
  //     0, ramp.roadLen,
  //     movingObserver, 0,
  //     center_xPhys - mainroad.traj_x(uObs) + ramp.traj_x(0),
  //     center_yPhys - mainroad.traj_y(uObs) + ramp.traj_y(0)); 

  // mainroad.draw(roadImg1,roadImg2,scale,changedGeometry,
  //   0,mainroad.roadLen,
  //   movingObserver,uObs,center_xPhys,center_yPhys);

  // streetsParams.forEach(streetData => {
  //   streetData.street.draw(roadImg1, roadImg2, scale, changedGeometry,
  //     0, streetData.length,
  //     movingObserver, uObs, streetData.xObs, streetData.yObs);

  //   streetData.street.drawVehicles(carImg, truckImg, obstacleImgs, scale,
  //     vmin_col, vmax_col,
  //     0, streetData.length,
  //     movingObserver, uObs, streetData.xObs, streetData.yObs);  
  // }); 

  // (4) draw vehicles
  //!! all args at and after umin,umax=0,ramp.roadLen are optional

  // ramp.drawVehicles(carImg, truckImg, obstacleImgs, scale,
  //       vmin_col, vmax_col,
  //       0, ramp.roadLen,
  //       movingObserver, 0,
  //       center_xPhys - mainroad.traj_x(uObs) + ramp.traj_x(0),
  //       center_yPhys - mainroad.traj_y(uObs) + ramp.traj_y(0));

  // mainroad.drawVehicles(carImg,truckImg,obstacleImgs,scale,
  //     vmin_col,vmax_col,
  //     0, mainroad.roadLen,
  //     movingObserver,uObs,center_xPhys,center_yPhys);

  // (5a) draw traffic objects 

  if(userCanDropObjects&&(!isSmartphone)){
    trafficObjs.draw(scale);
  }

  // (5b) draw speedlimit-change select box
  ctx.setTransform(1,0,0,1,0,0); 
  drawSpeedlBox();

  // (6) show simulation time and detector displays
  // ## Waypoint detectors
  displayTime(time,textsize);
  detectors.forEach(detector => detector.display(textsize));

  // may be set to true in next step if changed canvas 
  // (updateDimensions) or if old sign should be wiped away 
  hasChanged = false;
  hasChangedPhys = false; //xxxnew

  // revert to neutral transformation at the end!
  ctx.setTransform(1,0,0,1,0,0);
}

function main_loop() {
  updateSim();
  drawSim();
  userCanvasManip = false;
}

var myRun = setInterval(main_loop, 1000 / fps);



var lastLogTime = 0;
function timelog(msg) {
  let now = Date.now();
  if (now - lastLogTime > 1000) {
    lastLogTime = now;
    console.error(msg)
  }
}