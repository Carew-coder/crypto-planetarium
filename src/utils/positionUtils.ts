export const generateRandomPosition = (existingPositions: [number, number, number][]): [number, number, number] => {
  const MIN_DISTANCE = 5;
  const MAX_ATTEMPTS = 50;
  let attempts = 0;
  
  while (attempts < MAX_ATTEMPTS) {
    const radius = 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    const position: [number, number, number] = [x, y, z];
    
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
  
  const fallbackRadius = 50 + Math.random() * 20;
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