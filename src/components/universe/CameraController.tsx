import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface CameraControllerProps {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  initialPosition: THREE.Vector3;
  onControlsCreated: (controls: OrbitControls) => void;
}

const CameraController: React.FC<CameraControllerProps> = ({
  camera,
  renderer,
  initialPosition,
  onControlsCreated
}) => {
  useEffect(() => {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 200;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;

    onControlsCreated(controls);

    return () => {
      controls.dispose();
    };
  }, [camera, renderer, onControlsCreated]);

  return null;
};

export default CameraController;