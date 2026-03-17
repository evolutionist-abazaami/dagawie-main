export const BRAND = {
  name: "Dagawie Intelligence",
  product: "Dagawie Intelligence Platform",
  /**
   * Public site URL shown in PDFs/exports.
   * Set `VITE_PUBLIC_SITE_URL` in your deployment environment to override.
   */
  siteUrl:
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ??
    "https://dagawie-intelligence.vercel.app",
  /**
   * Support email shown in PDFs/exports.
   * Set `VITE_SUPPORT_EMAIL` in your deployment environment to override.
   */
  supportEmail:
    (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ??
    "support@dagawie-intelligence.com",
} as const;

export function formatSiteHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  }
}

