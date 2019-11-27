function san_stefano_traj_x(u) {
  return -u + 225;
}

function san_stefano_traj_y(u) {
  return -u * 0.25 - 170;
}

// id, length, laneWidth, laneCount, 
// traj_x, traj_y, 
// density, speedInit, fracTruck, isRing, userCanDistortRoads
var san_stefano_1 = new road('san_stefano_1', 210, 3, 2,
  san_stefano_traj_x, san_stefano_traj_y,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);

network.push(san_stefano_1);

streetCallbacks[san_stefano_1.roadID] = () => {
  san_stefano_1.updateLastLCtimes(dt);
  san_stefano_1.calcAccelerations();  
  san_stefano_1.changeLanes();         
  san_stefano_1.updateSpeedPositions();
  san_stefano_1.updateBCdown();
  san_stefano_1.updateBCup(qIn, dt);
}

