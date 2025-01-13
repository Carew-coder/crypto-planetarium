import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PLANET_TEXTURES, SUN_TEXTURE, calculatePlanetSize } from '@/constants/planets';
import ShootingStars from './universe/ShootingStars';
import PlanetInformation from './universe/PlanetInformation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { generateRandomPosition } from '@/utils/positionUtils';

const Universe = ({ 
  onPlanetClick,
  onBackToOverview,
  backButtonText = "Back to Overview",
  selectedWalletAddress
}: { 
  onPlanetClick: () => void;
  onBackToOverview: () => void;
  backButtonText?: string;
  selectedWalletAddress?: string | null;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const planetsRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const planetPositionsRef = useRef<{ [key: string]: THREE.Vector3 }>({});
  const sunRef = useRef<THREE.Mesh | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());
  const loadedTexturesRef = useRef<{ [key: string]: THREE.Texture }>({});
  const { toast } = useToast();
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [initialCameraPosition] = useState(new THREE.Vector3(0, 0, 100));
  const [selectedHolder, setSelectedHolder] = useState<any>(null);
  const animationFrameRef = useRef<number>();

  // Fetch token holders data
  const { data: holders } = useQuery({
    queryKey: ['tokenHolders'],
    queryFn: async () => {
      console.log('Fetching token holders data for planets...');
      const { data, error } = await supabase
        .from('token_holders')
        .select('*')
        .order('percentage', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching token holders:', error);
        throw error;
      }
      
      return data;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

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

    cleanupAnimation();

    setIsZoomedIn(false);
    setSelectedHolder(null);
    onBackToOverview();

    // Reset controls to default state
    controlsRef.current.enableZoom = true;
    controlsRef.current.enableRotate = true;
    controlsRef.current.enablePan = true;
    controlsRef.current.minDistance = 1;
    controlsRef.current.maxDistance = 200;

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

  const addPlanetsFromHolders = (scene: THREE.Scene) => {
    if (!holders) return;

    const existingPositions: [number, number, number][] = [];

    holders.forEach((holder, index) => {
      const textureIndex = index % PLANET_TEXTURES.length;
      const texturePath = PLANET_TEXTURES[textureIndex];
      const texture = loadedTexturesRef.current[texturePath];

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
  };

  const handlePlanetZoom = (planetPosition: THREE.Vector3) => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    cleanupAnimation();
    
    const targetPosition = new THREE.Vector3(
      planetPosition.x,
      planetPosition.y,
      planetPosition.z + 5
    );

    const currentPos = cameraRef.current.position.clone();
    let progress = 0;
    
    const animate = () => {
      progress += 0.02;
      if (progress > 1) {
        // Instead of disabling controls, configure them for planet viewing
        if (controlsRef.current) {
          controlsRef.current.enableZoom = true;
          controlsRef.current.enableRotate = true;
          controlsRef.current.enablePan = true;
          controlsRef.current.minDistance = 3; // Prevent zooming too close
          controlsRef.current.maxDistance = 10; // Prevent zooming too far
          controlsRef.current.target.copy(new THREE.Vector3(
            planetPosition.x,
            planetPosition.y,
            planetPosition.z
          ));
        }
        cleanupAnimation();
        return;
      }

      const newPos = currentPos.clone().lerp(targetPosition, progress);
      cameraRef.current!.position.copy(newPos);
      
      controlsRef.current!.target.copy(new THREE.Vector3(
        planetPosition.x,
        planetPosition.y,
        planetPosition.z
      ));
      controlsRef.current!.update();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  useEffect(() => {
    if (!containerRef.current || !holders) return;

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

      // Update controls setup
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1;
      controls.maxDistance = 200;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.enablePan = true;
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
      addPlanetsFromHolders(scene);

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

      // Update animation loop
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
            cleanupAnimation();
            setIsZoomedIn(true);
            setSelectedHolder(null);
            onPlanetClick();
            
            // Center the sun
            handlePlanetZoom(new THREE.Vector3(0, 0, 0));
            return;
          }
        }

        // Check for planet clicks
        const intersects = raycaster.intersectObjects(Object.values(planetsRef.current));
        if (intersects.length > 0) {
          const clickedPlanet = holders.find(
            (p) => planetsRef.current[p.wallet_address] === intersects[0].object
          );

          if (clickedPlanet) {
            cleanupAnimation();
            setIsZoomedIn(true);
            setSelectedHolder(clickedPlanet);
            onPlanetClick();

            const planetPosition = planetPositionsRef.current[clickedPlanet.wallet_address];
            if (!planetPosition) return;

            controlsRef.current.enabled = false;
            handlePlanetZoom(planetPosition);
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
  }, [holders]);

  // Effect to handle wallet selection from the table
  useEffect(() => {
    if (selectedWalletAddress && !isZoomedIn && planetsRef.current[selectedWalletAddress]) {
      console.log('Zooming to selected wallet planet:', selectedWalletAddress);
      
      const planet = planetsRef.current[selectedWalletAddress];
      const holder = holders?.find(h => h.wallet_address === selectedWalletAddress);
      
      if (planet && holder && cameraRef.current && controlsRef.current) {
        cleanupAnimation();
        setIsZoomedIn(true);
        setSelectedHolder(holder);
        onPlanetClick();

        const planetPosition = planetPositionsRef.current[selectedWalletAddress];
        if (!planetPosition) return;

        controlsRef.current.enabled = false;
        handlePlanetZoom(planetPosition);
      }
    }
  }, [selectedWalletAddress, holders, isZoomedIn, onPlanetClick]);

  // Cleanup animations when component unmounts
  useEffect(() => {
    return () => {
      cleanupAnimation();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-screen" />
      <ShootingStars />
      
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

      {isZoomedIn && selectedHolder && (
        <PlanetInformation holder={selectedHolder} />
      )}
    </div>
  );
};

export default Universe;
