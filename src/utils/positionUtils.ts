export const generateRandomPosition = (existingPositions: [number, number, number][]): [number, number, number] => {
  const MIN_DISTANCE = 3; // Reduced minimum distance between planets
  const MAX_ATTEMPTS = 30;
  let attempts = 0;
  
  while (attempts < MAX_ATTEMPTS) {
    // Increased radius range to spread planets more
    const minRadius = 30;
    const maxRadius = 150;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    const position: [number, number, number] = [x, y, z];
    
    // Only check distance against nearest 50 planets to improve performance
    const nearestPlanets = existingPositions.slice(-50);
    const isTooClose = nearestPlanets.some(existingPos => {
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
  
  // Fallback position with increased radius range
  const fallbackRadius = 30 + Math.random() * 120;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  
  return [
    fallbackRadius * Math.sin(phi) * Math.cos(theta),
    fallbackRadius * Math.sin(phi) * Math.sin(theta),
    fallbackRadius * Math.cos(phi)
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