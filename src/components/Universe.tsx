import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
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
  const frameSkipRef = useRef(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadedPlanetsCount, setLoadedPlanetsCount] = useState(0);
  const [totalPlanetsCount, setTotalPlanetsCount] = useState(0);

  const { data: holders, isLoading: holdersLoading } = useQuery({
    queryKey: ['tokenHolders'],
    queryFn: async () => {
      console.log('Fetching token holders data for planets...');
      
      await supabase.functions.invoke('fetchTokenHolders');
      
      const fetchAllHolders = async () => {
        let allHolders: any[] = [];
        let currentPage = 0;
        const pageSize = 40;
        let hasMore = true;

        while (hasMore) {
          console.log(`Fetching holders page ${currentPage + 1}`);
          try {
            const { data, error } = await supabase
              .from('token_holders')
              .select('*', { count: 'exact' })
              .order('percentage', { ascending: false })
              .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

            if (error) {
              if (error.code === 'PGRST103') {
                console.log('Reached end of available holders');
                hasMore = false;
                break;
              }
              console.error('Error fetching token holders:', error);
              throw error;
            }

            if (!data || data.length === 0) {
              hasMore = false;
            } else {
              // Filter out holders with less than 0.01% holdings
              const significantHolders = data.filter(holder => holder.percentage >= 0.01);
              allHolders = [...allHolders, ...significantHolders];
              
              if (data.length < pageSize) {
                hasMore = false;
              } else {
                currentPage++;
              }
            }

            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error: any) {
            if (error.code === 'PGRST103' || (error.message && error.message.includes('PGRST103'))) {
              console.log('Reached end of available holders');
              hasMore = false;
            } else {
              console.error('Error in fetchAllHolders:', error);
              throw error;
            }
          }
        }

        console.log('Successfully fetched significant holders:', allHolders.length);
        setTotalPlanetsCount(allHolders.length);
        return allHolders;
      };

      return fetchAllHolders();
    },
    refetchInterval: 60000,
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
            texture.encoding = THREE.sRGBEncoding;
            texture.needsUpdate = true;
            
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

  const addPlanetsFromHolders = (scene: THREE.Scene) => {
    if (!holders) return;

    console.log('Adding planets progressively...');
    const existingPositions: [number, number, number][] = [];
    const initialBatchSize = 100;
    const subsequentBatchSize = 10;
    let currentIndex = 0;

    const addPlanetBatch = () => {
      const batchSize = !initialLoadComplete ? initialBatchSize : subsequentBatchSize;
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
                loadedTexture.encoding = THREE.sRGBEncoding;
                loadedTexture.needsUpdate = true;
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

        const position = generateRandomPosition(existingPositions);
        existingPositions.push(position);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position);
        scene.add(mesh);
        planetsRef.current[holder.wallet_address] = mesh;
        planetPositionsRef.current[holder.wallet_address] = mesh.position.clone();
        
        setLoadedPlanetsCount(i + 1);
      }

      currentIndex = endIndex;
      
      if (currentIndex >= initialBatchSize && !initialLoadComplete) {
        console.log('Initial batch of planets loaded, enabling interaction');
        setInitialLoadComplete(true);
        setIsLoading(false);
      }
      
      if (currentIndex < holders.length) {
        setTimeout(() => requestAnimationFrame(addPlanetBatch), 50);
      } else {
        console.log('All planets loaded:', currentIndex);
      }
    };

    addPlanetBatch();
  };

  useEffect(() => {
    if (!containerRef.current || !holders) {
      console.log('Container ref or holders data not ready');
      return;
    }

    console.log('Initializing universe with holders:', holders.length);
    let animationFrameId: number | null = null;

    const animate = () => {
      if (document.hidden) {
        console.log('Animation paused - page not visible');
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        return;
      }

      frameSkipRef.current++;
      if (frameSkipRef.current % 2 === 0) {
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
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleVisibilityChange = () => {
      console.log('Visibility changed:', document.hidden ? 'hidden' : 'visible');
      
      if (!document.hidden) {
        console.log('Tab is visible again, refreshing page immediately');
        window.location.reload();
      } else {
        console.log('Pausing animation');
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
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
        powerPreference: "high-performance",
        precision: "mediump"
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
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
      sunTexture.encoding = THREE.sRGBEncoding;
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
        sizeAttenuation: true
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
        if (!cameraRef.current || !sceneRef.current || !controlsRef.current) {
          console.log("Camera, scene, or controls not ready");
          return;
        }

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRef.current);
        
        if (sunRef.current) {
          const sunIntersects = raycaster.intersectObject(sunRef.current);
          if (sunIntersects.length > 0) {
            console.log("Sun clicked");
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
            console.log("Planet clicked:", clickedPlanet.wallet_address);
            cleanupAnimation();
            setIsZoomedIn(true);
            setSelectedHolder(clickedPlanet);
            onPlanetClick();

            const planetPosition = planetPositionsRef.current[clickedPlanet.wallet_address];
            if (!planetPosition) {
              console.error("Planet position not found");
              return;
            }

            const planetSize = calculatePlanetSize(clickedPlanet.percentage);
            controlsRef.current.enabled = false;
            handlePlanetZoom(planetPosition, planetSize);
          }
        }
      };

      window.addEventListener('click', handleClick);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        console.log('Cleaning up universe component');
        window.removeEventListener('click', handleClick);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      };
    };

    init();
  }, [holders, planetCustomizations]);

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
      
      {!initialLoadComplete && isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-white" />
            <p className="text-white">Loading Solar System... {Math.round(loadingProgress)}%</p>
          </div>
        </div>
      )}

      {initialLoadComplete && loadedPlanetsCount < totalPlanetsCount && (
        <div className="fixed bottom-4 right-4 bg-black/50 text-white px-4 py-2 rounded-md">
          Loading more planets: {loadedPlanetsCount}/{totalPlanetsCount}
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