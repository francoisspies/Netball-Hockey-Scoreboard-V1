
import React, { memo } from 'react';

// 5x9 Dot Matrix Font Definition
// 1 = Dot On, 0 = Dot Off
const CHAR_MAP: Record<string, number[][]> = {
  '0': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  '1': [
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,1,1,0],
  ],
  '2': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  '3': [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,1],
  ],
  '4': [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
  ],
  '5': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,1,1,1,0],
  ],
  '6': [
    [0,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  '7': [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
  '8': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  '9': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,1,1,1,0],
  ],
  ':': [
    [0,0],
    [0,0],
    [0,0],
    [1,1],
    [1,1],
    [0,0],
    [1,1],
    [1,1],
    [0,0],
  ],
  ' ': [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
  ]
};

interface DotMatrixProps {
  value: string | number;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  minDigits?: number;
  className?: string;
  style?: React.CSSProperties;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

interface DotMatrixDigitProps {
  char: string;
  color: string;
  dotClass: string;
}

const SIZE_CLASSES = {
  sm: 'w-1 h-1',
  md: 'w-1.5 h-1.5',
  lg: 'w-1.5 h-1.5 md:w-[8px] md:h-[8px] lg:w-[10px] lg:h-[10px]', 
  xl: 'w-[6.6px] h-[6.6px] md:w-[11px] md:h-[11px] lg:w-[16.5px] lg:h-[16.5px]',
};

const DotMatrixDigit = memo(({ char, color, dotClass }: DotMatrixDigitProps) => {
  const grid = CHAR_MAP[char] || CHAR_MAP[' '];
  
  return (
    <div className="flex flex-col space-y-[1px] md:space-y-[2px]">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex space-x-[1px] md:space-x-[2px]">
          {row.map((isOn, colIndex) => (
            <div
              key={colIndex}
              style={{
                backgroundColor: isOn ? color : '#1a1a1a',
                boxShadow: isOn ? `0 0 6px ${color}` : 'none',
              }}
              className={`rounded-[1px] transition-colors duration-75 ${dotClass}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
});

DotMatrixDigit.displayName = 'DotMatrixDigit';

export const DotMatrix = memo(({ 
  value, 
  color = '#ffffff', 
  size = 'md', 
  minDigits = 0,
  className = '',
  style,
  onTouchStart,
  onTouchEnd
}: DotMatrixProps) => {
  const safeValue = value ?? '';
  const strValue = safeValue.toString().padStart(minDigits, '0');
  const dotClass = SIZE_CLASSES[size];

  return (
    <div 
      className={`bg-black p-2 md:p-5 border-2 md:border-4 border-white/20 rounded-lg inline-flex space-x-2 md:space-x-5 items-center justify-center shadow-2xl transition-all duration-300 ${className}`}
      style={style}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {strValue.split('').map((char: string, i: number) => (
        <DotMatrixDigit key={i} char={char} color={color} dotClass={dotClass} />
      ))}
    </div>
  );
});

DotMatrix.displayName = 'DotMatrix';
