import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import HolderTable from './universe/HolderTable';
import RewardsTable from './universe/RewardsTable';
import { SAMPLE_PLANETS, PLANET_TEXTURES, SUN_TEXTURE } from '@/constants/planets';
import { Planet } from '@/types/universe';

const Universe = ({ 
  onPlanetClick,
  onBackToOverview,
  backButtonText = "Back to Overview" // Added with default value
}: { 
  onPlanetClick: () => void;
  onBackToOverview: () => void;
  backButtonText?: string; // Added prop type definition
}) => {
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
  const [holderTableCollapsed, setHolderTableCollapsed] = useState(false);
  const [rewardsTableCollapsed, setRewardsTableCollapsed] = useState(false);

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
          () => resolve()
        );
      });
    });

    await Promise.all(texturePromises);
  };

  // Add planets in batches
  const addPlanetsInBatches = (scene: THREE.Scene, planets: Planet[]) => {
    planets.forEach((planet, index) => {
      const textureIndex = index % PLANET_TEXTURES.length;
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

    setIsLoading(false);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        500
      );
      camera.position.z = 100;
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Controls setup
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Add sun
      const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
      const sunTexture = textureLoaderRef.current.load(SUN_TEXTURE);
      const sunMaterial = new THREE.MeshStandardMaterial({
        map: sunTexture,
        emissive: 0xffa500,
        emissiveIntensity: 0.5,
        metalness: 0,
        roughness: 0.7,
      });
      const sun = new THREE.Mesh(sunGeometry, sunMaterial);
      scene.add(sun);
      sunRef.current = sun;

      // Preload textures and add planets
      await preloadTextures();
      addPlanetsInBatches(scene, SAMPLE_PLANETS);

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

      // Lighting setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 2);
      pointLight.position.set(0, 0, 0);
      scene.add(pointLight);

      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
      scene.add(hemisphereLight);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        
        Object.values(planetsRef.current).forEach((planet) => {
          planet.rotation.y += 0.005;
        });

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

      // Handle clicks
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
            onPlanetClick();
            const position = new THREE.Vector3(0, 0, 15);

            const currentPos = cameraRef.current.position.clone();
            let progress = 0;
            const animate = () => {
              progress += 0.02;
              if (progress > 1) {
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
            onPlanetClick();
            const position = new THREE.Vector3(...clickedPlanet.position);
            position.z += 5;

            const currentPos = cameraRef.current.position.clone();
            let progress = 0;
            const animate = () => {
              progress += 0.02;
              if (progress > 1) {
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
    onBackToOverview();
    
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
          {backButtonText}
        </Button>
      )}

      {showTables && (
        <div className="absolute top-1/2 -translate-y-1/2 flex gap-4">
          <HolderTable
            collapsed={holderTableCollapsed}
            onToggle={() => setHolderTableCollapsed(!holderTableCollapsed)}
          />
          <RewardsTable
            collapsed={rewardsTableCollapsed}
            onToggle={() => setRewardsTableCollapsed(!rewardsTableCollapsed)}
          />
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
