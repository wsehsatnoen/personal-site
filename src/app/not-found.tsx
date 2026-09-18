import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="intro">
        <h1>Not found</h1>
        <p>That page does not exist.</p>
      </div>
      <p>
        <Link className="text-link" href="/">
          back home
        </Link>
      </p>
    </div>
  );
}
