import * as THREE from 'three';

export const generateRandomPosition = (minDistance: number, maxDistance: number): THREE.Vector3 => {
  const theta = Math.random() * Math.PI * 2; // Random angle around the y-axis
  const phi = Math.acos((Math.random() * 2) - 1); // Random angle from the y-axis
  const distance = minDistance + Math.random() * (maxDistance - minDistance);
  
  const x = distance * Math.sin(phi) * Math.cos(theta);
  const y = distance * Math.sin(phi) * Math.sin(theta);
  const z = distance * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};