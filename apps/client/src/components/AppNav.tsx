/**
 * Shopify admin app navigation chrome using Polaris `<s-app-nav>`.
 * Renders a home link with `rel="home"` for App Bridge navigation integration.
 * Mount once near the root layout so it persists across in-app route changes.
 * @returns {import('react').ReactElement} App nav web component tree.
 */
export function AppNav() {
  return (
    <s-app-nav>
      <s-link href="/" {...({ rel: 'home' } as Record<string, string>)}>
        Home
      </s-link>
    </s-app-nav>
  );
}
