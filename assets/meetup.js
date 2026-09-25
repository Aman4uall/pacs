/* =========================================================================
   PACS AI – Innovators & Hustlers Meetup
   Works out the next meetup date by itself, counts down to it, lists the
   dates after it, and saves registrations to a Google Sheet through
   SITE.meetupRsvps (see site.js and meetup-backend/SETUP.md). Until that is
   set, the form hands the registration to WhatsApp instead, so nobody is lost.

   The meetup runs every SITE.meetupEveryDays days from SITE.meetupStart, so
   nothing here needs editing again: change the one start date in site.js and
   every date on the page moves with it.
   ========================================================================= */
(function () {
  const cfg = typeof SITE !== "undefined" ? SITE : {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // India keeps one clock all year, so a fixed offset is exact. Visitors abroad
  // still see the Mangalore time, which is the only time that means anything here.
  const IST = "+05:30";
  const ZONE = "Asia/Kolkata";
  const DAY = 86400000;
  const HOUR = 3600000;

  const startDate = cfg.meetupStart || "2026-09-26";
  const period = (Number(cfg.meetupEveryDays) || 14) * DAY;
  const opens = String(cfg.meetupFrom || "15:00");
  const closes = String(cfg.meetupTo || "17:00");
  const closesBefore = (Number(cfg.meetupClosesHours) || 0) * HOUR;

  const firstStart = new Date(`${startDate}T${opens}:00${IST}`);
  const firstEnd = new Date(`${startDate}T${closes}:00${IST}`);
  if (isNaN(firstStart)) return; // a broken start date in site.js: leave the page as written

  const duration = firstEnd - firstStart;

  // The nth meetup after the start date in site.js
  function session(n) {
    const startsAt = new Date(firstStart.getTime() + n * period);
    return {
      n,
      startsAt,
      endsAt: new Date(startsAt.getTime() + duration),
      closesAt: new Date(startsAt.getTime() - closesBefore),
    };
  }

  // Smallest n at or after 0 where test(session) is still ahead of `now`
  function firstAfter(now, pick) {
    const gap = now - pick(session(0));
    return session(gap < 0 ? 0 : Math.floor(gap / period) + 1);
  }

  // The meetup being counted down to: the one that has not finished yet
  const next = () => firstAfter(Date.now(), (s) => s.endsAt);
  // The meetup this form can still take registrations for
  const open = () => firstAfter(Date.now(), (s) => s.closesAt);

  const fmt = (d, opts) => d.toLocaleString("en-IN", { timeZone: ZONE, ...opts });
  const dayName = (d) => fmt(d, { weekday: "long" });
  const longDate = (d) => fmt(d, { day: "numeric", month: "long", year: "numeric" });
  const shortDate = (d) => fmt(d, { day: "2-digit", month: "short" });
  const clockTime = (d) => fmt(d, { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase().replace(/\s/g, " ");
  // Same calendar day in Mangalore, whatever the reader's own clock says
  const istDay = (d) => fmt(d, { year: "numeric", month: "2-digit", day: "2-digit" }).split("/").reverse().join("-");
  const window_ = (s) => `${clockTime(s.startsAt)} to ${clockTime(s.endsAt)}`;

  /* ---------- The card at the top ---------- */

  const dayEl = $("[data-next-day]");
  const dateEl = $("[data-next-date]");
  const timeEl = $("[data-next-time]");
  const liveEl = $("[data-next-live]");
  const rolledEl = $("[data-rolled]");
  const cdEl = $("[data-countdown]");
  const cdParts = {};
  $$("[data-cd]").forEach((el) => { cdParts[el.dataset.cd] = el; });

  function paintCard() {
    const s = next();
    const o = open();
    if (dayEl) dayEl.textContent = dayName(s.startsAt);
    if (dateEl) dateEl.textContent = longDate(s.startsAt);
    if (timeEl) timeEl.textContent = window_(s);

    // Doors are open: stop counting down and say so
    const live = Date.now() >= s.startsAt;
    if (liveEl) liveEl.hidden = !live;
    if (cdEl) cdEl.hidden = live;

    // Registration for that one has closed, so the form is for the one after it
    if (rolledEl) {
      const rolled = o.n !== s.n;
      rolledEl.hidden = !rolled;
      if (rolled) rolledEl.textContent = `Registration for ${shortDate(s.startsAt)} has closed. The form below saves you a seat on ${longDate(o.startsAt)}.`;
    }
    return s;
  }

  function tick() {
    const s = paintCard();
    if (!cdEl || cdEl.hidden) return;
    let left = Math.max(0, s.startsAt - Date.now());
    const days = Math.floor(left / DAY); left -= days * DAY;
    const hours = Math.floor(left / HOUR); left -= hours * HOUR;
    const minutes = Math.floor(left / 60000); left -= minutes * 60000;
    const seconds = Math.floor(left / 1000);
    const pad = (n) => String(n).padStart(2, "0");
    if (cdParts.days) cdParts.days.textContent = days;
    if (cdParts.hours) cdParts.hours.textContent = pad(hours);
    if (cdParts.minutes) cdParts.minutes.textContent = pad(minutes);
    if (cdParts.seconds) cdParts.seconds.textContent = pad(seconds);
  }

  tick();
  let timer = setInterval(tick, 1000);
  // A hidden tab has nothing to show, so let it rest
  document.addEventListener("visibilitychange", () => {
    clearInterval(timer);
    if (!document.hidden) { tick(); timer = setInterval(tick, 1000); }
  });

  /* ---------- The dates after it ---------- */

  const datesEl = $("[data-dates]");
  if (datesEl) {
    const from = next().n;
    datesEl.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const s = session(from + i);
      const li = document.createElement("li");
      li.className = "date-row" + (i === 0 ? " is-next" : "");
      li.innerHTML = `<span class="date-when"><b>${shortDate(s.startsAt)}</b> ${fmt(s.startsAt, { year: "numeric" })}</span>`
        + `<span class="date-day">${dayName(s.startsAt)}, ${window_(s)}</span>`
        + `<span class="date-tag">${i === 0 ? "Next one" : ""}</span>`;
      datesEl.append(li);
    }
  }

  /* ---------- Add to calendar ---------- */

  // A calendar file the browser makes itself: no service, nothing to sign in to
  function icsFor(s) {
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PACS AI//Meetup//EN", "BEGIN:VEVENT",
      `UID:pacsai-meetup-${istDay(s.startsAt)}@pacsglobal.in`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(s.startsAt)}`,
      `DTEND:${stamp(s.endsAt)}`,
      "SUMMARY:Innovators & Hustlers Meetup (PACS AI)",
      `LOCATION:${String(cfg.address || "PACS Office, Mangalore").replace(/,/g, "\\,")}`,
      "DESCRIPTION:Every alternate Saturday. Details: https://pacsai.pacsglobal.in/meetup.html",
      "END:VEVENT", "END:VCALENDAR",
    ];
    return URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  }
  $$("[data-ics]").forEach((a) => {
    a.addEventListener("click", () => { a.href = icsFor(open()); }, { capture: true });
  });

  /* ---------- What search engines see ---------- */

  const eventTag = document.getElementById("meetup-event");
  if (eventTag) {
    const s = next();
    eventTag.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Innovators & Hustlers Meetup",
      description: "A free meetup in Mangalore for founders, builders and students. Every alternate Saturday, 3 to 5 pm, at the PACS office.",
      startDate: `${istDay(s.startsAt)}T${opens}:00${IST}`,
      endDate: `${istDay(s.startsAt)}T${closes}:00${IST}`,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      url: "https://pacsai.pacsglobal.in/meetup.html",
      image: "https://pacsai.pacsglobal.in/assets/og-home.png",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: "https://pacsai.pacsglobal.in/meetup.html#register",
      },
      location: {
        "@type": "Place",
        name: "PACS Office",
        address: { "@type": "PostalAddress", streetAddress: cfg.address || "", addressLocality: "Mangalore", addressRegion: "Karnataka", postalCode: "575003", addressCountry: "IN" },
        // The office pin on Google Maps, so the meetup lands in the right place
        geo: { "@type": "GeoCoordinates", latitude: 12.8760212, longitude: 74.8418633 },
        hasMap: "https://maps.google.com/?cid=4620462856664289988",
      },
      organizer: { "@type": "Organization", name: "PACS AI", url: "https://pacsai.pacsglobal.in/" },
    });
  }

  /* ---------- The registration form ---------- */

  const form = $("#meetup-rsvp");
  if (!form) return;
  const done = $("[data-done]");
  const status = $("[data-status]", form);
  const sendBtn = $("[data-send]", form);
  const rsvpDate = $("[data-rsvp-date]");

  function paintFormDate() {
    const o = open();
    if (rsvpDate) rsvpDate.textContent = `${dayName(o.startsAt)} ${longDate(o.startsAt)}`;
  }
  paintFormDate();
  setInterval(paintFormDate, 60000);

  // Phone: ten digits, nothing else
  const phone = form.elements.namedItem("phone");
  phone.addEventListener("input", () => {
    phone.value = phone.value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").slice(0, 10);
    phone.setCustomValidity("");
  });
  phone.addEventListener("invalid", () => {
    phone.setCustomValidity(phone.validity.patternMismatch || phone.validity.valueMissing ? "Enter a 10-digit mobile number, like 9876543210." : "");
  });

  function collect() {
    const s = open();
    const value = (name) => {
      const el = form.elements.namedItem(name);
      if (!el) return "";
      if (el instanceof RadioNodeList) return el.value;
      return el.type === "checkbox" ? el.checked : el.value.trim();
    };
    return {
      meetupDate: istDay(s.startsAt),
      meetupWhen: `${dayName(s.startsAt)} ${longDate(s.startsAt)}, ${window_(s)}`,
      name: value("name"),
      phone: "+91" + value("phone"),
      email: value("email"),
      role: value("role"),
      building: value("building"),
      pitch: value("pitch"),
      seats: value("seats"),
      heard: value("heard"),
      reminder: value("reminder"),
      website: value("website"),
    };
  }

  function whatsappText(d) {
    return [
      "Hi PACS AI, I'd like a seat at the Innovators & Hustlers Meetup.",
      `Meetup: ${d.meetupWhen}`,
      `Name: ${d.name}`,
      `Coming as: ${d.role}`,
      d.building ? `Working on: ${d.building}` : "",
      `Seats: ${d.seats}`,
      `Wants to present: ${d.pitch}`,
      d.email ? `Email: ${d.email}` : "",
    ].filter(Boolean).join("\n");
  }
  const openWhatsApp = (d) => window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(whatsappText(d))}`, "_blank", "noopener");

  function finish(d, message) {
    form.hidden = true;
    done.hidden = false;
    $("[data-done-text]", done).innerHTML = message;
    const when = $("[data-done-when]", done);
    if (when) when.textContent = d.meetupWhen + ", at the PACS office.";
    done.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    done.focus({ preventScroll: true });
  }

  function fail(d) {
    status.classList.add("is-error");
    status.innerHTML = 'That didn\'t go through. Check your internet and try again, or <button type="button" class="link" data-wa-fallback>register on WhatsApp instead</button>.';
    $("[data-wa-fallback]", status).addEventListener("click", () => {
      openWhatsApp(d);
      finish(d, "Your registration has opened in WhatsApp. <b>Press send there</b> to finish.");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = collect();
    if (d.website) return; // only a bot fills the hidden field

    // No sheet connected yet: hand the registration to WhatsApp
    if (!cfg.meetupRsvps) {
      openWhatsApp(d);
      finish(d, "Your registration has opened in WhatsApp. <b>Press send there</b> to finish.");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Saving…";
    status.classList.remove("is-error");
    status.textContent = "";
    try {
      const ctrl = new AbortController();
      const abort = setTimeout(() => ctrl.abort(), 20000);
      // Plain text keeps this a "simple" request, which Google Apps Script accepts
      const res = await fetch(cfg.meetupRsvps, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(d),
        signal: ctrl.signal,
      });
      clearTimeout(abort);
      const reply = await res.json();
      if (!reply.ok) throw new Error(reply.error || "Not saved");
      const ref = String(reply.ref || "").replace(/[^\w-]/g, "");
      finish(d, reply.already
        ? `You were already on the list. Your reference is still <b>${ref}</b>.`
        : `Your reference is <b>${ref}</b>. We'll message you on WhatsApp the day before.`);
    } catch (err) {
      fail(d);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Save my seat";
    }
  });
})();
