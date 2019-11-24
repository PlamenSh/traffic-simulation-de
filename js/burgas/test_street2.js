function traj_x(u){ // physical coordinates
        var dxPhysFromCenter= // left side (median), phys coordinates
      (u<straightLen) ? straightLen-u
      : (u>straightLen+arcLen) ? u-mainroadLen+straightLen
      : -arcRadius*Math.sin((u-straightLen)/arcRadius);
      return center_xPhys+dxPhysFromCenter;
}

function traj_y(u){ // physical coordinates
        var dyPhysFromCenter=
      (u<straightLen) ? arcRadius
      : (u>straightLen+arcLen) ? -arcRadius
      : arcRadius*Math.cos((u-straightLen)/arcRadius);
      return center_yPhys+dyPhysFromCenter;
}

var street = new road(1, mainroadLen, laneWidth, nLanes_main,
              traj_x, traj_y,
              density, speedInit, fracTruck, isRing, userCanDistortRoads);

network.push(street);// road network (network declared in canvas_gui.js)

var streetUpdateCallback = () => {
  street.updateTruckFrac(fracTruck, fracTruckToleratedMismatch);
  street.updateModelsOfAllVehicles(longModelCar, longModelTruck, LCModelCar, LCModelTruck, LCModelMandatory);

  street.updateLastLCtimes(dt);
  street.calcAccelerations();  
  street.changeLanes();         
  street.updateSpeedPositions();
  street.updateBCdown();
  street.updateBCup(qIn, dt); // argument=total inflow
}

streetCallbacks.push(streetUpdateCallback);

var streetParams = {
  street: street,
  length: 3,
  xObs: center_xPhys,
  yObs: center_yPhys,
}
streetsParams.push(streetParams);


