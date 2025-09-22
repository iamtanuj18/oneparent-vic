interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white' | 'dark';
}

export function Logo({ className = '', size = 'md', variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl', 
    lg: 'text-3xl'
  };

  const variantClasses = {
    default: 'text-gray-900',
    white: 'text-white',
    dark: 'text-black'
  };

  return (
    <div className={`font-bold tracking-tight ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      <span>oneparent</span>
      <span className="text-blue-600"> vic</span>
    </div>
  );
}