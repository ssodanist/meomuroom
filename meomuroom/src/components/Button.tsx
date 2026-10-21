import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-moss-500 text-white hover:bg-moss-600 active:bg-moss-700',
  secondary:
    'bg-white text-moss-700 border-2 border-moss-300 hover:bg-moss-50',
  ghost: 'bg-transparent text-ink-700 hover:bg-moss-50',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', fullWidth, className = '', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`min-h-touch rounded-xl px-6 text-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        variantClasses[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    />
  );
});

export default Button;
