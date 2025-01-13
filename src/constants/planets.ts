export const SUN_TEXTURE = '/lovable-uploads/23b2bc40-66dc-4b5a-9b64-3d91755cea67.png';

// Array of textures that will be used for the planets
export const PLANET_TEXTURES = [
  '/lovable-uploads/0052a47d-d440-437c-8f29-fb5b458cb642.png',
  '/lovable-uploads/07940f47-fc24-4197-ba10-be4390f882b2.png',
  '/lovable-uploads/0a36d67b-b2b3-4558-aad4-6665abaca922.png',
  '/lovable-uploads/143c45be-81e7-4bc9-8c02-5b5d749b901a.png',
  '/lovable-uploads/1a9e1fee-d80e-4855-86e9-9fe6b4a730db.png',
  '/lovable-uploads/1ab07e73-40b1-45f0-970a-3a546f65c396.png',
  '/lovable-uploads/2628cfea-a949-4819-adb1-c3c393bb68d4.png',
  '/lovable-uploads/454d5495-aee2-4eaa-b3a1-49e4cf51f279.png',
  '/lovable-uploads/47867400-645f-4a61-adea-7da70fa41000.png',
];

// Function to calculate planet size based on holding percentage with exponential scaling
export const calculatePlanetSize = (percentage: number): number => {
  // Base size for smallest planets (0.1% holdings)
  const minSize = 0.5;
  // Maximum size for largest planets (100% holdings)
  const maxSize = 50; // Dramatically increased from 25 to make larger planets much more prominent
  
  // Apply even stronger exponential scaling to create more dramatic size differences
  // Using a power of 3 to make the size difference extremely noticeable
  const normalizedPercentage = Math.pow(percentage / 100, 3);
  
  // Scale the percentage to a size between minSize and maxSize
  return minSize + normalizedPercentage * (maxSize - minSize);
};