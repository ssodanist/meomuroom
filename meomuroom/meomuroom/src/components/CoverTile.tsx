import { categoryStyle } from '@/lib/categories';

export default function CoverTile({
  category,
  className = '',
  iconClassName = 'text-3xl',
}: {
  category: string;
  className?: string;
  iconClassName?: string;
}) {
  const { bg, icon } = categoryStyle(category);
  return (
    <div
      className={`flex shrink-0 items-center justify-center ${className}`}
      style={{ background: bg }}
      aria-hidden
    >
      <span className={iconClassName}>{icon}</span>
    </div>
  );
}
