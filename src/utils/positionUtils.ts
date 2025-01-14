export const generateRandomPosition = (
  existingPositions: [number, number, number][],
  percentage?: number
): [number, number, number] => {
  const MIN_DISTANCE = 5;
  const MAX_ATTEMPTS = 50;
  let attempts = 0;
  
  while (attempts < MAX_ATTEMPTS) {
    // Calculate radius based on percentage (inverse relationship)
    // Higher percentage = closer to sun
    const baseRadius = percentage 
      ? 50 - (percentage * 20) // This will make higher % be closer
      : 50;
    const radiusVariation = (Math.random() - 0.5) * 10; // Reduced variation for more controlled spacing
    const radius = Math.max(15, baseRadius + radiusVariation); // Ensure minimum distance from sun
    
    // Generate spherical coordinates with more vertical variation
    const theta = Math.random() * Math.PI * 2; // Horizontal angle (0 to 2π)
    const verticalVariation = (Math.random() - 0.5) * 0.8; // More vertical spread
    const phi = Math.acos((Math.random() * 2 - 1) * (1 - Math.abs(verticalVariation))); // Vertical angle
    
    // Convert to Cartesian coordinates with added noise
    const noise = (Math.random() - 0.5) * 10; // Random noise for each coordinate
    const x = radius * Math.sin(phi) * Math.cos(theta) + noise;
    const y = radius * Math.sin(phi) * Math.sin(theta) + noise;
    const z = radius * Math.cos(phi) + noise;
    
    const position: [number, number, number] = [x, y, z];
    
    // Check if the position is too close to existing planets
    const isTooClose = existingPositions.some(existingPos => {
      const dx = existingPos[0] - x;
      const dy = existingPos[1] - y;
      const dz = existingPos[2] - z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance < MIN_DISTANCE;
    });
    
    if (!isTooClose || attempts === MAX_ATTEMPTS - 1) {
      return position;
    }
    
    attempts++;
  }
  
  // Fallback position with more randomness
  const fallbackRadius = percentage 
    ? Math.max(15, 50 - (percentage * 20) + Math.random() * 15)
    : 50 + Math.random() * 30;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2 - 1) * 0.8); // More vertical spread in fallback
  const noise = (Math.random() - 0.5) * 10;
  
  return [
    fallbackRadius * Math.sin(phi) * Math.cos(theta) + noise,
    fallbackRadius * Math.sin(phi) * Math.sin(theta) + noise,
    fallbackRadius * Math.cos(phi) + noise
  ];
};

export const generateRandomColor = () => {
  const colors = [
    '#8B5CF6', // Vivid Purple
    '#D946EF', // Magenta Pink
    '#F97316', // Bright Orange
    '#0EA5E9', // Ocean Blue
    '#10B981', // Emerald
    '#EF4444', // Red
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};