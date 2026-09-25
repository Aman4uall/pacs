# PACS AI website

The website for PACS AI: hands-on AI courses in Mangalore for Class 8–12 and BBA/BBM students, a 36-skill AI for Everyone catalogue, a Class 8–12 AI Song Challenge, and the Innovators & Hustlers Meetup.

**Live address:** https://pacsai.pacsglobal.in

## Hosting

This is a plain static website. There's no build step, no server code and no database to set up.

- **Publish the contents of the `website` directory.** `index.html` is the home page. Include all stylesheets and scripts in `assets`.
- **Any static host works:** Netlify, Vercel, Cloudflare Pages, GitHub Pages, or ordinary web hosting (upload the files to `public_html`).
- **Domain:** point the subdomain `pacsai.pacsglobal.in` at the host (usually a CNAME record at whoever manages `pacsglobal.in`), and turn on HTTPS.
- **If the address changes,** update it in the `<link rel="canonical">` and `og:` tags of every page, in `robots.txt` and in `sitemap.xml`. The QR code on the printed flyer also points to `https://pacsai.pacsglobal.in/song-challenge.html`.

## After it's live

1. Open https://pacsai.pacsglobal.in/song-challenge.html and send a test entry. It should appear in the "PACS AI – AI Song Challenge entries" Google Sheet. Delete the test row afterwards.
2. Open https://pacsai.pacsglobal.in/learn.html, tick a couple of things and send the list. It should open WhatsApp, and (once the separate learn-requests script is set up, see `../learn-requests-backend/SETUP.md`) the same message and list number appear in the **PACS AI Learn requests** sheet. Delete the test row afterwards.
3. Open https://pacsai.pacsglobal.in/meetup.html and register once. It should appear in the
   "PACS AI Meetup registrations" Google Sheet (see `../meetup-backend/SETUP.md`). Delete the
   test row afterwards.
4. Work through "Getting found on Google" below.

## The meetup dates look after themselves

The Innovators & Hustlers Meetup runs every alternate Saturday, 3 to 5 pm, at the office.
No date on the site is ever typed in by hand. `meetup.html` works out the next one from two
lines in `assets/site.js`:

```js
meetupStart: "2026-09-26",   // any one meetup date
meetupEveryDays: 14,          // the rhythm
```

From those it shows the next Saturday still to come, counts down to it, lists the five after it,
builds the "add to calendar" file, and writes the `Event` structured data that Google reads.
Once the last meetup of the day is over the page rolls forward by itself.

Registration closes `meetupClosesHours` before a meetup starts (3 hours by default). Inside that
window the page still counts down to Saturday, but the form saves seats for the one after it and
says so. To move the whole series, change `meetupStart`. To go weekly, set `meetupEveryDays` to 7.

Registrations are saved by a third Apps Script, separate from the other two. Set it up with
`../meetup-backend/SETUP.md` and paste its address into `meetupRsvps` in `assets/site.js`.
Until that is done the form hands each registration to WhatsApp instead, so nobody is lost.

## Getting found on Google

Checked on 24 September 2026: Google had **not indexed a single page** of this site
(`site:pacsai.pacsglobal.in` returns nothing), and the live copy was still the version from
21 September. The Instagram account already ranks for "PACS AI Mangalore"; the website does not.

The site itself is ready for search engines. Every page carries a title, a description, a
canonical address, share images and structured data (organisation, breadcrumbs, courses, the
FAQs and the skills list), plus `robots.txt` and `sitemap.xml`. What is left is not code.

**Do these in order:**

1. **Publish the current files.** Nothing else on this list matters until the live site matches
   this repository. `class-8-12.html`, `learn.html` and the new pages don't exist on the live
   site yet.
2. **Verify the site in [Google Search Console](https://search.google.com/search-console).**
   Choose the URL-prefix property `https://pacsai.pacsglobal.in/`, then verify with the HTML
   file or the meta tag it gives you (the meta tag goes just under `<meta charset="utf-8">` in
   `index.html`). Submit `https://pacsai.pacsglobal.in/sitemap.xml`, then use **URL inspection →
   Request indexing** for the home page and for `learn.html`. First results usually appear in a
   few days.
3. **Link to the site from `pacsglobal.in`.** A link from the parent site is the strongest
   single signal available, and it is free. One line on the PACS Global home page is enough.
4. **Put the address in the Instagram bio** (`pacsai.pacsglobal.in`), and update the bio text:
   it still says "Classes 8–10". Instagram is the account Google already shows for the brand, so
   it is the best road into the site.
5. **Add PACS AI to Google Business Profile**, or add it to the existing PACS Global listing as a
   service, with the same address, phone number and the website address. This is what gets the
   site into the map results for "AI classes in Mangalore".
6. **Keep the words people search.** Aim at "AI classes in Mangalore", "AI course for students
   Mangalore", "AI for BBA students" and "PACS AI Mangalore". Plain "PACS AI" is a medical
   imaging term (Fujifilm Synapse PACS AI and similar), so that search is crowded by hospital
   software; the town name is what separates us from it.

Keep `sitemap.xml` up to date when pages are added, and change `<lastmod>` when a page changes
in a way that matters.

## Where things are

| What | Where |
|---|---|
| Phone, WhatsApp, email, address, Instagram, Demo Day date, meetup dates and times, Google Sheet links | `assets/site.js` (the `SITE` settings at the top) |
| Styles | `assets/styles.css`, `assets/refresh.css` for layout, and `assets/motion.css` for animation |
| Card journeys, entrances, flip cards, hover lighting, BBA portfolio, reading progress and mobile enquiry bar | `assets/motion.js` (native browser APIs; no external animation libraries) |
| The Try the demos page (all 13 demos, grouped for Class 8–12, BBA & BBM and For everyone; the home page shows 3) | `demos.html` |
| The working demos (mango sorter, study coach, Python game, revision app, film storyboard, campaign post, break-even, pitch deck) and the home page Class 8–12 / BBA demo tabs | `assets/builds.js` |
| The Song Challenge idea machine and entry form | `assets/challenge.js` |
| The meetup: next date, countdown, upcoming dates, calendar file and registration form | `meetup.html`, with `assets/meetup.js` |
| AI for Everyone: 36 skills in seven categories, search and plan review | `learn.html`, with `assets/learn.js` |
| Share images for WhatsApp and social media | `assets/og-home.png`, `assets/og-song.png` |
| Search data: titles, descriptions, canonicals, structured data | in the `<head>` of every page |
| Crawling and listing | `robots.txt`, `sitemap.xml` |
| The old Class 8–10 address | `class-8-10.html`, which forwards to `class-8-12.html` |

Song Challenge entries, Learn requests and meetup registrations are each saved by their own Google Apps Script in the PACS AI Google account, writing to their own sheet. Nothing needs to be installed on the web host for any of them.

Skill choices stay in the current browser tab's session storage. A copy of the WhatsApp message, with its list number, is sent to the separate PACS AI Learn requests sheet only when the visitor explicitly continues from the review dialog to WhatsApp. The site opens a draft; the visitor sends the message in WhatsApp. No booking or payment is completed by these buttons.

The research and its limits are recorded in `../design-notes/ai-skills-research.md`. Category ordering is editorial, not a measured local popularity ranking. The course and challenge eligibility updates require publishing the website and updating the Apps Script deployment separately.

The home page and six-month Creator Programme include scroll-driven tablet decks. They use native sticky positioning and leave scrolling under the visitor's control, with previous/next and skip links. Short viewports and reduced-motion preferences get a readable static journey. Session cards support hover, tap and keyboard activation; on the BBA page the CV is struck through and rewritten as you scroll (it plays by itself on phones), the Bootcamp sessions light up along a red line, the 12-week Studio plays through its weeks, the client briefs turn over, and the white "Three hours" finale moves its red marker and ribbon with the scroll. Decorative loops pause outside the viewport or when the tab is hidden.
