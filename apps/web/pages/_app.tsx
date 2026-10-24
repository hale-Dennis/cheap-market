import type { AppProps } from 'next/app';
import { Toaster } from 'sonner';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      {/* Default (not richColors) styling: richColors' green-on-green text fails WCAG AA contrast. */}
      <Toaster position="bottom-right" closeButton />
    </>
  );
}
