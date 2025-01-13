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
  backButtonText = "Back to Overview"
}: { 
  onPlanetClick: () => void;
  onBackToOverview: () => void;
  backButtonText?: string;
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
  const [showTables, setShowTables] = useState(false);
  const [holderTableCollapsed, setHolderTableCollapsed] = useState(false);
  const [rewardsTableCollapsed, setRewardsTableCollapsed] = useState(false);
  const animationFrameRef = useRef<number>();

  const cleanupAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleBackToOverview = () => {
    console.log("Starting zoom out animation");
    if (!cameraRef.current || !controlsRef.current) {
      console.error("Camera or controls ref not available");
      return;
    }

    // Clean up any existing animation
    cleanupAnimation();

    // Immediately update states
    setIsZoomedIn(false);
    setShowTables(false);
    onBackToOverview();

    // Re-enable controls
    controlsRef.current.enabled = true;

    const targetPosition = initialCameraPosition.clone();
    const startPosition = cameraRef.current.position.clone();
    const startTime = Date.now();
    const duration = 1000; // 1 second animation

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        // Smooth easing function
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Calculate new position
        const newPos = new THREE.Vector3().lerpVectors(
          startPosition,
          targetPosition,
          easeProgress
        );
        
        cameraRef.current!.position.copy(newPos);
        controlsRef.current!.target.lerp(new THREE.Vector3(0, 0, 0), easeProgress);
        controlsRef.current!.update();
        
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        console.log("Zoom out animation complete");
        cleanupAnimation();
      }
    };

    animate();
  };

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
        
        if (!isZoomedIn) {
          Object.values(planetsRef.current).forEach((planet) => {
            planet.rotation.y += 0.005;
          });

          if (sunRef.current) {
            sunRef.current.rotation.y += 0.001;
          }
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
            // Clean up any existing animation
            cleanupAnimation();
            
            setIsZoomedIn(true);
            setShowTables(true);
            onPlanetClick();
            const position = new THREE.Vector3(-2, 0, 15);

            // Disable controls and ensure they stay disabled
            controlsRef.current.enabled = false;

            const currentPos = cameraRef.current.position.clone();
            let progress = 0;
            const animate = () => {
              progress += 0.02;
              if (progress > 1) {
                controlsRef.current!.enabled = false;
                cleanupAnimation();
                return;
              }

              const newPos = currentPos.clone().lerp(position, progress);
              cameraRef.current!.position.copy(newPos);
              controlsRef.current!.target.copy(new THREE.Vector3(-2, 0, 0));
              controlsRef.current!.update();

              animationFrameRef.current = requestAnimationFrame(animate);
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
            // Clean up any existing animation
            cleanupAnimation();
            
            setIsZoomedIn(true);
            setShowTables(true);
            onPlanetClick();

            // Disable controls and ensure they stay disabled
            controlsRef.current.enabled = false;

            const position = new THREE.Vector3(
              clickedPlanet.position[0] - 2,
              clickedPlanet.position[1],
              clickedPlanet.position[2] + 5
            );

            const currentPos = cameraRef.current.position.clone();
            let progress = 0;
            const animate = () => {
              progress += 0.02;
              if (progress > 1) {
                controlsRef.current!.enabled = false;
                cleanupAnimation();
                return;
              }

              const newPos = currentPos.clone().lerp(position, progress);
              cameraRef.current!.position.copy(newPos);
              controlsRef.current!.target.copy(new THREE.Vector3(
                clickedPlanet.position[0] - 2,
                clickedPlanet.position[1],
                clickedPlanet.position[2]
              ));
              controlsRef.current!.update();

              animationFrameRef.current = requestAnimationFrame(animate);
            };

            animate();
          }
        }
      };

      window.addEventListener('click', handleClick);

      return () => {
        window.removeEventListener('click', handleClick);
        cleanupAnimation();
        renderer.dispose();
      };
    };

    init();
  }, []);

  // Cleanup animations when component unmounts
  useEffect(() => {
    return () => {
      cleanupAnimation();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-screen" />
      
      {isZoomedIn && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-24 left-4 bg-space-lighter text-white hover:bg-space-accent/20 z-50"
          onClick={handleBackToOverview}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backButtonText}
        </Button>
      )}

      {showTables && isZoomedIn && (
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
    </div>
  );
};

export default Universe;