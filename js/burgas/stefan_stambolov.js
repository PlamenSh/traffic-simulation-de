function stefan_stambolov_traj_x(u) {
  return u < 70 ? (u * 0.60 + 95) : (u * 0.30 + 116);
}

function stefan_stambolov_traj_y(u) {
  return -u - 10;//center_yPhys - u + 280;
}

// id, length, laneWidth, laneCount, 
// traj_x, traj_y, 
// density, speedInit, fracTruck, isRing, userCanDistortRoads
var stefan_stambolov_1 = new road('stefan_stambolov_1', 170, 3, 2,
  stefan_stambolov_traj_x, stefan_stambolov_traj_y,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);

network.push(stefan_stambolov_1);

streetCallbacks[stefan_stambolov_1.roadID] = () => {
  stefan_stambolov_1.updateLastLCtimes(dt);
  stefan_stambolov_1.calcAccelerations();  
  stefan_stambolov_1.changeLanes();         
  stefan_stambolov_1.updateSpeedPositions();
  stefan_stambolov_1.updateBCdown();
  stefan_stambolov_1.updateBCup(qIn, dt);
}