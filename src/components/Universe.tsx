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
  surfaceDetail?: number; // 0-1 scale for bumpiness
  emissiveIntensity?: number; // For glowing planets like the sun
  roughness?: number; // For metallic/shiny surfaces
  metalness?: number; // For metallic surfaces
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
    id: "sun",
    name: "Solar",
    value: 50000,
    color: "#FFA500",
    size: 3,
    position: [0, 0, 0],
    emissiveIntensity: 0.8,
    roughness: 1,
    metalness: 0,
    surfaceDetail: 0.2
  },
  {
    id: "mercury",
    name: "Mercury",
    value: 2000,
    color: "#A0522D",
    size: 0.8,
    position: [8, 0, 0],
    roughness: 0.8,
    metalness: 0.2,
    surfaceDetail: 0.6
  },
  {
    id: "venus",
    name: "Venus",
    value: 3000,
    color: "#DEB887",
    size: 1.2,
    position: [-10, 2, 5],
    roughness: 0.7,
    metalness: 0.3,
    surfaceDetail: 0.4
  },
  {
    id: "earth",
    name: "Earth",
    value: 5000,
    color: "#4169E1",
    size: 1.3,
    position: [15, -3, -8],
    roughness: 0.6,
    metalness: 0.1,
    surfaceDetail: 0.5
  },
  {
    id: "mars",
    name: "Mars",
    value: 2500,
    color: "#CD853F",
    size: 1,
    position: [-18, 5, 12],
    roughness: 0.9,
    metalness: 0.1,
    surfaceDetail: 0.7
  }
];

// Generate additional planets with more realistic properties
for (let i = 0; i < 100; i++) {
  const randomRoughness = 0.3 + Math.random() * 0.7;
  const randomMetalness = Math.random() * 0.5;
  const randomSurfaceDetail = Math.random() * 0.8;
  
  SAMPLE_PLANETS.push({
    id: `planet-${i}`,
    name: `${CRYPTO_NAMES[i % CRYPTO_NAMES.length]} ${Math.floor(i / CRYPTO_NAMES.length) + 1}`,
    value: Math.random() * 1000,
    color: generateRandomColor(),
    size: 0.3 + Math.random() * 1.2,
    position: generateRandomPosition(),
    roughness: randomRoughness,
    metalness: randomMetalness,
    surfaceDetail: randomSurfaceDetail
  });
}

const Universe = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const planetsRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const { toast } = useToast();
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [initialCameraPosition] = useState(new THREE.Vector3(0, 0, 10));

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
    camera.position.z = 10;
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

    // Add stars
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

    // Add planets with enhanced materials
    SAMPLE_PLANETS.forEach((planet) => {
      const geometry = new THREE.SphereGeometry(planet.size, 64, 64); // Increased segments for more detail
      
      // Create displacement map for surface detail
      const displacementMap = new THREE.TextureLoader().load(
        `data:image/png;base64,${generateNoiseTexture(256, planet.surfaceDetail || 0)}`
      );

      const material = new THREE.MeshStandardMaterial({
        color: planet.color,
        roughness: planet.roughness || 0.7,
        metalness: planet.metalness || 0.3,
        displacementMap: displacementMap,
        displacementScale: 0.1,
        emissive: planet.color,
        emissiveIntensity: planet.emissiveIntensity || 0,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...planet.position);
      scene.add(mesh);
      planetsRef.current[planet.id] = mesh;

      // Enhanced glow effect
      if (planet.emissiveIntensity && planet.emissiveIntensity > 0) {
        const glowGeometry = new THREE.SphereGeometry(planet.size * 1.2, 64, 64);
        const glowMaterial = new THREE.ShaderMaterial({
          uniforms: {
            c: { value: 0.2 },
            p: { value: 4.5 },
            glowColor: { value: new THREE.Color(planet.color) },
          },
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 glowColor;
            uniform float c;
            uniform float p;
            varying vec3 vNormal;
            void main() {
              float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
              gl_FragColor = vec4(glowColor, intensity);
            }
          `,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true,
        });

        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.set(...planet.position);
        scene.add(glowMesh);
      }
    });

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xFFFFFF, 1.5);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate planets
      Object.values(planetsRef.current).forEach((planet) => {
        planet.rotation.y += 0.005;
      });

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

    // Handle planet click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current || !controlsRef.current) return;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, []);

  // Helper function to generate noise texture
  const generateNoiseTexture = (size: number, intensity: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(size, size);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const value = Math.floor(128 + (Math.random() - 0.5) * 255 * intensity);
      imageData.data[i] = value;
      imageData.data[i + 1] = value;
      imageData.data[i + 2] = value;
      imageData.data[i + 3] = 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL().split(',')[1];
  };

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