// Marketing homepage - public access
export default function HomePage() {
  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-[--pp-text] mb-6">
          Professional Trading Journal
        </h1>
        <p className="text-xl text-[--pp-muted] mb-8 max-w-2xl mx-auto">
          Advanced portfolio analytics, options pricing, and comprehensive trade tracking for serious traders.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/login?intent=signup"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-[--pp-accent] hover:bg-[--pp-accent]/90 rounded-lg transition-colors"
          >
            Start Free Trial
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-[--pp-text] border border-[--pp-border] hover:bg-[--pp-card] rounded-lg transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}
