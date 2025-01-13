import React, { useEffect } from 'react';
import * as THREE from 'three';
import { SUN_TEXTURE } from '@/constants/planets';

interface SceneSetupProps {
  scene: THREE.Scene;
  textureLoader: THREE.TextureLoader;
  onSunCreated: (sun: THREE.Mesh) => void;
}

const SceneSetup: React.FC<SceneSetupProps> = ({ 
  scene, 
  textureLoader,
  onSunCreated 
}) => {
  useEffect(() => {
    // Add sun
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunTexture = textureLoader.load(SUN_TEXTURE);
    const sunMaterial = new THREE.MeshStandardMaterial({
      map: sunTexture,
      emissive: 0xffa500,
      emissiveIntensity: 0.5,
      metalness: 0,
      roughness: 0.7,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    onSunCreated(sun);

    // Add background stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.1,
    });

    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    scene.add(hemisphereLight);

    return () => {
      scene.remove(sun, stars, ambientLight, pointLight, hemisphereLight);
      sunGeometry.dispose();
      sunMaterial.dispose();
      sunTexture.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
    };
  }, [scene, textureLoader, onSunCreated]);

  return null;
};

export default SceneSetup;