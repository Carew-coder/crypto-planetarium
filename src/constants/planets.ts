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
  '/lovable-uploads/3a2b0bbf-5268-4126-bc25-d4ea7fec9f4e.png',  // Red plasma
  '/lovable-uploads/48173985-b772-417b-a059-0f06ce157864.png',  // Turquoise waves
  '/lovable-uploads/3a85be40-1d78-439d-a616-39c2c23c12b3.png',  // Electric blue
  '/lovable-uploads/1db1a524-720b-4aee-8d6a-ce040ddf3964.png',  // Green lightning
  '/lovable-uploads/7b2be74e-3448-4b5d-8a4a-3e95d46924e2.png',  // Crystal formation
  '/lovable-uploads/2d357c7a-8e5c-41a2-ace8-66bb245e27ed.png',  // Purple storm
  '/lovable-uploads/e9932568-3394-42a3-86b5-b6e4659dfe52.png',  // Cosmic swirl
  '/lovable-uploads/09aa93e8-a49f-4f20-83cf-2e3eb67a07be.png',  // Metallic flow
  '/lovable-uploads/ac546a61-94c1-48d5-86cf-57aa0c45b8e6.png',  // Solar flare
  '/lovable-uploads/406c7022-a3f6-4a8c-85ca-9ca72a66e8c6.png',  // Lava core
  '/lovable-uploads/b2b2500b-52f3-4a95-bf21-5d16a08765bc.png',  // Fire storm
  '/lovable-uploads/62092156-4668-4f73-934a-b7977f2f9614.png',  // Royal nebula
  '/lovable-uploads/02393287-3e3c-435f-866d-b46ebdc6e7cb.png',  // Rainbow wave
  '/lovable-uploads/0a64a3c5-ee2b-4aa5-bef0-52892071647d.png'   // Yellow energy
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
