import React, { useRef } from 'react';
import * as THREE from 'three';
import { PLANET_TEXTURES, calculatePlanetSize } from '@/constants/planets';
import { generateRandomPosition } from '@/utils/positionUtils';

interface PlanetSystemProps {
  scene: THREE.Scene;
  holders: any[];
  loadedTextures: { [key: string]: THREE.Texture };
  onPlanetsCreated: (planets: { [key: string]: THREE.Mesh }, positions: { [key: string]: THREE.Vector3 }) => void;
}

const PlanetSystem: React.FC<PlanetSystemProps> = ({ 
  scene, 
  holders, 
  loadedTextures,
  onPlanetsCreated 
}) => {
  const planetsRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const planetPositionsRef = useRef<{ [key: string]: THREE.Vector3 }>({});

  React.useEffect(() => {
    if (!holders) return;

    const existingPositions: [number, number, number][] = [];

    holders.forEach((holder, index) => {
      const textureIndex = index % PLANET_TEXTURES.length;
      const texturePath = PLANET_TEXTURES[textureIndex];
      const texture = loadedTextures[texturePath];

      const size = calculatePlanetSize(holder.percentage);
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.3,
        roughness: 0.4,
      });

      const position = generateRandomPosition(existingPositions);
      existingPositions.push(position);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      scene.add(mesh);
      planetsRef.current[holder.wallet_address] = mesh;
      planetPositionsRef.current[holder.wallet_address] = mesh.position.clone();
    });

    onPlanetsCreated(planetsRef.current, planetPositionsRef.current);
  }, [holders, scene, loadedTextures, onPlanetsCreated]);

  return null;
};

export default PlanetSystem;