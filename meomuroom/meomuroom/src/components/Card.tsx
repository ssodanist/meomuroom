import { HTMLAttributes } from 'react';

export default function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-moss-100 bg-white p-4 shadow-sm ${className}`}
      {...props}
    />
  );
}
