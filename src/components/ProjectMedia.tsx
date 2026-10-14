import { useEffect, useRef, useState } from 'react';
import type { ProjectMedia as Media } from '@/data/projects';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { assetUrl } from '@/lib/assets';

/**
 * Cover image with an optional looping demo on top.
 *
 * Desktop plays the demo on hover; touch devices have no hover, so there it
 * plays while the card is on screen. Nothing autoplays under
 * `prefers-reduced-motion`, and the video is only attached to the DOM once it
 * is wanted, so a page of cards costs one image each until interacted with.
 */
export function ProjectMedia({
  media,
  alt,
  hovered,
  eager = false,
}: {
  media: Media;
  alt: string;
  /** Card hover state, owned by the parent. */
  hovered: boolean;
  eager?: boolean;
}) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const [canHover, setCanHover] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  // Touch devices: play while the card is on screen.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || canHover || reduced || !media.demo) return;

    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canHover, reduced, media.demo]);

  const wanted = Boolean(media.demo) && !reduced && (canHover ? hovered : inView);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (wanted) {
      void video.play().then(
        () => setPlaying(true),
        () => setPlaying(false), // autoplay refused; the cover stays up
      );
    } else {
      video.pause();
      video.currentTime = 0;
      setPlaying(false);
    }
  }, [wanted]);

  return (
    <div ref={containerRef} className="card-media">
      <img
        src={assetUrl(media.cover)}
        alt={alt}
        width={1280}
        height={800}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />

      {wanted || playing ? (
        <video
          ref={videoRef}
          className={playing ? 'is-playing' : ''}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={assetUrl(media.demo!.webm)} type="video/webm" />
          {media.demo!.mp4 ? (
            <source src={assetUrl(media.demo!.mp4)} type="video/mp4" />
          ) : null}
        </video>
      ) : null}
    </div>
  );
}
