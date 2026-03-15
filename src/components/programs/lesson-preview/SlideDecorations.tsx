import type { SlideTheme } from './slideThemes';

interface Props {
  theme: SlideTheme;
}

export function SlideDecoration({ theme }: Props) {
  const { decorationType, accentColor } = theme;

  if (decorationType === 'swirl') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-15" viewBox="0 0 800 600" fill="none">
        <path
          d="M400 -50 C 500 100, 200 200, 450 350 S 300 500, 400 650"
          stroke={accentColor}
          strokeWidth="60"
          strokeLinecap="round"
        />
        <circle cx="650" cy="100" r="80" stroke={accentColor} strokeWidth="2" opacity="0.3" />
      </svg>
    );
  }

  if (decorationType === 'circles') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-12" viewBox="0 0 800 600" fill="none">
        <circle cx="700" cy="80" r="120" stroke={accentColor} strokeWidth="1.5" />
        <circle cx="700" cy="80" r="180" stroke={accentColor} strokeWidth="1" opacity="0.5" />
        <circle cx="700" cy="80" r="250" stroke={accentColor} strokeWidth="0.5" opacity="0.3" />
        <circle cx="100" cy="500" r="90" stroke={accentColor} strokeWidth="1.5" />
        <circle cx="100" cy="500" r="140" stroke={accentColor} strokeWidth="1" opacity="0.5" />
      </svg>
    );
  }

  if (decorationType === 'waves') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-10" viewBox="0 0 800 600" fill="none">
        <path d="M0 400 Q200 350 400 400 T800 400" stroke={accentColor} strokeWidth="2" fill="none" />
        <path d="M0 430 Q200 380 400 430 T800 430" stroke={accentColor} strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M0 460 Q200 410 400 460 T800 460" stroke={accentColor} strokeWidth="1" fill="none" opacity="0.3" />
        <path d="M0 150 Q300 100 600 180 T800 120" stroke={accentColor} strokeWidth="1.5" fill="none" opacity="0.4" />
      </svg>
    );
  }

  if (decorationType === 'dots') {
    const dots = [];
    for (let i = 0; i < 40; i++) {
      const x = Math.sin(i * 2.3) * 350 + 400;
      const y = Math.cos(i * 1.7) * 250 + 300;
      const r = (i % 5) + 2;
      dots.push(<circle key={i} cx={x} cy={y} r={r} fill={accentColor} opacity={0.15 + (i % 3) * 0.08} />);
    }
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]" viewBox="0 0 800 600">
        {dots}
      </svg>
    );
  }

  if (decorationType === 'grid') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-8" viewBox="0 0 800 600" fill="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 70 + 30} y1="0" x2={i * 70 + 30} y2="600" stroke={accentColor} strokeWidth="0.5" opacity="0.15" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 70 + 30} x2="800" y2={i * 70 + 30} stroke={accentColor} strokeWidth="0.5" opacity="0.15" />
        ))}
        <rect x="240" y="160" width="140" height="140" rx="8" stroke={accentColor} strokeWidth="1.5" opacity="0.2" />
        <rect x="500" y="300" width="100" height="100" rx="8" stroke={accentColor} strokeWidth="1" opacity="0.15" />
      </svg>
    );
  }

  if (decorationType === 'diagonal') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-12" viewBox="0 0 800 600" fill="none">
        <line x1="600" y1="0" x2="800" y2="200" stroke={accentColor} strokeWidth="40" strokeLinecap="round" opacity="0.15" />
        <line x1="650" y1="0" x2="800" y2="150" stroke={accentColor} strokeWidth="2" opacity="0.3" />
        <line x1="0" y1="500" x2="200" y2="600" stroke={accentColor} strokeWidth="30" strokeLinecap="round" opacity="0.1" />
        <polygon points="700,0 800,0 800,100" fill={accentColor} opacity="0.08" />
      </svg>
    );
  }

  if (decorationType === 'blob') {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-10" viewBox="0 0 800 600" fill="none">
        <ellipse cx="650" cy="120" rx="200" ry="150" fill={accentColor} opacity="0.08" />
        <ellipse cx="150" cy="480" rx="160" ry="120" fill={accentColor} opacity="0.06" />
        <path
          d="M550 400 Q600 300 700 350 Q750 400 700 450 Q650 500 550 450 Z"
          fill={accentColor}
          opacity="0.05"
        />
      </svg>
    );
  }

  return null;
}
