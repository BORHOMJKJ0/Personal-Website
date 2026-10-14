import { getOrg } from '@/data/orgs';
import { assetUrl } from '@/lib/assets';

/**
 * Organisation mark for experience, volunteering and education entries.
 *
 * Real logos are drawn on a light tile in both themes. Most institutional
 * marks are dark artwork on transparency and disappear against a dark
 * background; a neutral tile is the standard fix and reads as intentional
 * rather than as a bug. Where no official logo could be sourced, an initials
 * badge in the site's own accent takes its place.
 */
export function Logo({
  org,
  name,
  size = 'md',
}: {
  /** Key into src/data/orgs.ts. */
  org: string | undefined;
  /** Organisation name, used for the alt text. */
  name: string;
  size?: 'md' | 'lg';
}) {
  const entry = getOrg(org);
  const box = size === 'lg' ? 'size-14' : 'size-11';

  if (!entry?.file) {
    return (
      <span
        className={`${box} grid shrink-0 place-items-center rounded-xl bg-accent-soft font-display text-sm font-bold text-accent ring-1 ring-accent/20`}
        aria-hidden="true"
      >
        {entry?.initials ?? name.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className={`${box} grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-line`}
    >
      <img
        src={assetUrl(entry.file)}
        alt={name}
        width={64}
        height={64}
        loading="lazy"
        decoding="async"
        className="size-full object-contain"
      />
    </span>
  );
}
