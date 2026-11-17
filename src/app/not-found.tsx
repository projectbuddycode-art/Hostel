import Link from "next/link";

export default function NotFound() {
  return (
    <main id="content" className="grid min-h-screen place-items-center bg-ivory px-6 text-center">
      <div>
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-golddeep">404</p>
        <h1 className="mt-4 font-serif text-6xl text-navy">This place is not set.</h1>
        <p className="mx-auto mt-4 max-w-md text-ink/70">The page is not on the menu. Return to the house, or look through the memberships.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-navy">Home</Link>
          <Link href="/memberships" className="btn btn-line-dark">Memberships</Link>
        </div>
      </div>
    </main>
  );
}
