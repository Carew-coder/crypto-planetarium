import React, { useEffect, useState } from 'react';

const ShootingStars = () => {
  const [stars, setStars] = useState<{ id: number; top: number; left: number; delay: number }[]>([]);

  useEffect(() => {
    const createShootingStar = () => {
      const newStar = {
        id: Date.now(),
        top: Math.random() * 50, // Only appear in top half of screen
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
      };

      setStars(prev => [...prev, newStar]);

      // Remove star after animation
      setTimeout(() => {
        setStars(prev => prev.filter(star => star.id !== newStar.id));
      }, 1000); // Match animation duration
    };

    // Create new shooting star every 3-8 seconds
    const interval = setInterval(() => {
      if (Math.random() > 0.5) { // 50% chance to create a star
        createShootingStar();
      }
    }, Math.random() * 5000 + 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full animate-shooting-star"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            animationDelay: `${star.delay}s`,
            boxShadow: '0 0 4px #fff, 0 0 8px #fff',
          }}
        />
      ))}
    </div>
  );
};

export default ShootingStars;