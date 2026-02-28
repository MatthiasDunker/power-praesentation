import type { BulletListTemplateProps } from "./decode";

export function BulletListTemplate({
  title,
  subtitle,
  bullets,
  notes
}: BulletListTemplateProps) {
  return (
    <div className="grid h-full grid-cols-[1fr_300px] gap-10">
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-10 py-8">
        <h1 className="mb-5 text-[66px] leading-tight">{title}</h1>
        {subtitle ? <h2 className="mb-6 text-[36px] text-zinc-700">{subtitle}</h2> : null}
        <ul className="space-y-4 pl-8 text-[32px] leading-snug">
          {bullets.map((item, index) => (
            <li key={`${index}-${item.slice(0, 12)}`}>{item}</li>
          ))}
        </ul>
        {notes.length > 0 ? (
          <div className="mt-8 space-y-2 text-[24px] leading-snug text-zinc-600">
            {notes.map((note, index) => (
              <p key={`${index}-${note.slice(0, 12)}`}>{note}</p>
            ))}
          </div>
        ) : null}
      </section>

      <aside className="rounded-2xl border border-zinc-200 bg-white px-6 py-6">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Summary
        </p>
        <ol className="space-y-3 text-xl leading-tight text-zinc-700">
          {bullets.slice(0, 3).map((item, index) => (
            <li key={`${index}-${item.slice(0, 12)}`}>{item}</li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
