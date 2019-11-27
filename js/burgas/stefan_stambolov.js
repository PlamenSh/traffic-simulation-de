function stefan_stambolov_traj_x_1(u) {
  return u < 70 ? (u * 0.60 + 95) : (u * 0.30 + 116);
}
function stefan_stambolov_traj_y_1(u) {
  return -u - 10;//center_yPhys - u + 280;
}
function stefan_stambolov_traj_x_2(u) {
  return u < 105 ? (-u * 0.3 + 175) : (-u * 0.6 + 206.5);// < 70 ? (u * 0.60 + 95) : (u * 0.30 + 116);
}
function stefan_stambolov_traj_y_2(u) {
  return u - 181;//center_yPhys - u + 280;
}

// id, length, laneWidth, laneCount, 
// traj_x, traj_y, 
// density, speedInit, fracTruck, isRing, userCanDistortRoads
var stefan_stambolov_1 = new road('stefan_stambolov_1', 170, 3, 2,
  stefan_stambolov_traj_x_1, stefan_stambolov_traj_y_1,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);

var stefan_stambolov_2 = new road('stefan_stambolov_2', 175, 3, 2,
  stefan_stambolov_traj_x_2, stefan_stambolov_traj_y_2,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);

network.push(stefan_stambolov_1);
network.push(stefan_stambolov_2);

streetCallbacks[stefan_stambolov_1.roadID] = () => {
  stefan_stambolov_1.updateLastLCtimes(dt);
  stefan_stambolov_1.calcAccelerations();  
  stefan_stambolov_1.changeLanes();         
  stefan_stambolov_1.updateSpeedPositions();
  stefan_stambolov_1.updateBCdown();
  stefan_stambolov_1.updateBCup(qIn, dt);
}
streetCallbacks[stefan_stambolov_2.roadID] = () => {
  stefan_stambolov_2.updateLastLCtimes(dt);
  stefan_stambolov_2.calcAccelerations();  
  stefan_stambolov_2.changeLanes();         
  stefan_stambolov_2.updateSpeedPositions();
  stefan_stambolov_2.updateBCdown();
  stefan_stambolov_2.updateBCup(qIn, dt);
}