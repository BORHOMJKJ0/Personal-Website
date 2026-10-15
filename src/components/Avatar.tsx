import { useTranslation } from 'react-i18next';
import { identity } from '@/data/profile';

/**
 * Hero portrait, drawn as a circle.
 *
 * To change the photo, replace `public/images/profile.jpg` (square, face in
 * the upper middle, at least 680px) and run scripts/capture-projects/
 * identity.mjs to regenerate the sizes. URLs are versioned automatically.
 *
 * This is the mobile LCP element: it loads eagerly at high priority, and
 * vite.config.ts preloads the same srcset from the HTML.
 */
export function Avatar() {
  const { t } = useTranslation();
  const { portrait } = identity;

  return (
    <div className="hero-portrait relative shrink-0">
      {/* Soft accent glow behind the frame. */}
      <div
        className="portrait-glow motion-loop absolute -inset-3 -z-10 rounded-full bg-accent/15 blur-2xl"
        aria-hidden="true"
      />
      <svg className="portrait-orbit motion-loop" viewBox="0 0 208 208" fill="none" aria-hidden="true">
        <circle cx="104" cy="104" r="103" pathLength="1" />
      </svg>
      <div className="portrait-frame motion-loop relative aspect-square w-36 overflow-hidden rounded-full border border-line bg-surface-alt shadow-card sm:w-44 lg:w-52">
        <img
          src={portrait.src}
          srcSet={portrait.srcSet}
          sizes={portrait.sizes}
          alt={t('hero.photoAlt')}
          width={portrait.width}
          height={portrait.height}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover object-top"
        />
      </div>
    </div>
  );
}
