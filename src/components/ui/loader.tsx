import React from 'react';

export const Loader = () => {
  return (
    <div
      className="relative h-[40px] w-[40px] before:content-[''] before:absolute before:top-0 before:left-0 before:h-full before:w-full before:rounded-full before:bg-white before:animate-[pulse_1.75s_ease-in-out_infinite] before:scale-0 before:transition-colors before:ease-in-out before:duration-300 after:content-[''] after:absolute after:top-0 after:left-0 after:h-full after:w-full after:rounded-full after:bg-white after:animate-[pulse_1.75s_ease-in-out_infinite] after:scale-0 after:transition-colors after:ease-in-out after:duration-300 after:delay-[calc(1.75s/-2)]"
    />
  );
};