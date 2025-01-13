import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PLANET_TEXTURES, SUN_TEXTURE, calculatePlanetSize } from '@/constants/planets';
import ShootingStars from './universe/ShootingStars';
import PlanetInformation from './universe/PlanetInformation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { generateRandomPosition } from '@/utils/positionUtils';

const Universe = ({ 
  onPlanetClick,
  onBackToOverview,
  backButtonText = "Back to Overview",
  selectedWalletAddress,
  connectedWalletAddress
}: { 
  onPlanetClick: () => void;
  onBackToOverview: () => void;
  backButtonText?: string;
  selectedWalletAddress?: string | null;
  connectedWalletAddress?: string | null;
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
  const isAnimatingRef = useRef(false);
  const queryClient = useQueryClient();

  const { data: holders, isLoading: holdersLoading } = useQuery({
    queryKey: ['tokenHolders'],
    queryFn: async () => {
      console.log('Fetching token holders data for planets...');
      await supabase.functions.invoke('fetchTokenHolders');
      
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
    refetchInterval: 10000, // Decreased from 300000 to 10000 (10 seconds)
    staleTime: 5000, // Data becomes stale after 5 seconds
  });

  const { data: planetCustomizations, isLoading: customizationsLoading } = useQuery({
    queryKey: ['planetCustomizations'],
    queryFn: async () => {
      console.log('Fetching planet customizations...');
      const { data, error } = await supabase
        .from('planet_customizations')
        .select('*');

      if (error) {
        console.error('Error fetching planet customizations:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 10000, // Decreased from 300000 to 10000 (10 seconds)
    staleTime: 5000,
  });

  // Add real-time subscription for token holders
  useEffect(() => {
    console.log('Setting up real-time subscription for token holders...');
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'token_holders'
        },
        (payload) => {
          console.log('Received real-time update for token holders:', payload);
          // Force a refetch when we receive real-time updates
          void queryClient.invalidateQueries({ queryKey: ['tokenHolders'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up token holders subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  // Add real-time subscription for planet customizations
  useEffect(() => {
    console.log('Setting up real-time subscription for planet customizations...');
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planet_customizations'
        },
        (payload) => {
          console.log('Received real-time update for planet customizations:', payload);
          void queryClient.invalidateQueries({ queryKey: ['planetCustomizations'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up planet customizations subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const cleanupAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    isAnimatingRef.current = false;
  };

  const handleBackToOverview = () => {
    console.log("Starting zoom out animation");
    if (!cameraRef.current || !controlsRef.current) {
      console.error("Camera or controls ref not available");
      return;
    }

    if (isAnimatingRef.current) {
      console.log("Animation already in progress, skipping");
      return;
    }

    cleanupAnimation();
    isAnimatingRef.current = true;

    setIsZoomedIn(false);
    setSelectedHolder(null);
    onBackToOverview();

    const targetPosition = initialCameraPosition.clone();
    const startPosition = cameraRef.current.position.clone();
    const startTime = Date.now();
    const duration = 1000;

    controlsRef.current.enabled = false;

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
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
        console.log("Zoom out animation complete");
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.enableZoom = true;
          controlsRef.current.enableRotate = true;
          controlsRef.current.enablePan = true;
          controlsRef.current.minDistance = 1;
          controlsRef.current.maxDistance = 500;
        }
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
      const customization = planetCustomizations?.find(
        pc => pc.wallet_address === holder.wallet_address
      );

      let texture;
      if (customization?.skin_url) {
        console.log(`Loading custom skin for wallet ${holder.wallet_address}:`, customization.skin_url);
        textureLoaderRef.current.load(
          customization.skin_url,
          (loadedTexture) => {
            console.log(`Custom skin loaded successfully for ${holder.wallet_address}`);
            if (planetsRef.current[holder.wallet_address]) {
              const material = planetsRef.current[holder.wallet_address].material as THREE.MeshStandardMaterial;
              material.map = loadedTexture;
              material.needsUpdate = true;
            }
          },
          undefined,
          (error) => {
            console.error(`Error loading custom skin for ${holder.wallet_address}:`, error);
            // Fallback to default texture
            const textureIndex = index % PLANET_TEXTURES.length;
            const texturePath = PLANET_TEXTURES[textureIndex];
            texture = loadedTexturesRef.current[texturePath];
          }
        );
      } else {
        const textureIndex = index % PLANET_TEXTURES.length;
        const texturePath = PLANET_TEXTURES[textureIndex];
        texture = loadedTexturesRef.current[texturePath];
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
  };

  const handlePlanetZoom = (planetPosition: THREE.Vector3, planetSize?: number) => {
    if (!cameraRef.current || !controlsRef.current || isAnimatingRef.current) {
      console.log("Cannot start zoom animation - camera not ready or animation in progress");
      return;
    }
    
    console.log("Starting zoom to planet animation");
    cleanupAnimation();
    isAnimatingRef.current = true;
    
    const baseZOffset = planetPosition.equals(new THREE.Vector3(0, 0, 0)) ? 15 : 5;
    const zOffset = planetSize ? Math.max(planetSize * 3, baseZOffset) : baseZOffset;
    
    const targetPosition = new THREE.Vector3(
      planetPosition.x,
      planetPosition.y,
      planetPosition.z + zOffset
    );

    const currentPos = cameraRef.current.position.clone();
    const startTime = Date.now();
    const duration = 1000;
    
    controlsRef.current.enabled = false;
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const newPos = currentPos.clone().lerp(targetPosition, easeProgress);
        cameraRef.current!.position.copy(newPos);
        controlsRef.current!.target.lerp(planetPosition, easeProgress);
        controlsRef.current!.update();
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        console.log("Zoom to planet animation complete");
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.enableZoom = true;
          controlsRef.current.enableRotate = true;
          controlsRef.current.enablePan = true;
          controlsRef.current.minDistance = 1;
          controlsRef.current.maxDistance = 500;
          controlsRef.current.target.copy(planetPosition);
          controlsRef.current.update();
        }
        cleanupAnimation();
      }
    };

    animate();
  };

  useEffect(() => {
    if (!containerRef.current || !holders) return;

    const init = async () => {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        500
      );
      camera.position.z = 100;
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.5;
      controls.zoomSpeed = 2.0; // Increased from 0.5 to 2.0 for faster zoom
      controls.minDistance = 1;
      controls.maxDistance = 500; // Increased from 200 to 500
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.enablePan = true;
      controlsRef.current = controls;

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

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 2);
      pointLight.position.set(0, 0, 0);
      scene.add(pointLight);

      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
      scene.add(hemisphereLight);

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

      const handleResize = () => {
        if (!cameraRef.current || !rendererRef.current) return;
        
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleClick = (event: MouseEvent) => {
        if (!cameraRef.current || !sceneRef.current || !controlsRef.current) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRef.current);
        
        if (sunRef.current) {
          const sunIntersects = raycaster.intersectObject(sunRef.current);
          if (sunIntersects.length > 0) {
            cleanupAnimation();
            setIsZoomedIn(true);
            setSelectedHolder(null);
            onPlanetClick();
            
            handlePlanetZoom(new THREE.Vector3(0, 0, 0));
            return;
          }
        }

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

            const planetSize = calculatePlanetSize(clickedPlanet.percentage);
            controlsRef.current.enabled = false;
            handlePlanetZoom(planetPosition, planetSize);
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
  }, [holders, planetCustomizations]);

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

        const planetSize = calculatePlanetSize(holder.percentage);
        handlePlanetZoom(planetPosition, planetSize);
      }
    }
  }, [selectedWalletAddress, holders, isZoomedIn, onPlanetClick]);

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
        <PlanetInformation 
          holder={selectedHolder} 
          connectedWalletAddress={connectedWalletAddress}
        />
      )}
    </div>
  );
};

export default Universe;
