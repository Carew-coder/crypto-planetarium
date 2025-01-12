import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Planet {
  id: string;
  name: string;
  value: number;
  color: string;
  size: number;
  position: [number, number, number];
}

const generateRandomPosition = (): [number, number, number] => {
  const radius = 50; // Maximum radius from center
  const theta = Math.random() * Math.PI * 2; // Random angle around Y axis
  const phi = Math.acos((Math.random() * 2) - 1); // Random angle from Y axis
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  
  return [x, y, z];
};

const generateRandomColor = () => {
  return `#${Math.floor(Math.random()*16777215).toString(16)}`;
};

const CRYPTO_NAMES = [
  "Bitcoin", "Ethereum", "Solana", "Cardano", "Polkadot", "Avalanche", "Chainlink",
  "Polygon", "Cosmos", "Near", "Fantom", "Harmony", "Algorand", "Tezos", "VeChain",
  "Hedera", "Elrond", "Zilliqa", "Icon", "Waves"
];

const SAMPLE_PLANETS: Planet[] = [
  {
    id: "btc",
    name: "Bitcoin",
    value: 45000,
    color: "#F7931A",
    size: 2,
    position: [-15, 5, -10],
  },
  {
    id: "eth",
    name: "Ethereum",
    value: 2500,
    color: "#627EEA",
    size: 1.5,
    position: [20, -8, 15],
  },
  {
    id: "sol",
    name: "Solana",
    value: 100,
    color: "#00FFA3",
    size: 1,
    position: [12, 15, -18],
  },
];

// Generate 100 additional planets instead of 2000
for (let i = 0; i < 100; i++) {
  SAMPLE_PLANETS.push({
    id: `planet-${i}`,
    name: `${CRYPTO_NAMES[i % CRYPTO_NAMES.length]} ${Math.floor(i / CRYPTO_NAMES.length) + 1}`,
    value: Math.random() * 1000,
    color: generateRandomColor(),
    size: 0.3 + Math.random() * 1.2, // Random size between 0.3 and 1.5
    position: generateRandomPosition(),
  });
}

const Universe = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const planetsRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const sunRef = useRef<THREE.Mesh | null>(null);
  const { toast } = useToast();
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [initialCameraPosition] = useState(new THREE.Vector3(0, 0, 100));

  const handleBackToOverview = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    setIsZoomedIn(false);
    
    let progress = 0;
    const animate = () => {
      progress += 0.02;
      if (progress > 1) return;

      const newPos = cameraRef.current!.position.clone().lerp(initialCameraPosition, progress);
      cameraRef.current!.position.copy(newPos);
      controlsRef.current!.target.copy(new THREE.Vector3(0, 0, 0));
      controlsRef.current!.update();

      requestAnimationFrame(animate);
    };

    animate();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 100;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Add sun in the center
    const textureLoader = new THREE.TextureLoader();
    const sunTexture = textureLoader.load('/lovable-uploads/74d9ee71-8684-4b15-9d2f-6111aa04dfb9.png');
    
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
      map: sunTexture,
      metalness: 0,
      roughness: 0.5,
      emissive: new THREE.Color(0xff6b00),
      emissiveIntensity: 0.5,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0);
    scene.add(sun);
    sunRef.current = sun;

    // Add sun glow effect using point light
    const sunGlow = new THREE.PointLight(0xff6b00, 2, 50);
    sunGlow.position.set(0, 0, 0);
    scene.add(sunGlow);

    // Add ambient glow using a larger sphere
    const glowGeometry = new THREE.SphereGeometry(5.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6b00,
      transparent: true,
      opacity: 0.15,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // Planet textures array
    const planetTextures = [
      '/lovable-uploads/a347d8b1-3d2a-4005-8bd0-7f502e2757d9.png',  // Mars
      '/lovable-uploads/143c45be-81e7-4bc9-8c02-5b5d749b901a.png',  // Blue planet
      '/lovable-uploads/f10e0ae1-80f3-4282-bfd4-adf428c266c0.png',  // Venus
      '/lovable-uploads/47867400-645f-4a61-adea-7da70fa41000.png',  // Mercury
      '/lovable-uploads/2628cfea-a949-4819-adb1-c3c393bb68d4.png',  // Gas giant
      '/lovable-uploads/fe74738f-e4cb-410c-bdc2-49e0c9f0e59d.png',  // Ice planet
    ];

    // Add planets with distributed textures
    SAMPLE_PLANETS.forEach((planet, index) => {
      const textureIndex = index % planetTextures.length; // Ensure even distribution
      const planetTexture = textureLoader.load(planetTextures[textureIndex]);
      
      const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        map: planetTexture,
        metalness: 0,
        roughness: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...planet.position);
      scene.add(mesh);
      planetsRef.current[planet.id] = mesh;
    });

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

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Add hemisphere light for better overall illumination
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    scene.add(hemisphereLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate planets
      Object.values(planetsRef.current).forEach((planet) => {
        planet.rotation.y += 0.005;
      });

      // Rotate sun and update glow
      if (sunRef.current) {
        sunRef.current.rotation.y += 0.001;
        glowMesh.rotation.y += 0.001;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Handle planet and sun click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current || !controlsRef.current) return;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // Check for sun click
      if (sunRef.current) {
        const sunIntersects = raycaster.intersectObject(sunRef.current);
        if (sunIntersects.length > 0) {
          setIsZoomedIn(true);
          const position = new THREE.Vector3(0, 0, 15); // Position slightly in front of the sun

          const currentPos = cameraRef.current.position.clone();
          let progress = 0;
          const animate = () => {
            progress += 0.02;
            if (progress > 1) {
              toast({
                title: "dev",
                description: "The central star of our universe",
              });
              return;
            }

            const newPos = currentPos.clone().lerp(position, progress);
            cameraRef.current!.position.copy(newPos);
            controlsRef.current!.target.copy(new THREE.Vector3(0, 0, 0));
            controlsRef.current!.update();

            requestAnimationFrame(animate);
          };

          animate();
          return;
        }
      }

      // Check for planet clicks
      const intersects = raycaster.intersectObjects(Object.values(planetsRef.current));
      if (intersects.length > 0) {
        const clickedPlanet = SAMPLE_PLANETS.find(
          (p) => planetsRef.current[p.id] === intersects[0].object
        );

        if (clickedPlanet) {
          setIsZoomedIn(true);
          const position = new THREE.Vector3(...clickedPlanet.position);
          position.z += 5;

          const currentPos = cameraRef.current.position.clone();
          let progress = 0;
          const animate = () => {
            progress += 0.02;
            if (progress > 1) {
              toast({
                title: clickedPlanet.name,
                description: `Current Value: $${clickedPlanet.value.toLocaleString()}`,
              });
              return;
            }

            const newPos = currentPos.clone().lerp(position, progress);
            cameraRef.current!.position.copy(newPos);
            controlsRef.current!.target.copy(new THREE.Vector3(...clickedPlanet.position));
            controlsRef.current!.update();

            requestAnimationFrame(animate);
          };

          animate();
        }
      }
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-screen" />
      {isZoomedIn && (
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 left-4 bg-space-lighter text-white hover:bg-space-accent/20"
          onClick={handleBackToOverview}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      )}
    </div>
  );
};

export default Universe;
