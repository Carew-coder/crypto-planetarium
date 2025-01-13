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

// Function to calculate planet size based on holding percentage
export const calculatePlanetSize = (percentage: number): number => {
  // Base size for smallest planets
  const minSize = 0.5;
  // Maximum size for largest planets
  const maxSize = 3;
  // Scale the percentage to a size between minSize and maxSize
  return minSize + (percentage / 100) * (maxSize - minSize);
};