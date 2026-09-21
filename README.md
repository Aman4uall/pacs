# PACS AI website

The website for PACS AI: hands-on AI courses in Mangalore for Class 8–10 and BBA students, plus the AI Song Challenge.

**Live address:** https://pacsai.pacsglobal.in

## Hosting

This is a plain static website. There's no build step, no server code and no database to set up.

- **Publish the repository root as-is.** `index.html` is the home page.
- **Any static host works:** Netlify, Vercel, Cloudflare Pages, GitHub Pages, or ordinary web hosting (upload the files to `public_html`).
- **Domain:** point the subdomain `pacsai.pacsglobal.in` at the host (usually a CNAME record at whoever manages `pacsglobal.in`), and turn on HTTPS.
- **If the address changes,** update it in the `<link rel="canonical">` and `og:` tags of every page, in `robots.txt` and in `sitemap.xml`. The QR code on the printed flyer also points to `https://pacsai.pacsglobal.in/song-challenge.html`.

## After it's live

1. Open https://pacsai.pacsglobal.in/song-challenge.html and send a test entry. It should appear in the "PACS AI – AI Song Challenge entries" Google Sheet. Delete the test row afterwards.
2. Add the site to [Google Search Console](https://search.google.com/search-console) and submit `https://pacsai.pacsglobal.in/sitemap.xml`.

## Where things are

| What | Where |
|---|---|
| Phone, WhatsApp, email, address, Instagram, Demo Day date, Song Challenge sheet link | `assets/site.js` (the `SITE` settings at the top) |
| Styles | `assets/styles.css` |
| Animations | `assets/motion.js` (uses GSAP and Lenis from public CDNs) |
| The working demos (quiz app, mango sorter, and so on) | `assets/builds.js` |
| The Song Challenge idea machine and entry form | `assets/challenge.js` |
| Share images for WhatsApp and social media | `assets/og-home.png`, `assets/og-song.png` |

Song Challenge entries are saved by a Google Apps Script attached to the entries sheet, in the PACS AI Google account. Nothing needs to be installed on the web host for this.
