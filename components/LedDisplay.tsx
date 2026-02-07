import React from 'react';

interface LedDisplayProps {
  value: string | number;
  color?: 'red' | 'green' | 'yellow' | 'white';
  className?: string;
  digitClassName?: string;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export const LedDisplay: React.FC<LedDisplayProps> = ({ 
  value, 
  color = 'white', 
  className = '',
  digitClassName = '',
  onTouchStart,
  onTouchEnd
}) => {
  
  const colorClass = {
    red: 'led-red',
    green: 'led-green',
    yellow: 'led-yellow',
    white: 'led-white',
  }[color];

  return (
    <div 
      className={`relative bg-black border-2 md:border-4 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center ${className}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Grid effect overlay */}
      <div className="absolute inset-0 led-matrix-bg z-0 pointer-events-none opacity-50"></div>
      
      {/* Value */}
      <span className={`font-led ${colorClass} relative z-10 leading-none tracking-widest select-none ${digitClassName}`}>
        {value}
      </span>
    </div>
  );
};
