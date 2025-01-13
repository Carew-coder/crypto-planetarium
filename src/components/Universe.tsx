import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Planet {
  id: string;
  name: string;
  value: number;
  color: string;
  size: number;
  position: [number, number, number];
}

const generateRandomPosition = (existingPositions: [number, number, number][]): [number, number, number] => {
  const MIN_DISTANCE = 5; // Minimum distance between planets
  const MAX_ATTEMPTS = 50; // Maximum attempts to find a valid position
  let attempts = 0;
  while (attempts < MAX_ATTEMPTS) {
    const radius = 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    const position: [number, number, number] = [x, y, z];
    
    // Check distance from all existing positions
    const isTooClose = existingPositions.some(existingPos => {
      const dx = existingPos[0] - x;
      const dy = existingPos[1] - y;
      const dz = existingPos[2] - z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance < MIN_DISTANCE;
    });
    
    if (!isTooClose || attempts === MAX_ATTEMPTS - 1) {
      return position;
    }
    
    attempts++;
  }
  
  // If we couldn't find a good position after MAX_ATTEMPTS, return a position further out
  const fallbackRadius = 50 + Math.random() * 20;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  
  return [
    fallbackRadius * Math.sin(phi) * Math.cos(theta),
    fallbackRadius * Math.sin(phi) * Math.sin(theta),
    fallbackRadius * Math.cos(phi)
  ];
};

const generateRandomColor = () => {
  const colors = [
    '#8B5CF6', // Vivid Purple
    '#D946EF', // Magenta Pink
    '#F97316', // Bright Orange
    '#0EA5E9', // Ocean Blue
    '#10B981', // Emerald
    '#EF4444', // Red
  ];
  return colors[Math.floor(Math.random() * colors.length)];
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

// Keep track of existing positions
const existingPositions: [number, number, number][] = SAMPLE_PLANETS.map(p => p.position);

// Generate additional planets with collision detection
for (let i = 0; i < 500; i++) {
  const position = generateRandomPosition(existingPositions);
  existingPositions.push(position);
  
  SAMPLE_PLANETS.push({
    id: `planet-${i}`,
    name: `${CRYPTO_NAMES[i % CRYPTO_NAMES.length]} ${Math.floor(i / CRYPTO_NAMES.length) + 1}`,
    value: Math.random() * 1000,
    color: generateRandomColor(),
    size: 0.3 + Math.random() * 1.2,
    position: position,
  });
}

const PLANET_TEXTURES = [
  '/lovable-uploads/98244a61-a143-42a1-bc04-7400b789f28f.png',  // Red swirl
  '/lovable-uploads/07940f47-fc24-4197-ba10-be4390f882b2.png',  // Red neon
  '/lovable-uploads/f115cbf1-f4ec-4c06-9d95-2a208ce87fa6.png',  // Blue swirl
  '/lovable-uploads/0a36d67b-b2b3-4558-aad4-6665abaca922.png',  // Blue neon
  '/lovable-uploads/b6686ee5-c2dd-4297-8768-e92bc549f292.png',  // Purple swirl
  '/lovable-uploads/49044724-9c56-41a2-b893-71327d58e78f.png',  // Earth-like
  '/lovable-uploads/df9118f7-30aa-4077-ad6b-7e7d6ec1e835.png',  // Colorful terrain
  '/lovable-uploads/454d5495-aee2-4eaa-b3a1-49e4cf51f279.png',  // Green waves
  '/lovable-uploads/1a9e1fee-d80e-4855-86e9-9fe6b4a730db.png',  // Orange waves
];

const Universe = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const planetsRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const sunRef = useRef<THREE.Mesh | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());
  const loadedTexturesRef = useRef<{ [key: string]: THREE.Texture }>({});
  const { toast } = useToast();
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [initialCameraPosition] = useState(new THREE.Vector3(0, 0, 100));
  const [isLoading, setIsLoading] = useState(true);
  const [showTables, setShowTables] = useState(false);

  // Preload textures
  const preloadTextures = async () => {
    const texturePromises = PLANET_TEXTURES.map((texturePath) => {
      return new Promise<void>((resolve) => {
        textureLoaderRef.current.load(
          texturePath,
          (texture) => {
            loadedTexturesRef.current[texturePath] = texture;
            resolve();
          },
          undefined,
          () => resolve() // Continue even if texture fails to load
        );
      });
    });

    await Promise.all(texturePromises);
  };

  // Add planets in batches
  const addPlanetsInBatches = (scene: THREE.Scene, planets: typeof SAMPLE_PLANETS) => {
    const BATCH_SIZE = 50;
    let currentIndex = 0;

    const addBatch = () => {
      const endIndex = Math.min(currentIndex + BATCH_SIZE, planets.length);
      const batch = planets.slice(currentIndex, endIndex);

      batch.forEach((planet, index) => {
        const absoluteIndex = currentIndex + index;
        const textureIndex = absoluteIndex % PLANET_TEXTURES.length;
        const texturePath = PLANET_TEXTURES[textureIndex];
        const texture = loadedTexturesRef.current[texturePath];

        const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.3,
          roughness: 0.4,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...planet.position);
        scene.add(mesh);
        planetsRef.current[planet.id] = mesh;
      });

      currentIndex = endIndex;

      if (currentIndex < planets.length) {
        // Schedule next batch
        setTimeout(addBatch, 100);
      } else {
        setIsLoading(false);
      }
    };

    addBatch();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera setup with optimized near and far planes
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        500
      );
      camera.position.z = 100;
      cameraRef.current = camera;

      // Renderer setup with optimized parameters
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Controls setup
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Add sun
      const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
      const sunMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5,
        metalness: 0,
        roughness: 0.5,
      });
      const sun = new THREE.Mesh(sunGeometry, sunMaterial);
      scene.add(sun);
      sunRef.current = sun;

      // Preload textures before adding planets
      await preloadTextures();
      
      // Add planets in batches
      addPlanetsInBatches(scene, SAMPLE_PLANETS);

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

      // Basic lighting setup
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

        // Rotate sun
        if (sunRef.current) {
          sunRef.current.rotation.y += 0.001;
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
            setShowTables(true);
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
            setShowTables(true);
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
    };

    init();

  }, []);

  const handleBackToOverview = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    setIsZoomedIn(false);
    setShowTables(false);
    
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

      {showTables && (
        <div className="absolute top-20 inset-x-4 flex gap-4">
          {/* Holder Information Table */}
          <Card className="w-1/2 bg-space-lighter/80 text-white border-white/10">
            <CardHeader>
              <CardTitle>Holder Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/80">Address</TableHead>
                    <TableHead className="text-white/80">Balance</TableHead>
                    <TableHead className="text-white/80">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-white/70">0x1234...5678</TableCell>
                    <TableCell className="text-white/70">1,000,000</TableCell>
                    <TableCell className="text-white/70">10%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-white/70">0x8765...4321</TableCell>
                    <TableCell className="text-white/70">500,000</TableCell>
                    <TableCell className="text-white/70">5%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Rewards Table */}
          <Card className="w-1/2 bg-space-lighter/80 text-white border-white/10">
            <CardHeader>
              <CardTitle>Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/80">Type</TableHead>
                    <TableHead className="text-white/80">Amount</TableHead>
                    <TableHead className="text-white/80">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-white/70">Staking</TableCell>
                    <TableCell className="text-white/70">100</TableCell>
                    <TableCell className="text-white/70">Claimable</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-white/70">Trading</TableCell>
                    <TableCell className="text-white/70">50</TableCell>
                    <TableCell className="text-white/70">Pending</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-[40px] w-[40px] before:content-[''] before:absolute before:top-0 before:left-0 before:h-full before:w-full before:rounded-full before:bg-white before:animate-[pulse_1.75s_ease-in-out_infinite] before:scale-0 before:transition-colors before:ease-in-out before:duration-300 after:content-[''] after:absolute after:top-0 after:left-0 after:h-full after:w-full after:rounded-full after:bg-white after:animate-[pulse_1.75s_ease-in-out_infinite] after:scale-0 after:transition-colors after:ease-in-out after:duration-300 after:delay-[calc(1.75s/-2)]" />
        </div>
      )}
    </div>
  );
};

export default Universe;
