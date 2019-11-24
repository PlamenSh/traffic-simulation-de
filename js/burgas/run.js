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
 
  // (2) transfer effects from slider interaction and mandatory regions
  // to the vehicles and models
  mainroad.updateTruckFrac(fracTruck, fracTruckToleratedMismatch);
  mainroad.updateModelsOfAllVehicles(longModelCar, longModelTruck, LCModelCar, LCModelTruck, LCModelMandatory);
  // to the vehicles and models
  street.updateTruckFrac(fracTruck, fracTruckToleratedMismatch);
  street.updateModelsOfAllVehicles(longModelCar, longModelTruck, LCModelCar, LCModelTruck, LCModelMandatory);

  ramp.updateTruckFrac(fracTruck, fracTruckToleratedMismatch);
  ramp.updateModelsOfAllVehicles(longModelCar, longModelTruck, LCModelCar, LCModelTruck, LCModelMandatory);

  // (2a) update moveable speed limits
  network.forEach(netItem => netItem.updateSpeedlimits(trafficObjs));

  // (2b) externally impose mandatory LC behaviour
  // all ramp vehicles must change lanes to the left (last arg=false)
  ramp.setLCMandatory(0, ramp.roadLen, false);

  // (3) do central simulation update of vehicles
  mainroad.updateLastLCtimes(dt);
  mainroad.calcAccelerations();  
  mainroad.changeLanes();         
  mainroad.updateSpeedPositions();
  mainroad.updateBCdown();
  mainroad.updateBCup(qIn, dt); // argument=total inflow
  // (3) do central simulation update of vehicles
  street.updateLastLCtimes(dt);
  street.calcAccelerations();  
  street.changeLanes();         
  street.updateSpeedPositions();
  street.updateBCdown();
  street.updateBCup(qIn, dt); // argument=total inflow

  for (var i = 0; i < mainroad.nveh; i++) {
    if (mainroad.veh[i].speed < 0) {
        console.log(" speed " + mainroad.veh[i].speed + " of mainroad vehicle " + i + " is negative!");
    }
  }

  ramp.calcAccelerations();  
  ramp.updateSpeedPositions();
  //ramp.updateBCdown();
  ramp.updateBCup(qOn, dt); // argument=total inflow

  //template: road.mergeDiverge(newRoad,offset,uStart,uEnd,isMerge,toRight)
  ramp.mergeDiverge(mainroad, mainRampOffset, ramp.roadLen - mergeLen, ramp.roadLen, true, false);

  // (4) update detector readings
  detectors.forEach(detector => detector.update(time, dt));

  //  (5) without this zoomback cmd, everything works but depot vehicles
  // just stay where they have been dropped outside of a road
  if(userCanDropObjects && !isSmartphone && !trafficObjPicked) {
    trafficObjs.zoomBack();
  }
}

function drawSim() {

    //!! test relative motion isMoving

  var movingObserver=false;
  var uObs=0*time;

  //xxxnew [vieles nach updateSim]
  // (1) adapt text size
 
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

  var changedGeometry=userCanvasManip || hasChanged||(itime<=1)||true; 

  ramp.draw(rampImg,rampImg,scale,changedGeometry,
	    0,ramp.roadLen,
	    movingObserver,0,
	    center_xPhys-mainroad.traj_x(uObs)+ramp.traj_x(0),
	    center_yPhys-mainroad.traj_y(uObs)+ramp.traj_y(0)); 

  mainroad.draw(roadImg1,roadImg2,scale,changedGeometry,
		0,mainroad.roadLen,
		movingObserver,uObs,center_xPhys,center_yPhys);

  street.draw(roadImg1,roadImg2,scale,changedGeometry,
		0,mainroad.roadLen,
		movingObserver,uObs,center_xPhys,center_yPhys);
 
  // (4) draw vehicles
  //!! all args at and after umin,umax=0,ramp.roadLen are optional

  ramp.drawVehicles(carImg,truckImg,obstacleImgs,scale,
		    vmin_col,vmax_col,
		    0,ramp.roadLen,
		    movingObserver,0,
		    center_xPhys-mainroad.traj_x(uObs)+ramp.traj_x(0),
		    center_yPhys-mainroad.traj_y(uObs)+ramp.traj_y(0));


  mainroad.drawVehicles(carImg,truckImg,obstacleImgs,scale,
			vmin_col,vmax_col,
			0,mainroad.roadLen,
			movingObserver,uObs,center_xPhys,center_yPhys);

  street.drawVehicles(carImg,truckImg,obstacleImgs,scale,
			vmin_col,vmax_col,
			0,mainroad.roadLen,
			movingObserver,uObs,center_xPhys,center_yPhys);

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

console.log("first main execution");
showInfo();

var myRun = setInterval(main_loop, 1000 / fps);
