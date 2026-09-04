import SessionContinueClient from './SessionContinueClient';

export default function SessionContinuePage({
  searchParams,
}: {
  searchParams: { to?: string };
}) {
  const to = searchParams.to && searchParams.to.startsWith('/') ? searchParams.to : '/';
  return <SessionContinueClient to={to} />;
}
