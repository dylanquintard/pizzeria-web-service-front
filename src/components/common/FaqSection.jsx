export default function FaqSection({
  title,
  items = [],
  eyebrow = "",
  intro = "",
  className = "",
}) {
  const normalizedItems = Array.isArray(items) ? items.filter((item) => item?.question && item?.answer) : [];

  if (normalizedItems.length === 0) return null;

  return (
    <section className={`glass-panel p-6 sm:p-8 ${className}`.trim()}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 font-display text-3xl uppercase tracking-wide text-white">
        {title}
      </h2>
      {intro ? <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">{intro}</p> : null}

      <div className="mt-5 space-y-4">
        {normalizedItems.map((item, index) => (
          <article
            key={`${item.question}-${index}`}
            className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-white sm:text-base">{item.question}</h3>
            <p className="mt-2 text-sm leading-7 text-stone-300">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
