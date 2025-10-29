// app/(marketing)/about/page.jsx
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold text-center mb-4">Our Mission</h1>
      <p className="text-xl text-center text-slate-500 mb-12">
        To make high-quality, personalized nutrition simple and accessible for
        everyone.
      </p>

      <div className="space-y-6 text-slate-700 dark:text-slate-300">
        <h2 className="text-2xl font-semibold">The Problem We Faced</h2>
        <p>
          In a world full of fitness advice, the most common roadblock isn't a
          lack of motivation, but a lack of clarity. We were tired of the
          endless cycle: calculating calories, guessing portion sizes, and
          feeling guilty for not knowing what to eat. Tracking apps told us *if*
          we hit our goals, but no one told us *how*.
        </p>

        <h2 className="text-2xl font-semibold">The Spark of an Idea</h2>
        <p>
          What if a tool could do the heavy lifting for you? What if you could
          simply state your goal and receive a precise, actionable plan, every
          single day? Not just numbers, but actual meals with real ingredients,
          tailored to your body and your objectives.
        </p>
        <p>
          That's why we built FitCoach AI. We started with a powerful,
          science-based algorithm and a simple promise: to eliminate the
          guesswork from nutrition.
        </p>

        <h2 className="text-2xl font-semibold">What We Believe</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Precision over Guesswork:</strong> Your plan should be as
            unique as you are.
          </li>
          <li>
            <strong>Simplicity over Complexity:</strong> Achieving your goals
            should be straightforward, not a second job.
          </li>
          <li>
            <strong>Consistency over Intensity:</strong> The best plan is the
            one you can stick to. Our goal is to make consistency effortless.
          </li>
        </ul>

        <p className="pt-8 text-center text-lg font-medium">
          We're just getting started. Join us on this journey to a healthier,
          simpler life.
        </p>
      </div>
    </div>
  );
}
