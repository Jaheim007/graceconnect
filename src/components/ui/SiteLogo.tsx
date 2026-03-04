import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logoS from '@/assets/logo-s.png';
import { useAuth } from '@/contexts/AuthContext';

interface SiteLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  linked?: boolean;
  to?: string;
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  xs: 'h-5 w-5',
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};

export function SiteLogo({
  size = 'sm',
  linked = true,
  to,
  className,
  animate = false,
}: SiteLogoProps) {
  const { user } = useAuth();
  // When logged in, logo goes to dashboard; when not, to landing
  const destination = to ?? (user ? '/dashboard' : '/');

  const content = (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src={logoS}
        alt="Siteviral"
        className={cn(
          sizeMap[size],
          'object-contain rounded-md',
          animate && 'hover:scale-110 transition-transform duration-200'
        )}
      />
    </span>
  );

  if (!linked) return content;

  return (
    <Link to={destination} className="inline-flex">
      {content}
    </Link>
  );
}
