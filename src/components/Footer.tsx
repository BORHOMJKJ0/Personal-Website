import { ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Container } from './Section';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-line py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs leading-relaxed text-fg-subtle">
            <p>{t('footer.builtBy')}</p>
            <p className="mt-1">{t('footer.builtWith')}</p>
          </div>

          <a
            href="#top"
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-xs font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowUp className="size-3.5" aria-hidden="true" />
            {t('footer.backToTop')}
          </a>
        </div>
      </Container>
    </footer>
  );
}
