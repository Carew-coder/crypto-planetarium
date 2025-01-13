export const SUN_TEXTURE = '/lovable-uploads/3b3451a5-34bb-48fb-91d3-427407ec33e4.png'; // Fiery texture for the sun

// Array of textures that will be used for the planets
export const PLANET_TEXTURES = [
  '/lovable-uploads/99b14542-f4d2-44ea-a833-5034f0255bea.png',  // Green swirl
  '/lovable-uploads/69c504e9-e9cd-46bf-bd7f-0c67c80294d9.png',  // Pastel swirl
  '/lovable-uploads/81cbd3fb-a1c3-44c0-8b90-fd34ef5a73dd.png',  // Electric green
  '/lovable-uploads/c8aba9c6-d59d-41f8-8735-f40fb6bb37a3.png',  // Blue swirl
  '/lovable-uploads/e3837114-4ac9-4ff3-bc53-032aea006f0f.png',  // Earth-like
  '/lovable-uploads/593dd3b5-1ece-4486-96c0-6bf74240795e.png',  // Ocean waves
  '/lovable-uploads/f8de2475-536f-4ad7-a175-fefe2aa34b72.png',  // Purple nebula
  '/lovable-uploads/98a4a118-feb5-4773-8508-8ea28b9f15ac.png',  // Golden swirl
  '/lovable-uploads/18882195-537b-4429-ab8d-b25064f44981.png',  // Crystal cave
  '/lovable-uploads/3a2b0bbf-5268-4126-bc25-d4ea7fec9f4e.png'   // Red plasma
];

// Function to calculate planet size based on holding percentage with exponential scaling and a maximum cap
export const calculatePlanetSize = (percentage: number): number => {
  // Base size for smallest planets (0.1% holdings)
  const minSize = 0.5;
  // Maximum size for largest planets (now capped much lower)
  const maxSize = 4; // Dramatically reduced from 50 to keep planets reasonably sized
  
  // Apply exponential scaling but with a gentler curve
  // Using a power of 0.5 to make the size differences more gradual
  const normalizedPercentage = Math.pow(percentage / 100, 0.5);
  
  // Scale the percentage to a size between minSize and maxSize
  return minSize + normalizedPercentage * (maxSize - minSize);
};