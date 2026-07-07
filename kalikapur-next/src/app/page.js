export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 font-sans dark:from-zinc-900 dark:to-black">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-20 px-8 text-center">
        
        <div className="mb-10 p-6 bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-orange-200 dark:border-zinc-700 transform transition hover:scale-105 duration-500">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-4">
            Kalikapur Nabin Sangha
          </h1>
          <h2 className="text-2xl md:text-3xl font-medium text-zinc-700 dark:text-zinc-300">
            Next.js App Router Migration
          </h2>
        </div>

        <div className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400 space-y-6">
          <p>
            Welcome to the future of the Kalikapur Ecosystem. This is a brand new, highly optimized <strong>Next.js</strong> application using the App Router, React Server Components, and Tailwind CSS.
          </p>
          <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-xl border border-orange-300 dark:border-orange-800">
            <strong>Current Status:</strong> The infrastructure has been initialized in the <code>/kalikapur-next</code> directory. We are ready to begin incrementally migrating the monolithic HTML files into modular React components!
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-6 w-full max-w-md">
          <a
            href="http://localhost:3000"
            className="flex-1 py-4 px-6 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg shadow-lg hover:shadow-orange-500/50 transition-all hover:-translate-y-1"
          >
            Explore Components
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-4 px-6 rounded-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-lg border border-zinc-200 dark:border-zinc-700 shadow hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all hover:-translate-y-1"
          >
            Next.js Docs
          </a>
        </div>

      </main>
    </div>
  );
}
