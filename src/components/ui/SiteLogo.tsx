import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logoS from '@/assets/logo-s.png';

interface SiteLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  linked?: boolean;
  to?: string;
  className?: string;
  showText?: boolean;
  animate?: boolean;
}

const sizeMap = {
  xs: 'h-5 w-5',
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};

const textSizeMap = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

export function SiteLogo({
  size = 'sm',
  linked = true,
  to = '/',
  className,
  showText = true,
  animate = false,
}: SiteLogoProps) {
  const content = (
    <span className={cn('flex items-center gap-2', className)}>
      <img
        src={logoS}
        alt="Siteviral"
        className={cn(
          sizeMap[size],
          'object-contain rounded-md',
          animate && 'hover:scale-110 transition-transform duration-200'
        )}
      />
      {showText && (
        <span className={cn('font-extrabold tracking-tight text-foreground', textSizeMap[size])}>
          Siteviral
        </span>
      )}
    </span>
  );

  if (!linked) return content;

  return (
    <Link to={to} className="inline-flex">
      {content}
    </Link>
  );
}
