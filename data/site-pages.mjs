// Static site pages (About / Contact / Privacy / Terms / Disclaimer) and the
// localized footer label set. Content pages are English-only; footer links to
// them are shared across all locales. Legal copy is accurate generic boilerplate
// — have a lawyer review before relying on it.

export const CONTACT_EMAIL = "hello@barcodemint.com"; // TODO: replace with the real support address

// Footer link labels + tagline per locale.
export const FOOTER_I18N = {
  en: { about: "About", contact: "Contact", privacy: "Privacy", terms: "Terms", disclaimer: "Disclaimer", allBarcodes: "All barcodes", apiDocs: "API", sitemap: "Sitemap",
    tagline: "Barcode Mint — a fast, free online barcode & QR code generator. 100+ symbologies, live preview, instant PNG & SVG export." },
  de: { about: "Über uns", contact: "Kontakt", privacy: "Datenschutz", terms: "AGB", disclaimer: "Haftungsausschluss", allBarcodes: "Alle Barcodes", apiDocs: "API", sitemap: "Sitemap",
    tagline: "Barcode Mint — ein schneller, kostenloser Online-Barcode- & QR-Code-Generator. 100+ Symbologien, Live-Vorschau, sofortiger PNG- & SVG-Export." },
  pl: { about: "O nas", contact: "Kontakt", privacy: "Prywatność", terms: "Regulamin", disclaimer: "Zastrzeżenia", allBarcodes: "Wszystkie kody", apiDocs: "API", sitemap: "Mapa strony",
    tagline: "Barcode Mint — szybki, darmowy generator kodów kreskowych i QR online. 100+ symbolik, podgląd na żywo, natychmiastowy eksport PNG i SVG." },
  nl: { about: "Over ons", contact: "Contact", privacy: "Privacy", terms: "Voorwaarden", disclaimer: "Disclaimer", allBarcodes: "Alle barcodes", apiDocs: "API", sitemap: "Sitemap",
    tagline: "Barcode Mint — een snelle, gratis online barcode- & QR-codegenerator. 100+ symbologieën, live preview, directe PNG- & SVG-export." },
  fr: { about: "À propos", contact: "Contact", privacy: "Confidentialité", terms: "Conditions", disclaimer: "Avertissement", allBarcodes: "Tous les codes-barres", apiDocs: "API", sitemap: "Plan du site",
    tagline: "Barcode Mint — un générateur de codes-barres et QR en ligne, rapide et gratuit. Plus de 100 symbologies, aperçu en direct, export PNG et SVG instantané." },
  ja: { about: "概要", contact: "お問い合わせ", privacy: "プライバシー", terms: "利用規約", disclaimer: "免責事項", allBarcodes: "すべてのバーコード", apiDocs: "API", sitemap: "サイトマップ",
    tagline: "Barcode Mint — 高速で無料のオンライン・バーコード & QR コードジェネレーター。100+ の規格、ライブプレビュー、PNG・SVG を即時に書き出し。" }
};

const REVIEW_NOTE = '<p class="doc-note"><strong>Note:</strong> This is a plain-language summary provided for transparency, not legal advice. Please review it with your own counsel before relying on it.</p>';

export const STATIC_PAGES = [
  {
    slug: "about",
    title: "About Barcode Mint",
    description: "About Barcode Mint — a fast, free online barcode and QR code generator supporting 100+ symbologies with live preview and instant export.",
    eyebrow: "About",
    h1: "About Barcode Mint",
    lead: "A fast, free barcode and QR code generator that runs right in your browser.",
    bodyHtml: `
      <h2>What it is</h2>
      <p>Barcode Mint is a free online generator for more than 100 barcode and QR code symbologies — including QR, Data Matrix, PDF417, Aztec, EAN, UPC, GS1, and Code 128. You pick a symbology, type your data, tune the appearance, and export a clean PNG or SVG in seconds. No account, no watermark, no waiting.</p>
      <h2>How it works</h2>
      <p>Most barcodes render instantly in your browser. A handful of more complex 2D and postal symbologies are drawn by our rendering service and streamed back as an image. Either way, the code you see is the code you download.</p>
      <h2>What we're building next</h2>
      <p>We're working on paid Pro and API tiers for teams and developers who need more — commercial licensing, vector and high-resolution export, bulk and batch generation, and a metered REST API. The free single-barcode generator will always stay free. If that sounds useful, join the early list from the generator page.</p>
      <h2>Get in touch</h2>
      <p>Questions, bugs, or feature requests are welcome — see the <a href="/contact">contact page</a>.</p>
    `
  },
  {
    slug: "contact",
    title: "Contact Barcode Mint",
    description: "Get in touch with Barcode Mint — questions, bug reports, feature requests, and Pro/API enquiries.",
    eyebrow: "Contact",
    h1: "Contact us",
    lead: "We read every message. Here's how to reach us.",
    bodyHtml: `
      <h2>Email</h2>
      <p>For questions, bug reports, feature requests, or Pro and API enquiries, email us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. We aim to reply within a couple of business days.</p>
      <h2>Early access</h2>
      <p>Interested in Pro or API access before launch? The fastest way to hear first — with early-access launch pricing — is to join the early list on the <a href="/">generator page</a>.</p>
      <h2>Reporting a problem</h2>
      <p>If a barcode isn't scanning or a page isn't working, let us know the symbology, the exact data you entered, and the device or scanner you're using. That detail helps us reproduce and fix issues quickly.</p>
    `
  },
  {
    slug: "privacy",
    title: "Privacy Policy — Barcode Mint",
    description: "How Barcode Mint handles your data: what we collect, the processors we use, and your choices.",
    eyebrow: "Privacy",
    h1: "Privacy Policy",
    lead: "What we collect, why, and the choices you have.",
    bodyHtml: `
      ${REVIEW_NOTE}
      <h2>The short version</h2>
      <p>Barcode Mint is built to need as little of your data as possible. There are no accounts and no advertising trackers. We use Google Analytics to understand aggregate, anonymous traffic, and the only personal information we collect is what you choose to give us — for example, your email address if you join the early-access list.</p>
      <h2>The data you enter to generate a barcode</h2>
      <p>The text or values you type to create a barcode are processed to render your code. Most symbologies are generated entirely in your browser and never leave your device. Certain complex 2D and postal symbologies are rendered by our service: that request is processed to return your image and is not used to build a profile of you. Standard, short-lived server logs (including IP address) may be kept by our hosting provider for security and reliability.</p>
      <h2>The early-access waitlist</h2>
      <p>If you join the waitlist, we store the email address you provide, the tier you expressed interest in, any feature interests you select, the page you signed up from, and a timestamp. We use this only to contact you about the launch and to decide what to build. This data is stored with <strong>Supabase</strong>, and confirmation emails are sent with <strong>Resend</strong>. You can ask us to access or delete it at any time by emailing <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
      <h2>Cookies and local storage</h2>
      <p>We use Google Analytics (GA4), which sets cookies to measure aggregate, anonymous usage — pages viewed, approximate location, and device type. We don't use advertising cookies. Your browser's local storage also keeps one preference — your chosen interface language. You can clear cookies and local storage any time through your browser.</p>
      <h2>Third parties</h2>
      <ul>
        <li><strong>Vercel</strong> — hosting and content delivery (may keep short-lived request logs).</li>
        <li><strong>Google Analytics (GA4)</strong> — aggregate, anonymous traffic analytics (Google LLC).</li>
        <li><strong>Google Fonts</strong> — web fonts are loaded from Google's servers, which may log the request, including your IP address.</li>
        <li><strong>Supabase</strong> — storage for waitlist signups.</li>
        <li><strong>Resend</strong> — sending waitlist confirmation emails.</li>
      </ul>
      <h2>Your choices</h2>
      <p>You can use the generator without giving us any personal information. If you've joined the waitlist, email us to access or delete your entry. We'll update this page if our practices change.</p>
    `
  },
  {
    slug: "terms",
    title: "Terms of Service — Barcode Mint",
    description: "The terms that apply when you use Barcode Mint.",
    eyebrow: "Terms",
    h1: "Terms of Service",
    lead: "The basics of using Barcode Mint.",
    bodyHtml: `
      ${REVIEW_NOTE}
      <h2>Using the service</h2>
      <p>Barcode Mint is provided free of charge for generating barcodes and QR codes. By using it, you agree to these terms. If you don't agree, please don't use the service.</p>
      <h2>Acceptable use</h2>
      <p>You're responsible for the data you encode and for how you use the barcodes you generate. Don't use the service for unlawful purposes, and don't attempt to disrupt, overload, or abuse it — including automated or excessive requests to our rendering service. We may rate-limit or block traffic to keep the service available for everyone.</p>
      <h2>Your barcodes</h2>
      <p>The barcodes and QR codes you generate are yours to use. Barcode symbologies are open, published standards; generating a code does not grant you rights in any brand, product identifier, or content you choose to encode.</p>
      <h2>No warranty</h2>
      <p>The service is provided "as is," without warranties of any kind. We don't guarantee that every generated code will scan in every environment, or that the service will be uninterrupted or error-free. Always test a barcode before using it in production — see our <a href="/disclaimer">disclaimer</a>.</p>
      <h2>Limitation of liability</h2>
      <p>To the fullest extent permitted by law, Barcode Mint is not liable for any indirect, incidental, or consequential damages arising from your use of the service or from any barcode you generate with it.</p>
      <h2>Changes</h2>
      <p>We may update these terms or the service itself. Continued use after a change means you accept the updated terms. Questions? <a href="/contact">Contact us</a>.</p>
    `
  },
  {
    slug: "disclaimer",
    title: "Disclaimer — Barcode Mint",
    description: "Important notes on barcode accuracy, scannability, and standards compliance.",
    eyebrow: "Disclaimer",
    h1: "Disclaimer",
    lead: "Please read this before using generated barcodes in production.",
    bodyHtml: `
      ${REVIEW_NOTE}
      <h2>Always test before you print</h2>
      <p>Barcodes are generated on a best-effort basis according to their published specifications. Real-world scannability depends on factors outside our control — print resolution, material, contrast, size, quiet zones, and the specific scanner used. Always test a generated code on your target device and print process before committing to a production run.</p>
      <h2>Standards and identifiers</h2>
      <p>Barcode Mint implements open barcode symbology standards but is not affiliated with, endorsed by, or certified by GS1 or any other standards body. For retail, logistics, healthcare, or regulatory use, confirm that your data (for example, GTINs, SSCCs, or other identifiers) is valid and correctly licensed for your use case.</p>
      <h2>No liability for misuse or misreads</h2>
      <p>We are not responsible for losses arising from incorrect data, misprinted or misread codes, or use of a barcode in a context it wasn't intended for. You are responsible for verifying that a code encodes what you expect and scans reliably.</p>
      <h2>Questions</h2>
      <p>If you're unsure whether a symbology fits your use case, <a href="/contact">get in touch</a> — we're happy to point you in the right direction.</p>
    `
  }
];
