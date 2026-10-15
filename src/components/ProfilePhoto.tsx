import { useTranslation } from 'react-i18next';
import { identity } from '@/data/profile';

/**
 * Small circular face crop (navbar, footer). Explicit size, so it never shifts
 * layout; the srcset gives a crisp image at 1x–3x without shipping the 256px
 * master to a 28px slot. The hairline ring keeps the edge defined on both
 * the light and the dark background.
 */
export function ProfilePhoto({
  size,
  lazy = false,
  className = '',
}: {
  size: number;
  /** Below the fold (footer): load when it approaches the viewport. */
  lazy?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const image = identity.face(size);

  return (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.sizes}
      width={size}
      height={size}
      alt={t('hero.photoAlt')}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      className={`shrink-0 rounded-full bg-surface-alt object-cover ring-1 ring-line ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
