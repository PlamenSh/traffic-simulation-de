function san_stefano_traj_x_1(u) {
  return -u + 225;
}
function san_stefano_traj_y_1(u) {
  return -u * 0.25 - 170;
}

function san_stefano_traj_x_2(u) {
  return u + 17;
}
function san_stefano_traj_y_2(u) {
  return u * 0.25 - 230;
}

// id, length, laneWidth, laneCount, 
// traj_x, traj_y, 
// density, speedInit, fracTruck, isRing, userCanDistortRoads
var san_stefano_1 = new road('san_stefano_1', 210, 3, 2,
  san_stefano_traj_x_1, san_stefano_traj_y_1,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);
var san_stefano_2 = new road('san_stefano_2', 210, 3, 2,
  san_stefano_traj_x_2, san_stefano_traj_y_2,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);

network.push(san_stefano_1);
network.push(san_stefano_2);

streetCallbacks[san_stefano_1.roadID] = () => {
  san_stefano_1.updateLastLCtimes(dt);
  san_stefano_1.calcAccelerations();  
  san_stefano_1.changeLanes();         
  san_stefano_1.updateSpeedPositions();
  san_stefano_1.updateBCdown();
  san_stefano_1.updateBCup(qIn, dt);
}
streetCallbacks[san_stefano_2.roadID] = () => {
  san_stefano_2.updateLastLCtimes(dt);
  san_stefano_2.calcAccelerations();  
  san_stefano_2.changeLanes();         
  san_stefano_2.updateSpeedPositions();
  san_stefano_2.updateBCdown();
  san_stefano_2.updateBCup(qIn, dt);
}

