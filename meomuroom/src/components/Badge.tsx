export default function Badge({
  children,
  tone = 'moss',
}: {
  children: React.ReactNode;
  tone?: 'moss' | 'clay';
}) {
  const toneClasses =
    tone === 'moss'
      ? 'bg-moss-100 text-moss-700'
      : 'bg-clay-100 text-clay-500';
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${toneClasses}`}
    >
      {children}
    </span>
  );
}
