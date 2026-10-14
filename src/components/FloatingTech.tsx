/**
 * Decorative tech chips drifting behind the hero.
 *
 * Purely ornamental: `aria-hidden`, pointer-events off, and the whole layer is
 * removed under `prefers-reduced-motion` (see `.float-layer` in index.css).
 * Positions are percentages of the hero box so the layer scales with it, and
 * each chip carries its own delay so they never move in lockstep.
 */
const CHIPS = [
  { label: 'Laravel', top: '12%', inlineStart: '4%', delay: '0s', scale: 1 },
  { label: 'React', top: '64%', inlineStart: '2%', delay: '-2.6s', scale: 0.92 },
  { label: 'PyTorch', top: '28%', inlineStart: '86%', delay: '-1.3s', scale: 0.96 },
  { label: 'MySQL', top: '78%', inlineStart: '78%', delay: '-3.9s', scale: 0.88 },
  { label: 'Docker', top: '6%', inlineStart: '62%', delay: '-5.2s', scale: 0.84 },
  { label: 'Redis', top: '88%', inlineStart: '38%', delay: '-4.4s', scale: 0.8 },
];

export function FloatingTech() {
  return (
    <div className="float-layer pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      {CHIPS.map((chip) => (
        <span
          key={chip.label}
          className="float-chip eyebrow absolute rounded-full border border-line bg-surface/70 px-2.5 py-1 text-fg-subtle backdrop-blur-sm"
          style={{
            top: chip.top,
            insetInlineStart: chip.inlineStart,
            animationDelay: chip.delay,
            scale: chip.scale,
          }}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}
