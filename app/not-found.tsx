import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-shell">
      <section className="panel mx-auto mt-10 max-w-xl p-8 text-center">
        <h1 className="text-3xl font-bold">Project Not Found</h1>
        <p className="mt-3 text-[var(--muted)]">Check project code and try again.</p>
        <Link href="/" className="mt-5 inline-block rounded-xl bg-[var(--brand)] px-4 py-2 font-semibold text-white">
          Go Home
        </Link>
      </section>
    </main>
  );
}

