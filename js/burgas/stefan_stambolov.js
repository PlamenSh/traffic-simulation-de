function stefan_stambolov_traj_x(u) {
  // return center_xPhys - u + 700;
  return u * 0.4 + 100;
}

function stefan_stambolov_traj_y(u) {
  return -u - 10;//center_yPhys - u + 280;
}

// id, length, laneWidth, laneCount, 
// traj_x, traj_y, 
// density, speedInit, fracTruck, isRing, userCanDistortRoads
var stefan_stambolov_1 = new road('stefan_stambolov', 170, 3, 2,
  stefan_stambolov_traj_x, stefan_stambolov_traj_y,
  density, speedInit, fracTruck, isRing, userCanDistortRoads);

network.push(stefan_stambolov_1);
