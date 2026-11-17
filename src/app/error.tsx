"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="content" className="grid min-h-screen place-items-center bg-ivory px-6 text-center">
      <div>
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-golddeep">A pause</p>
        <h1 className="mt-4 font-serif text-5xl text-navy">The page could not be served.</h1>
        <button type="button" onClick={reset} className="btn btn-navy mt-8">
          Try again
        </button>
      </div>
    </main>
  );
}
