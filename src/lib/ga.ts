/** GA4 web stream for patrista.com. HTML snippet and tests share this one id. */
export const GA_MEASUREMENT_ID = "G-M803MB7GYK";

const GTAG_JS_HOST = "https://www.googletagmanager.com/gtag/js?id=";

export function gtagScriptSrc(id = GA_MEASUREMENT_ID): string {
  return GTAG_JS_HOST + id;
}

/**
 * Official gtag.js snippet for the page <head>. `async` so it does not block
 * rendering. No consent UI. Ads/signals off; GA4 already anonymizes IPs.
 *
 * The first HTML load sends page_view from `config`. Client-side route changes
 * use the History API, so GA4 enhanced measurement (history-change page views,
 * on by default) sends the next page_view with the new page_path / page_location.
 * Do not also send page_view from the React app — that would double-count.
 */
export function gtagHeadSnippet(id = GA_MEASUREMENT_ID): string {
  return [
    "    <!-- Google tag (gtag.js) -->",
    '    <script async src="' + gtagScriptSrc(id) + '"></script>',
    "    <script>",
    "      window.dataLayer = window.dataLayer || [];",
    "      function gtag(){dataLayer.push(arguments);}",
    "      gtag('js', new Date());",
    "      gtag('config', '" + id + "', {",
    "        allow_google_signals: false,",
    "        allow_ad_personalization_signals: false",
    "      });",
    "    </script>"
  ].join("\n");
}

/** How many gtag.js script tags are in this HTML. Site pages must have exactly one. */
export function gtagSnippetCount(html: string): number {
  return (html.match(/googletagmanager\.com\/gtag\/js\?id=/g) || []).length;
}

/** Put the snippet in <head>. No-op when a gtag.js tag is already there. */
export function injectGtagHead(html: string, snippet = gtagHeadSnippet()): string {
  if (gtagSnippetCount(html) > 0) return html;
  if (!html.includes("</head>")) throw new Error("google-analytics: no </head>");
  return html.replace("</head>", snippet + "\n  </head>");
}
