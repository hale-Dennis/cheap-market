import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** Waits for running CSS transitions/animations (e.g. a toast fading in), so contrast is measured on final colours. */
export async function settleAnimations(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  );
}

/** WCAG 2.1 A/AA violations on the page (or within `include`), after animations settle. */
export async function scanWcag(page: Page, include?: string) {
  await settleAnimations(page);
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
  if (include) builder = builder.include(include);
  return (await builder.analyze()).violations;
}
