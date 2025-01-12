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

const SAMPLE_PLANETS: Planet[] = [
  {
    id: "btc",
    name: "Bitcoin",
    value: 45000,
    color: "#F7931A",
    size: 2,
    position: [0, 0, 0],
  },
  {
    id: "eth",
    name: "Ethereum",
    value: 2500,
    color: "#627EEA",
    size: 1.5,
    position: [5, 2, -3],
  },
  {
    id: "sol",
    name: "Solana",
    value: 100,
    color: "#00FFA3",
    size: 1,
    position: [-4, -1, 4],
  },
];

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

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    SAMPLE_PLANETS.forEach((planet) => {
      const geometry = new THREE.SphereGeometry(planet.size, 64, 64);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(planet.color) },
          time: { value: 0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec2 vUv;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          varying vec3 vNormal;
          varying vec2 vUv;
          
          void main() {
            float noise = sin(vUv.x * 20.0) * sin(vUv.y * 20.0) * 0.1;
            float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
            rim = pow(rim, 2.0);
            vec3 finalColor = color + color * noise + vec3(1.0) * rim * 0.5;
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...planet.position);
      scene.add(mesh);
      planetsRef.current[planet.id] = mesh;

      const glowGeometry = new THREE.SphereGeometry(planet.size * 1.2, 64, 64);
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(planet.color) },
          viewVector: { value: camera.position },
          c: { value: 0.6 },
          p: { value: 4.5 },
        },
        vertexShader: `
          uniform vec3 viewVector;
          varying float intensity;
          void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vNormel = normalize(normalMatrix * viewVector);
            intensity = pow(0.63 - dot(vNormal, vNormel), 4.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          varying float intensity;
          void main() {
            vec3 glow = glowColor * intensity;
            gl_FragColor = vec4(glow, intensity);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });

      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.set(...planet.position);
      scene.add(glowMesh);

      const atmosphereGeometry = new THREE.SphereGeometry(planet.size * 1.1, 64, 64);
      const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(planet.color) },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            gl_FragColor = vec4(color, intensity * 0.3);
          }
        `,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });

      const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      atmosphereMesh.position.set(...planet.position);
      scene.add(atmosphereMesh);
    });

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xFFFFFF, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const animate = () => {
      requestAnimationFrame(animate);
      
      Object.values(planetsRef.current).forEach((planet) => {
        planet.rotation.y += 0.005;
      });

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
