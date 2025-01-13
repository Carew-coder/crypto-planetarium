import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!holders || holders.length === 0) {
      console.log('No holders data available for planet creation');
      return;
    }

    console.log(`Creating ${holders.length} planets...`);

    // Clear existing planets from the scene
    Object.values(planetsRef.current).forEach(planet => {
      scene.remove(planet);
    });
    planetsRef.current = {};
    planetPositionsRef.current = {};

    const existingPositions: [number, number, number][] = [];

    holders.forEach((holder, index) => {
      if (!holder.wallet_address) {
        console.warn('Holder missing wallet address, skipping planet creation');
        return;
      }

      const textureIndex = index % PLANET_TEXTURES.length;
      const texturePath = PLANET_TEXTURES[textureIndex];
      const texture = loadedTextures[texturePath];

      if (!texture) {
        console.error(`Texture not found for path: ${texturePath}`);
        return;
      }

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

    console.log(`Created ${Object.keys(planetsRef.current).length} planets successfully`);
    onPlanetsCreated(planetsRef.current, planetPositionsRef.current);

    // Cleanup function
    return () => {
      Object.values(planetsRef.current).forEach(planet => {
        scene.remove(planet);
      });
    };
  }, [holders, scene, loadedTextures, onPlanetsCreated]);

  return null;
};

export default PlanetSystem;