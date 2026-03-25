export const EVENT_THEMES = [
  {
    gradient: 'linear-gradient(148deg, #a04820 0%, #c87040 55%, #e09858 100%)',
    svg: (
      <svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={220 + i * 22} y1={-10} x2={80 + i * 22} y2={260} stroke="white" strokeWidth="0.7" opacity="0.18" />
        ))}
        <g transform="translate(295,55)" opacity="0.22" stroke="white" strokeWidth="1.2" strokeLinecap="round">
          <line x1="0" y1="-18" x2="0" y2="18" />
          <line x1="-18" y1="0" x2="18" y2="0" />
          <line x1="-13" y1="-13" x2="13" y2="13" />
          <line x1="13" y1="-13" x2="-13" y2="13" />
        </g>
        <circle cx="60" cy="38" r="28" fill="none" stroke="white" strokeWidth="0.8" opacity="0.12" strokeDasharray="4 3" />
        <circle cx="60" cy="38" r="16" fill="none" stroke="white" strokeWidth="0.6" opacity="0.1" />
        {[
          [140, 30],
          [170, 18],
          [155, 48],
          [320, 160],
          [335, 140],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="white" opacity="0.15" />
        ))}
      </svg>
    ),
  },
  {
    gradient: 'linear-gradient(148deg, #2a0812 0%, #5a1428 55%, #782038 100%)',
    svg: (
      <svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {[
          [280, 80, 48],
          [310, 140, 30],
          [255, 165, 18],
          [290, 40, 14],
          [240, 50, 8],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="0.9" opacity={0.14 + i * 0.02} />
        ))}
        <path d="M320 240 C300 180 280 140 300 80 C315 40 290 20 260 30" fill="none" stroke="white" strokeWidth="1" opacity="0.16" strokeLinecap="round" />
        <path d="M300 80 C280 70 265 80 260 95" fill="none" stroke="white" strokeWidth="0.8" opacity="0.14" strokeLinecap="round" />
        <path d="M290 120 C268 110 258 118 252 135" fill="none" stroke="white" strokeWidth="0.8" opacity="0.14" strokeLinecap="round" />
        {[
          [265, 95],
          [268, 102],
          [272, 98],
          [275, 106],
          [261, 101],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="white" opacity="0.12" />
        ))}
      </svg>
    ),
  },
  {
    gradient: 'linear-gradient(148deg, #7a5008 0%, #a87020 55%, #c89038 100%)',
    svg: (
      <svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {[
          { x: 230, w: 18, h: 120, r: -8 },
          { x: 256, w: 24, h: 140, r: -3 },
          { x: 288, w: 20, h: 130, r: 4 },
          { x: 316, w: 16, h: 110, r: 10 },
          { x: 340, w: 22, h: 125, r: 16 },
        ].map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={50}
            width={b.w}
            height={b.h}
            rx="3"
            fill="none"
            stroke="white"
            strokeWidth="0.9"
            opacity="0.15"
            transform={`rotate(${b.r} ${b.x + b.w / 2} 110)`}
          />
        ))}
        <path d="M40 70 C80 60 110 65 120 70 C110 75 80 80 40 70Z" fill="white" opacity="0.08" />
        <path d="M40 70 C10 55 8 40 20 30 C35 58 40 70 40 70Z" fill="white" opacity="0.07" />
        {[
          [170, 30],
          [182, 30],
          [194, 30],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="white" opacity="0.18" />
        ))}
      </svg>
    ),
  },
  {
    gradient: 'linear-gradient(148deg, #4a2810 0%, #7a4820 55%, #a06830 100%)',
    svg: (
      <svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {[60, 42, 26, 14].map((r, i) => (
          <circle key={i} cx="295" cy="80" r={r} fill="none" stroke="white" strokeWidth="0.8" opacity={0.1 + i * 0.03} />
        ))}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={295}
              y1={80}
              x2={295 + Math.cos(rad) * 64}
              y2={80 + Math.sin(rad) * 64}
              stroke="white"
              strokeWidth="0.7"
              opacity="0.14"
            />
          );
        })}
        <path d="M60 240 C62 200 58 160 64 120" stroke="white" strokeWidth="1" fill="none" opacity="0.18" strokeLinecap="round" />
        {[
          [64, 120],
          [62, 135],
          [66, 148],
          [60, 162],
        ].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="8" ry="4" fill="white" opacity="0.12" transform={`rotate(${i % 2 === 0 ? 30 : -30} ${x} ${y})`} />
        ))}
        <path d="M85 240 C87 195 83 155 88 110" stroke="white" strokeWidth="1" fill="none" opacity="0.14" strokeLinecap="round" />
      </svg>
    ),
  },
];

export const CARD_ROTATIONS = [-1.8, 1.2, -0.7, 2.1];
