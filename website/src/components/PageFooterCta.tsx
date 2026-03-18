import { AppDownload } from './AppDownload';

export function PageFooterCta() {
  return (
    <section className="px-6 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <AppDownload variant="cardWithStars" />
      </div>
    </section>
  );
}
