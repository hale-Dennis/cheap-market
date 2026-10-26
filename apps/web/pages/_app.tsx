import type { AppProps } from 'next/app';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { Toaster } from 'sonner';

import '@/styles/globals.css';

const displayFont = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'] });
const sansFont = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Set on :root rather than a wrapper so portalled dialogs and toasts get the fonts too. */}
      <style jsx global>{`
        :root {
          --font-sans: ${sansFont.style.fontFamily};
          --font-display: ${displayFont.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
      {/* Default (not richColors) styling: richColors' green-on-green text fails WCAG AA contrast. */}
      <Toaster position="bottom-right" closeButton />
    </>
  );
}
