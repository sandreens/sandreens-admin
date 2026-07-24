import React from 'react';

export default function Logo({ height = 44, color = '#000000', className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} style={{ height }}>
      <svg
        height={height}
        viewBox="0 0 580 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: '100%', width: 'auto', display: 'block' }}
      >
        <g transform="translate(10, 8)">
          {/* Outer Diamond */}
          <rect x="24" y="24" width="80" height="80" rx="10" transform="rotate(45 64 64)" fill="none" stroke={color} strokeWidth="5.5" strokeLinejoin="round"/>
          {/* Inner Diamond */}
          <rect x="30" y="30" width="68" height="68" rx="6" transform="rotate(45 64 64)" fill="none" stroke={color} strokeWidth="2.8" strokeLinejoin="round"/>
          {/* Calligraphic S */}
          <path d="M 88,18 C 98,8 82,2 66,14 C 44,28 38,50 58,58 C 78,66 84,82 62,102 C 44,118 28,106 38,92 C 46,82 56,86 50,94 C 44,102 32,104 46,94 C 64,80 60,64 48,56 C 32,46 34,24 58,12 C 74,4 98,10 88,18 Z" fill={color} />
          <path d="M 32,84 C 22,92 18,104 36,108 C 52,110 72,100 86,112 C 94,118 82,126 70,120" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round"/>
        </g>
        {/* Crisp Bold Wordmark with clear letter spacing */}
        <text
          x="152"
          y="98"
          fill={color}
          stroke={color}
          strokeWidth="1.2"
          style={{
            fontFamily: "'Great Vibes', 'Alex Brush', 'Playball', cursive",
            fontSize: '94px',
            fontWeight: 'bold',
            letterSpacing: '3px',
            paintOrder: 'fill stroke'
          }}
        >
          Sandreens
        </text>
      </svg>
    </div>
  );
}
