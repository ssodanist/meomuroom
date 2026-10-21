import Link from 'next/link';

export default function PageHeader({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex min-h-touch items-center gap-2 border-b border-moss-100 bg-cream-50/95 px-4 py-3 backdrop-blur">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="뒤로 가기"
          className="flex h-touch w-touch shrink-0 items-center justify-center rounded-full text-2xl text-ink-700 hover:bg-moss-100"
        >
          ←
        </Link>
      ) : null}
      <h1 className="flex-1 truncate text-xl font-bold text-ink-900">{title}</h1>
      {action}
    </header>
  );
}
