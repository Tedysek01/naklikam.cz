import { cn } from '@/utils/cn';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-auto max-w-[160px]',
  md: 'h-10 w-auto max-w-[200px]', 
  lg: 'h-12 w-auto max-w-[240px]',
  xl: 'h-16 w-auto max-w-[320px]'
};

export function Logo({ className, size = 'md' }: LogoProps) {
  return (
    <img 
      src="/naklikam.cz_webp_logo.webp"
      alt="Naklikam.cz"
      className={cn(
        'object-contain',
        sizeClasses[size],
        className
      )}
      loading="lazy"
    />
  );
}

export default Logo;