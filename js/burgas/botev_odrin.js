function botev_odrin_traj_x_1(u) {
  return u < 52 ? (u + 70) : u * 0.3 + 106.4;
}
function botev_odrin_traj_y_1(u) {
  return u < 52 ? (-u * 0.6 - 158) : -u - 137.2;
}

function botev_odrin_traj_x_2(u) {
  return u < 215 ? (-u * 0.3 + 193) : (-u + 343.5);
}
function botev_odrin_traj_y_2(u) {
  return u < 215 ? (u - 400) : (u * 0.6 - 314);
}

// id, length, laneWidth, laneCount, 
// traj_x, traj_y, 
// density, speedInit, fracTruck, isRing, userCanDistortRoads
var botev_odrin_1 = new road('botev_odrin_1', 260, 3, 2,
  botev_odrin_traj_x_1, botev_odrin_traj_y_1,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);
var botev_odrin_2 = new road('botev_odrin_2', 270, 3, 2,
  botev_odrin_traj_x_2, botev_odrin_traj_y_2,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);

network.push(botev_odrin_1);
network.push(botev_odrin_2);

streetCallbacks[botev_odrin_1.roadID] = () => {
  botev_odrin_1.updateLastLCtimes(dt);
  botev_odrin_1.calcAccelerations();  
  botev_odrin_1.changeLanes();         
  botev_odrin_1.updateSpeedPositions();
  botev_odrin_1.updateBCdown();
  botev_odrin_1.updateBCup(qIn, dt);
}
streetCallbacks[botev_odrin_2.roadID] = () => {
  botev_odrin_2.updateLastLCtimes(dt);
  botev_odrin_2.calcAccelerations();  
  botev_odrin_2.changeLanes();         
  botev_odrin_2.updateSpeedPositions();
  botev_odrin_2.updateBCdown();
  botev_odrin_2.updateBCup(qIn, dt);
}

