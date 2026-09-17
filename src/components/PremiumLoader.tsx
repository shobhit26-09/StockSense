import { Loader2 } from 'lucide-react';

interface PremiumLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const PremiumLoader = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: PremiumLoaderProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-primary-light/20 animate-pulse blur-lg"></div>
      </div>
      <div className="text-center">
        <p className={`${textSizes[size]} font-semibold text-foreground animate-pulse`}>
          {text}
        </p>
        <div className="mt-2 flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLoader;