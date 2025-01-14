import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hourglass } from "lucide-react";
import { PLANET_TEXTURES, SUN_TEXTURE, calculatePlanetSize } from '@/constants/planets';
import ShootingStars from './universe/ShootingStars';
import PlanetInformation from './universe/PlanetInformation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { generateRandomPosition } from '@/utils/positionUtils';
import { Loader2 } from "lucide-react";

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const textureCache = useRef<Map<string, THREE.Texture>>(new Map());
  const isInitializedRef = useRef(false);

  const { data: holders, isLoading: holdersLoading } = useQuery({
    queryKey: ['tokenHolders'],
    queryFn: async () => {
      console.log('Fetching token holders data for planets...');
      
      await supabase.functions.invoke('fetchTokenHolders');
      
      const { data, error } = await supabase
        .from('token_holders')
        .select('*')
        .order('percentage', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching token holders:', error);
        throw error;
      }
      
      console.log('Successfully fetched token holders data:', data);
      return data;
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    staleTime: 55000,
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

      console.log('Successfully fetched planet customizations:', data);
      return data;
    },
    refetchInterval: 300000,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

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
      console.log("Animation already in progress, canceling previous animation");
      cleanupAnimation();
    }

    isAnimatingRef.current = true;

    setIsZoomedIn(false);
    setSelectedHolder(null);
    onBackToOverview();

    const targetPosition = initialCameraPosition.clone();
    const startPosition = cameraRef.current.position.clone();
    const startTime = Date.now();
    const duration = 1000;

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
      controlsRef.current.enableZoom = false;
      controlsRef.current.enableRotate = false;
      controlsRef.current.enablePan = false;
    }

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        if (cameraRef.current && controlsRef.current) {
          const newPos = new THREE.Vector3().lerpVectors(
            startPosition,
            targetPosition,
            easeProgress
          );
          
          cameraRef.current.position.copy(newPos);
          controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), easeProgress);
          controlsRef.current.update();
        }
        
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
          controlsRef.current.update();
        }
        isAnimatingRef.current = false;
      }
    };

    animate();
  };

  const handlePlanetZoom = (planetPosition: THREE.Vector3, planetSize?: number) => {
    console.log("Starting zoom to planet animation", { planetPosition, planetSize });
    if (!cameraRef.current || !controlsRef.current) {
      console.error("Camera or controls not initialized");
      return;
    }

    if (isAnimatingRef.current) {
      console.log("Animation already in progress, canceling previous animation");
      cleanupAnimation();
    }

    isAnimatingRef.current = true;
    
    const baseZOffset = planetPosition.equals(new THREE.Vector3(0, 0, 0)) ? 15 : 5;
    const zOffset = planetSize ? Math.max(planetSize * 3, baseZOffset) : baseZOffset;
    
    const targetPosition = new THREE.Vector3(
      planetPosition.x,
      planetPosition.y,
      planetPosition.z + zOffset
    );

    const startPosition = cameraRef.current.position.clone();
    const startTime = Date.now();
    const duration = 1000;
    
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
      controlsRef.current.enableZoom = false;
      controlsRef.current.enableRotate = false;
      controlsRef.current.enablePan = false;
    }
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        if (cameraRef.current && controlsRef.current) {
          const newPos = new THREE.Vector3().lerpVectors(
            startPosition,
            targetPosition,
            easeProgress
          );
          
          cameraRef.current.position.copy(newPos);
          controlsRef.current.target.lerp(planetPosition, easeProgress);
          controlsRef.current.update();
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        console.log("Zoom animation complete");
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
        isAnimatingRef.current = false;
      }
    };

    animate();
  };

  const preloadTextures = async () => {
    if (isInitializedRef.current) {
      console.log('Textures already preloaded, skipping...');
      setIsLoading(false);
      return;
    }

    console.log('Starting optimized texture preloading...');
    const totalTextures = PLANET_TEXTURES.length + 1;
    let loadedCount = 0;

    const loadTexture = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (textureCache.current.has(url)) {
          console.log(`Using cached texture for: ${url}`);
          loadedTexturesRef.current[url] = textureCache.current.get(url)!;
          loadedCount++;
          setLoadingProgress((loadedCount / totalTextures) * 100);
          resolve();
          return;
        }

        textureLoaderRef.current.load(
          url,
          (texture) => {
            console.log(`Texture loaded and compressed: ${url}`);
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.anisotropy = 16;
            
            textureCache.current.set(url, texture);
            loadedTexturesRef.current[url] = texture;
            loadedCount++;
            setLoadingProgress((loadedCount / totalTextures) * 100);
            resolve();
          },
          (progress) => {
            console.log(`Loading progress for ${url}: ${progress.loaded / progress.total * 100}%`);
          },
          (error) => {
            console.error(`Error loading texture ${url}:`, error);
            reject(error);
          }
        );
      });
    };

    try {
      await loadTexture(SUN_TEXTURE);

      const batchSize = 5;
      for (let i = 0; i < PLANET_TEXTURES.length; i += batchSize) {
        const batch = PLANET_TEXTURES.slice(i, i + batchSize);
        await Promise.all(batch.map(texturePath => loadTexture(texturePath)));
      }

      console.log('All textures preloaded successfully');
      isInitializedRef.current = true;
      setIsLoading(false);
    } catch (error) {
      console.error('Error preloading textures:', error);
      toast({
        title: "Error loading planet textures",
        description: "Some planets might not display correctly",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const updatePlanetsFromHolders = () => {
    if (!holders || !sceneRef.current) return;
    
    console.log('Updating planets with new holder data...');
    
    holders.forEach((holder) => {
      const existingPlanet = planetsRef.current[holder.wallet_address];
      if (existingPlanet) {
        const size = calculatePlanetSize(holder.percentage);
        // Reset scale before applying new size to prevent cumulative scaling
        existingPlanet.scale.set(1, 1, 1);
        // Apply new size
        existingPlanet.geometry = new THREE.SphereGeometry(size, 32, 32);
      }
    });
  };

  const addPlanetsFromHolders = (scene: THREE.Scene) => {
    if (!holders) return;

    console.log('Adding planets progressively...');
    const existingPositions: [number, number, number][] = [];
    const batchSize = 10;
    let currentIndex = 0;

    const addPlanetBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, holders.length);
      
      for (let i = currentIndex; i < endIndex; i++) {
        const holder = holders[i];
        const customization = planetCustomizations?.find(
          pc => pc.wallet_address === holder.wallet_address
        );

        let texture: THREE.Texture | undefined;
        
        if (customization?.skin_url) {
          if (textureCache.current.has(customization.skin_url)) {
            texture = textureCache.current.get(customization.skin_url);
          } else {
            textureLoaderRef.current.load(
              customization.skin_url,
              (loadedTexture) => {
                if (planetsRef.current[holder.wallet_address]) {
                  const material = planetsRef.current[holder.wallet_address].material as THREE.MeshStandardMaterial;
                  material.map = loadedTexture;
                  material.needsUpdate = true;
                  textureCache.current.set(customization.skin_url!, loadedTexture);
                }
              }
            );
          }
        } else {
          const textureIndex = i % PLANET_TEXTURES.length;
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

        if (!planetsRef.current[holder.wallet_address]) {
          const position = generateRandomPosition(existingPositions, holder.percentage);
          existingPositions.push(position);

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(...position);
          mesh.userData = { walletAddress: holder.wallet_address }; // Add wallet address to mesh userData
          scene.add(mesh);
          planetsRef.current[holder.wallet_address] = mesh;
          planetPositionsRef.current[holder.wallet_address] = mesh.position.clone();
        }
      }

      currentIndex = endIndex;
      
      if (currentIndex < holders.length) {
        requestAnimationFrame(addPlanetBatch);
      }
    };

    addPlanetBatch();
  };

  useEffect(() => {
    if (!containerRef.current || !holders) {
      console.log('Container ref or holders data not ready');
      return;
    }

    if (!isInitializedRef.current) {
      console.log('Initializing universe with holders:', holders.length);
      let animationFrameId: number | null = null;
      let isPageVisible = true;

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleClick = (event: MouseEvent) => {
        if (!sceneRef.current || !cameraRef.current) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(sceneRef.current.children);

        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          
          if (clickedObject === sunRef.current) {
            console.log('Sun clicked');
            setIsZoomedIn(true);
            setSelectedHolder({
              wallet_address: 'sun',
              token_amount: 0,
              percentage: 100,
            });
            onPlanetClick();
            handlePlanetZoom(new THREE.Vector3(0, 0, 0));
            return;
          }

          const walletAddress = clickedObject.userData?.walletAddress;
          if (walletAddress) {
            console.log('Planet clicked:', walletAddress);
            const holder = holders.find(h => h.wallet_address === walletAddress);
            if (holder) {
              setSelectedHolder(holder);
              setIsZoomedIn(true);
              onPlanetClick();
              const planetPosition = planetPositionsRef.current[walletAddress];
              if (planetPosition) {
                const planetSize = calculatePlanetSize(holder.percentage);
                handlePlanetZoom(planetPosition, planetSize);
              }
            }
          }
        }
      };

      const animate = () => {
        if (!isPageVisible) {
          console.log('Animation paused - page not visible');
          return;
        }

        if (!isZoomedIn) {
          Object.values(planetsRef.current).forEach((planet) => {
            planet.rotation.y += 0.005;
          });

          if (sunRef.current) {
            sunRef.current.rotation.y += 0.001;
          }
        }

        if (controlsRef.current) {
          controlsRef.current.update();
        }

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      const startAnimation = () => {
        if (animationFrameId === null) {
          console.log('Starting animation loop');
          animate();
        }
      };

      const stopAnimation = () => {
        if (animationFrameId !== null) {
          console.log('Stopping animation loop');
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      };

      const handleVisibilityChange = () => {
        isPageVisible = !document.hidden;
        console.log('Visibility changed:', isPageVisible ? 'visible' : 'hidden');
        
        if (isPageVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      };

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
        controls.zoomSpeed = 2.0;
        controls.minDistance = 1;
        controls.maxDistance = 500;
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

        startAnimation();

        const handleResize = () => {
          if (!cameraRef.current || !rendererRef.current) return;
          
          cameraRef.current.aspect = window.innerWidth / window.innerHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        containerRef.current.addEventListener('click', handleClick);

        return () => {
          console.log('Cleaning up universe component');
          window.removeEventListener('resize', handleResize);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          containerRef.current?.removeEventListener('click', handleClick);
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          if (rendererRef.current) {
            rendererRef.current.dispose();
          }
        };
      };

      init();
    } else {
      console.log('Universe already initialized, updating planets...');
      updatePlanetsFromHolders();
    }
  }, [holders]);

  useEffect(() => {
    if (selectedWalletAddress && planetsRef.current[selectedWalletAddress]) {
      console.log('Zooming to selected wallet planet:', selectedWalletAddress);
      
      const planet = planetsRef.current[selectedWalletAddress];
      const holder = holders?.find(h => h.wallet_address === selectedWalletAddress);
      
      if (planet && holder && cameraRef.current && controlsRef.current) {
        cleanupAnimation();
        setIsZoomedIn(true);
        setSelectedHolder(holder);

        const planetPosition = planetPositionsRef.current[selectedWalletAddress];
        if (!planetPosition) {
          console.error("Planet position not found for selected wallet");
          return;
        }

        const planetSize = calculatePlanetSize(holder.percentage);
        handlePlanetZoom(planetPosition, planetSize);
      } else {
        console.error("Required references not available for zoom");
      }
    }
  }, [selectedWalletAddress, holders]);

  useEffect(() => {
    return () => {
      cleanupAnimation();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-screen" />
      <ShootingStars />
      
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="text-center space-y-4">
            <Hourglass className="w-8 h-8 mx-auto text-white" />
            <p className="text-white">Loading Solar System... {Math.round(loadingProgress)}%</p>
          </div>
        </div>
      )}
      
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
