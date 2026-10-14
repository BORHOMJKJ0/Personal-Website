import { useTranslation } from 'react-i18next';
import { profilePhoto } from '@/data/profile';
import { assetUrl } from '@/lib/assets';

/**
 * Hero portrait.
 *
 * To change the photo, replace `public/images/profile.jpg` with your own —
 * same filename, no code change. Vite adds a content version to the URL.
 * Use a face-focused square crop, at most 800px. The fixed square frame uses
 * `object-fit: cover` anchored to the top; check the face remains visible.
 */
export function Avatar() {
  const { t } = useTranslation();

  return (
    <div className="hero-portrait relative shrink-0">
      {/* Soft accent glow behind the frame. */}
      <div
        className="portrait-glow absolute -inset-3 -z-10 rounded-[2rem] bg-accent/15 blur-2xl"
        aria-hidden="true"
      />
      <svg className="portrait-orbit" viewBox="0 0 208 208" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="206" height="206" rx="32" pathLength="1" />
      </svg>
      <div className="portrait-frame relative aspect-square w-36 overflow-hidden rounded-[1.75rem] border border-line bg-surface-alt shadow-card sm:w-44 lg:w-52">
        <img
          src={assetUrl(profilePhoto)}
          alt={t('hero.photoAlt')}
          width={416}
          height={416}
          loading="eager"
          decoding="async"
          className="size-full object-cover object-top"
        />
      </div>
      {/* Thin accent rule that reads as part of the frame, mirrored in RTL. */}
      <span
        className="absolute -bottom-1.5 start-5 h-1 w-16 rounded-full bg-accent"
        aria-hidden="true"
      />
    </div>
  );
}
