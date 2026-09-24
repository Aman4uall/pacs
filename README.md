# PACS AI website

The website for PACS AI: hands-on AI courses in Mangalore for Class 8–12 and BBA/BBM students, a 36-skill AI for Everyone catalogue, and a Class 8–12 AI Song Challenge.

**Live address:** https://pacsai.pacsglobal.in

## Hosting

This is a plain static website. There's no build step, no server code and no database to set up.

- **Publish the contents of the `website` directory.** `index.html` is the home page. Include all stylesheets and scripts in `assets`.
- **Any static host works:** Netlify, Vercel, Cloudflare Pages, GitHub Pages, or ordinary web hosting (upload the files to `public_html`).
- **Domain:** point the subdomain `pacsai.pacsglobal.in` at the host (usually a CNAME record at whoever manages `pacsglobal.in`), and turn on HTTPS.
- **If the address changes,** update it in the `<link rel="canonical">` and `og:` tags of every page, in `robots.txt` and in `sitemap.xml`. The QR code on the printed flyer also points to `https://pacsai.pacsglobal.in/song-challenge.html`.

## After it's live

1. Open https://pacsai.pacsglobal.in/song-challenge.html and send a test entry. It should appear in the "PACS AI – AI Song Challenge entries" Google Sheet. Delete the test row afterwards.
2. Open https://pacsai.pacsglobal.in/learn.html, tick a couple of things and send the list. It should open WhatsApp, and appear in the **Learn requests** tab of the same sheet. Delete the test row afterwards.
3. Add the site to [Google Search Console](https://search.google.com/search-console) and submit `https://pacsai.pacsglobal.in/sitemap.xml`.

## Where things are

| What | Where |
|---|---|
| Phone, WhatsApp, email, address, Instagram, Demo Day date, Google Sheet links | `assets/site.js` (the `SITE` settings at the top) |
| Styles | `assets/styles.css`, `assets/refresh.css` for layout, and `assets/motion.css` for animation |
| Card journeys, entrances, flip cards, hover lighting, BBA portfolio, reading progress and mobile enquiry bar | `assets/motion.js` (native browser APIs; no external animation libraries) |
| The working demos (mango sorter, study coach, Python game, revision app, film storyboard, campaign post, break-even, pitch deck) and the home page Class 8–12 / BBA demo tabs | `assets/builds.js` |
| The Song Challenge idea machine and entry form | `assets/challenge.js` |
| AI for Everyone: 36 skills in seven categories, search and plan review | `learn.html`, with `assets/learn.js` |
| Share images for WhatsApp and social media | `assets/og-home.png`, `assets/og-song.png` |

Song Challenge entries are saved by a Google Apps Script attached to the entries sheet, in the PACS AI Google account. Nothing needs to be installed on the web host for this.

Skill choices stay in the current browser tab's session storage. They are sent to the Learn requests sheet only when the visitor explicitly continues from the review dialog to WhatsApp. The site opens a draft; the visitor sends the message in WhatsApp. No booking or payment is completed by these buttons.

The research and its limits are recorded in `../design-notes/ai-skills-research.md`. Category ordering is editorial, not a measured local popularity ranking. The course and challenge eligibility updates require publishing the website and updating the Apps Script deployment separately.

The home page and six-month Creator Programme include scroll-driven tablet decks. They use native sticky positioning and leave scrolling under the visitor's control, with previous/next and skip links. Short viewports and reduced-motion preferences get a readable static journey. Session cards support hover, tap and keyboard activation; on the BBA page the CV is struck through and rewritten as you scroll (it plays by itself on phones), the Bootcamp sessions light up along a red line, the 12-week Studio plays through its weeks, the client briefs turn over, and the white "Three hours" finale moves its red marker and ribbon with the scroll. Decorative loops pause outside the viewport or when the tab is hidden.
