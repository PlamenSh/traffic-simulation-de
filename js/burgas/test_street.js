// def trajectories
// if(doGridding=true on constructing road, 
// road elements are gridded and internal
// road.traj_xy(u) are generated. Then, outer traj_xy*(u) obsolete
// and network[i].gridTrajectories(trajNet_x[i], trajNet_y[i]) called
// after a physical change
function traj_x(u) { // physical coordinates
  // left side (median), phys coordinates
  var dxPhysFromCenter = u < straightLen ? straightLen - u : 
                u > straightLen + arcLen ? u - mainroadLen + straightLen : 
                  -arcRadius * Math.sin((u - straightLen) / arcRadius);

  return center_xPhys + dxPhysFromCenter;
}

function traj_y(u){ // physical coordinates
  var dyPhysFromCenter = u < straightLen ? arcRadius : 
                u > straightLen + arcLen ? -arcRadius : 
                  arcRadius * Math.cos((u - straightLen) / arcRadius);

  return center_yPhys + dyPhysFromCenter;
}

function street_traj_x(u) { // physical coordinates
  // left side (median), phys coordinates
  var dxPhysFromCenter = u < straightLen ? straightLen - u : 
                u > straightLen + arcLen ? u - mainroadLen + straightLen : 
                  -arcRadius * Math.sin((u - straightLen) / arcRadius);

  return center_xPhys + dxPhysFromCenter;
}

function street_traj_y(u) { // physical coordinates
  var dyPhysFromCenter = u < straightLen ? arcRadius : 
                u > straightLen + arcLen ? -arcRadius : 
                  arcRadius * Math.cos((u - straightLen) / arcRadius);

  return 20 + center_yPhys + dyPhysFromCenter;
}



// !! in defining dependent geometry,
// do not refer to mainroad or onramp!! may not be defined: 
// mainroad.nLanes => nLanes_main, ramp.nLanes=>nLanes_ramp1

function trajRamp_x(u){ // physical coordinates
//var xMergeBegin=traj_x(mainroadLen-straightLen);
var xMergeBegin=traj_x(mainRampOffset+rampLen-mergeLen);
var xPrelim=xMergeBegin+(u-(rampLen-mergeLen));
return (u<rampLen-taperLen) 
? xPrelim : xPrelim-0.05*(u-rampLen+taperLen);
}

function trajRamp_y(u){ // physical coordinates

var yMergeBegin=traj_y(mainRampOffset+rampLen-mergeLen)
-0.5*laneWidth*(nLanes_main+nLanes_rmp)-0.02*laneWidth;

var yMergeEnd=yMergeBegin+laneWidth;
return (u<rampLen-mergeLen)
? yMergeBegin - 0.5*Math.pow(rampLen-mergeLen-u,2)/rampRadius
: (u<rampLen-taperLen) ? yMergeBegin
: yMergeBegin+taperMerge(u,taperLen,laneWidth,rampLen);
}

var street = new road(1, 600, 7, 3,
  street_traj_x, street_traj_y,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);

var mainroad = new road(1, mainroadLen, laneWidth, nLanes_main,
  traj_x, traj_y,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);

var ramp=new road(2,rampLen,laneWidth,nLanes_rmp,
trajRamp_x,trajRamp_y,
0*density, speedInit, fracTruck, isRing,userCanDistortRoads);

// road network (network declared in canvas_gui.js)
network.push(mainroad);
network.push(ramp);
network.push(street);

// ## Obstacle
var virtualStandingVeh = new vehicle(2, laneWidth, ramp.roadLen-0.9*taperLen, 0, 0, "obstacle");
ramp.veh.unshift(virtualStandingVeh);

// ## Waypoint speed detectors
detectors.push(new stationaryDetector(mainroad, 0.10 * mainroadLen, 10))
detectors.push(new stationaryDetector(mainroad, 0.60 * mainroadLen, 10))
detectors.push(new stationaryDetector(mainroad, 0.90 * mainroadLen, 10))