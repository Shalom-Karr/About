-- Two new blog posts: SK Music, and a reverse-engineering field guide.
--
-- Inserted as DRAFTS (is_published = false) so they appear in the admin panel for
-- review and edit before going live. Flip is_published to true (or use the admin
-- toggle) to publish; the homepage and blog index only show published posts.
--
-- created_at is set to now() minus a small interval so that, once published, they
-- sort to the top of the blog (newest first) without colliding.
-- Idempotent: guarded on slug, so re-running is a no-op.

INSERT INTO public.posts (title, slug, excerpt, content_md, tags, is_published, created_at)
SELECT
  $md$Building SK Music: Hebrew-Aware Search That Runs in Your Browser$md$,
  'building-sk-music-hebrew-search-static-workers',
  $md$SK Music has no search server. The catalog is baked into the deploy and every query runs in a Web Worker on your machine — including the hard part: matching Hebrew titles against the romanized English a user actually types, by reducing both to a consonant skeleton.$md$,
  $md$
SK Music is a filtered music player for the Orthodox Jewish community. You search a whitelisted catalog of Jewish music and it plays through YouTube's own embedded player. The interesting part isn't the playback — it's that the whole thing is static. There is no search server. The catalog is baked into the deploy, shipped to your browser once, and every query after that is answered in a Web Worker on your own machine.

This post is about how that works, and about the one problem that made it hard: searching Hebrew music titles when the user is typing in English.

---

## "Filtered by construction"

Most content filters work at runtime: a request goes out, something inspects it, and it's allowed or blocked. That's a losing game for a music app — the filter has to understand every new upload, and the moment it's wrong, prohibited content is one tap away.

SK Music inverts it. There is no runtime filter because there is nothing to filter. Every song in the catalog comes from an artist that was approved by hand, ahead of time. The catalog is a fixed list, fetched at build time from a SQLite database and baked into the deploy. The app can only ever surface what's already in that list. "Accurate by construction" means the safety isn't a feature that runs — it's a property of the data.

That decision cascades into the architecture. If the catalog is fixed and known at build time, you don't need a live search backend. You can compute everything up front.

---

## Static-first on Cloudflare Workers

The site is a `dist/` folder served by a thin Cloudflare Worker. `dist/` holds the single-page app, the search engine as a set of ES modules, the compressed catalog, and the PWA assets. Cloudflare serves those as static assets. The Worker only runs for the handful of things that genuinely can't be static:

- **Live playlist contents** — "trending" and the featured playlists change through the day, so a cron trigger (`15 8,20 * * *`, twice daily) refreshes them into Workers KV, and the Worker reads KV instead of hitting an upstream API on every request.
- **Server-rendered link previews** — when someone shares a link to a specific song or artist, the Worker injects the right Open Graph and Twitter tags into the HTML so the preview shows that song, not a generic homepage card. Everything else is a client-side route.
- **Anonymous play analytics** — batched and written to Supabase with `ctx.waitUntil`, so recording a play never blocks the response.

Everything else — search, browsing artists and albums, the entire UI — is the static bundle running in your browser. There is no database query on the hot path. Repeat visits are almost entirely served from the service worker cache.

The build pipeline is where the work happens. `fetch-corpus.mjs` pulls a snapshot of the catalog; `build-static.mjs` reads it out of SQLite, compresses the full dataset into one payload, generates chunked sitemaps covering every song, artist, album and playlist, and stamps a build timestamp onto every `/lib/` module URL. That last detail is what makes caching safe: because a new deploy changes every module's URL, the browser can cache the old ones forever and simply fetch the new URLs next time. No stale-cache bugs, no cache-busting headers to babysit.

---

## The hard part: searching Hebrew when the user types English

Here's the problem that took the most thought.

Jewish music titles are written in Hebrew. Hebrew is written without vowels. But the person searching is very often typing a romanized guess on an English keyboard — and there is no single correct romanization. The song כבקרת might be searched as "kevakarat", "kvakoras", "kevakoras". "L'Chaim" gets typed "LChaim", "lchaim", "lechaim". Two people looking for the same song will type it three different ways, none of which is the string in the database.

A normal search index would miss all of them. You can't fuzzy-match your way across two alphabets.

The fix is to stop matching the letters and start matching the **consonant skeleton**. Hebrew is already a consonant-skeleton language — the vowels aren't written. So if you reduce both the Hebrew title and the English query to their strong consonants and throw away everything ambiguous, they line up.

The transform romanizes each Hebrew letter to a folded consonant class, and — this is the key move — **drops the matres lectionis** (א ה ו י ע), the letters that stand in for vowels. Then it folds the pairs that English spelling can't agree on: b and v collapse together, k / ch / kh become one class, tz and ts merge, p and f merge, sh and s merge. The same folding runs over the romanized query.

So both sides converge:

```
כבקרת   → romanize → kbkrt → fold → kbkrt
kevakarat → drop vowels → kvkrt → fold → kbkrt
```

They meet at `kbkrt`. The match happens in a space where the alphabet and the vowels don't matter anymore. From the code, the letter map is explicit about what it throws away:

```js
// Hebrew strong consonants → folded Latin class.
// Matres lectionis (א ה ו י ע) intentionally absent → dropped.
const HEB = { "ב":"b", "ג":"g", "ד":"d", "ז":"z", "ח":"k", ... };
```

Every title is indexed under **two** forms: its plain tokens (for Latin text and titles that are already romanized) and its skeleton tokens (for the cross-script case). The query is reduced both ways too, and whichever index produces the better match wins.

---

## Ranking, and why fuzzy matching is dangerous

Finding candidates is half the job. The other half is not drowning the real answer in near-misses.

Each field — title and artist — is a small inverted index with three lookup strategies layered on top:

- **Exact** and **prefix** matches, the prefix found by binary search over a sorted vocabulary so it stays fast as the catalog grows.
- **Fuzzy** matches via Damerau-Levenshtein distance, which counts an adjacent-letter transposition as a single edit — because "shwecky" → "shwekey" is the single most common real typo, and it should cost one, not two.
- To avoid running that distance check against every word in the catalog, only words that share a two-character n-gram with the query are even considered. Everything else can't be within edit distance anyway.

The scoring is deliberately opinionated, and most of the rules exist to kill false positives:

- **IDF weighting** — a match on a rare, distinctive word counts far more than a match on "live", "feat", or a year. Noise words don't get to rank things.
- **No fuzzy matching on the skeleton index.** This one is subtle. The skeleton already dropped the vowels, so vowel typos are absorbed for free. Adding fuzzy matching on top of that is double-lossy — you're allowing edits on a string that's already been aggressively reduced, and it starts matching garbage to real words. Skeletons match exactly or not at all.
- **Artist affinity** — if your query words match an artist's *name*, their tracks are boosted hard. Being a song *by* the artist you searched should beat being a song that merely *mentions* them in its title.
- **A precision floor.** After ranking, anything scoring below 28% of the top hit is dropped. The philosophy is explicit in the code: better to return fewer results, or none, than to pad the list with weak, probably-wrong matches.

That last rule is the whole personality of the search. A search box that confidently returns three right answers is more useful than one that returns thirty and makes you scan for the one you meant.

---

## Off the main thread

The catalog is around 70,000 tracks. Building the in-memory index over that is real work — enough to freeze the UI for a moment if you did it on the main thread. So it doesn't run there.

The entire engine — inflating the dataset, building the index, answering queries — runs in a **Web Worker**. The main thread posts `{ id, url }` and gets back `{ id, result }`; it never does the heavy lifting itself. The worker even defers its own warm-up: the index build is synchronous, so it waits a couple of seconds before building, letting the small reads that fire right at boot (the home screen, the artist list) go first. A search that arrives during that window just triggers the build on demand. And if the worker fails to load at all, the app transparently falls back to running the same engine in-thread. Same code, two homes.

---

## What I'd take from this

The thing I keep coming back to is that almost every hard requirement got easier once the catalog was treated as fixed data known at build time. No live filter, because the data is pre-approved. No search server, because the index can be precomputed and shipped. No cache invalidation, because every deploy gets fresh URLs. The runtime does almost nothing, and the parts that are genuinely dynamic got pushed to the thin edges — a twice-daily cron, a link-preview injector, a fire-and-forget analytics write.

The Hebrew search is the part I'm proudest of, but it's the same idea in miniature: instead of trying to match two alphabets against each other at query time, reduce both to a form where the mismatch disappears, and do it once, up front. Most of engineering a fast thing is deciding what you're allowed to compute before anyone asks.

SK Music is live at [skmusic.shalomkarr.workers.dev](https://skmusic.shalomkarr.workers.dev/).
$md$,
  ARRAY['cloudflare','search','javascript','web-workers','architecture','pwa']::text[],
  false,
  now() - interval '1 minute'
WHERE NOT EXISTS (SELECT 1 FROM public.posts e WHERE e.slug = 'building-sk-music-hebrew-search-static-workers');

INSERT INTO public.posts (title, slug, excerpt, content_md, tags, is_published, created_at)
SELECT
  $md$Taking Software Apart: The Reverse Engineering I Actually Do$md$,
  'reverse-engineering-field-guide-decompiling-apis-cipher',
  $md$Reverse engineering isn’t one skill. It’s decompiling JARs, reading private APIs off the wire, deobfuscating rotating player JavaScript, and building things designed to resist all three — a field guide, with real examples from my own projects.$md$,
  $md$
"Reverse engineering" sounds like one skill. It isn't. It's a family of them, and which one you reach for depends on what you're taking apart and why. Sometimes you have a compiled binary and no source. Sometimes you have a running service with a private API and no docs. Sometimes the thing actively fights you — obfuscated, rotating, built to not be understood.

I've done a fair amount of this across projects, and I want to walk through the distinct kinds, with real examples, because the techniques don't transfer as much as people think. Decompiling a JAR is nothing like deobfuscating rotating JavaScript, which is nothing like reading a private web API off the wire. Here's the map.

---

## Static decompilation: turning bytecode back into source

The most literal kind. You have a compiled artifact — a `.jar`, a `.dll`, an APK — and you want the source back.

I inherited a payment kiosk system for a mikvah: card readers, fingerprint terminals, a desktop admin app. It was three proprietary vendor JARs and zero documentation, and I had to integrate with it and keep it running. So I decompiled it. **CFR** (the Class File Reader) turned `OPaymentSystem.jar`, `zUtil.jar` and `zOtotDefines.jar` into **443 readable Java files** — a Java 8 Swing app I could finally read.

Decompiled code isn't clean. Variable names are gone, control flow is reconstructed, and you're reading the compiler's idea of your source, not the original. But it's enough to answer the questions that matter. Two examples of what fell out:

- The desktop app had a **machine lock**. `Main.java` called a `checkMac()` routine that hashed the **CPU ProcessorId plus the C: volume serial number** and compared it to a stored value — if you ran it on the wrong machine, it exited before the login window even drew. That's a licensing tether, and you can't know it's there until you read the code.
- Buried in `OtotQueueParam.java` was the entire **parameter ID map** for the hardware — parameter 104 controls the gate, 107 empties the register, 157 is a button-options bitmask. This is the Rosetta Stone for talking to the terminals, and it existed nowhere except compiled into the JAR.

The architecture also revealed itself: the desktop app writes command rows into MySQL, and the Android terminal polls a stored procedure, reads its queue, and archives to log tables. Nobody told me that. The decompiled source did.

The lesson of static decompilation: you're not looking for the whole program, you're looking for the three or four facts that unblock you. Find them and stop.

---

## Reading a private API off the wire

The second kind doesn't involve a binary at all. The software is running on someone else's server; you just want to talk to it the way its own frontend does.

Every big web app has an internal API its own JavaScript calls — undocumented, unversioned, not meant for you. YouTube Music's is `youtubei/v1/browse`. If you watch what the site sends when you open a playlist, you can reproduce it. My SK Music worker does exactly that: a `POST` to `youtubei/v1/browse?prettyPrint=false`, carrying the same **client context the real site sends** — `clientName: "WEB_REMIX"`, a current `clientVersion`, and the header `X-YouTube-Client-Name: 67` (67 is YouTube's numeric ID for the music web client), plus the `Origin` and `Referer` the server expects. Forge that context faithfully and the server answers you like you're the real frontend.

The response is the hard part. It's a deeply nested tree of `...Renderer` objects, and the shape isn't stable — a given playlist's tracks might sit under one shelf layout, another playlist's under a different one. My first parser walked a fixed path and about **half the playlists came back with zero tracks** because their layout didn't match. The fix was to stop assuming structure: walk the *entire* response recursively, collect every `musicResponsiveListItemRenderer` node wherever it lives, and pull the continuation token the same way for pagination. Robustness in API reverse-engineering means never depending on a path you didn't verify holds everywhere.

I ported this same InnerTube layer twice — once into the SK Music worker in JavaScript, once into the Zemer harvester, which carries a table of **fourteen different client identities** YouTube recognizes (the Android app, a Samsung TV, a PlayStation 4, an Oculus Quest, an Apple Vision device), each with its own client ID and user-agent, because different clients unlock different data.

---

## The hard one: deobfuscating code that rotates

Static decompilation and API mimicry both assume the target holds still. The hardest reverse engineering is when it doesn't — when the thing you cracked yesterday is different today, on purpose.

YouTube's stream URLs are protected by two obfuscated values: a scrambled `signature`, and an `n` parameter that throttles your download if you get it wrong. Both are unscrambled by a JavaScript function inside YouTube's player code — and that player JavaScript is **minified, obfuscated, and rotated frequently**, with the function renamed and reshaped each time. There's no stable function to call. Every rotation breaks any naive extractor.

I built the deciphering layer that solves this — first for the Zemer app in early 2026. Rather than try to run the whole opaque player, I reverse-engineered the *pattern*: locate the signature-transform call and the n-transform class inside whatever the current player JS looks like, extract just the call expressions, and execute those in a WebView through a small JS bridge. The extracted expressions get published to a config file that every deployed app fetches with a short TTL. An entry looks like this:

```json
"9c249f6f": { "sig": "Tl(48,5831,INPUT)", "nClass": "W_", "sts": 20602 }
```

The key is the player version's hash; `sig` is the exact call expression to run for signature descrambling; `nClass` is the class name of the n-transform; `sts` is the signature timestamp the API demands. When YouTube ships a new player and everything breaks, I add one line to that config's `master` branch and **every installed app self-heals within minutes** — no app update, no store review, no user action. The rotation stops being an emergency and becomes a one-line commit.

That deciphering work outgrew my own app. It was picked up into Metrolist a couple of days after I wrote it, and from there copied into Echo-Music, Flow, vivi-music, Kreate, Meld, and a long tail of other music-player forks. Reverse engineering, done well, is reusable: the hard part is understanding the shape of the problem once, and after that everyone downstream just needs the config.

---

## The other direction: building things that resist it

Spend enough time taking software apart and you learn exactly how to make software hard to take apart. Two of my Windows projects are the inverse discipline — engineered against the same techniques I use everywhere else.

**kiosk-exit-guard** turns a Windows machine into a locked kiosk, and every layer assumes a knowledgeable adversary sitting at the keyboard. It installs a low-level keyboard hook (`WH_KEYBOARD_LL`) that swallows the escape combinations before they reach the shell. It uses an Image File Execution Options trick — the same registry key debuggers use to attach — to make `chrome.exe` and `msedge.exe` silently fail to launch. Its password lives as a bcrypt hash under a registry key whose ACL is tightened with an explicit SDDL string so a non-admin can't even read it.

**lockguard** goes a layer deeper, into a kernel driver, because a userspace guard can be killed by anyone with admin. In the kernel you can register callbacks the OS itself enforces: a registry callback that protects the boot configuration and recovery keys, a process-creation callback that refuses to let `regedit` or a debugger start, a filesystem minifilter that protects files even from SYSTEM, and an object callback that strips the `TERMINATE` right off the watchdog so it can't be killed. The recovery channel is gated behind PBKDF2 with a million iterations. All of that exists specifically to defeat someone doing to it what I'd do to anything else.

Knowing how you'd break in is the only way to know where the walls have to go.

---

## Hardware and firmware

The last category reaches past software into the device. Some of my community tooling works at the Android system level — talking to a phone over USB from the browser via WebUSB and ADB to modify system partitions, and building the device trees that describe a specific phone's hardware to the Android build system. This is the same mindset applied to firmware instead of bytecode: understand the layers the manufacturer assembled, and rebuild the ones you need to change.

---

## What actually transfers

The techniques don't transfer between these — a decompiler is useless against rotating JavaScript, and a packet trace won't help you read a JAR. What transfers is the posture: assume nothing about structure you haven't verified, look for the few facts that unblock you rather than trying to understand everything, and expect the target to be messier and less stable than its documentation (if it has any) claims.

And the most useful thing you get from reverse engineering isn't any specific unlock. It's that after you've taken enough things apart, you build differently — you stop trusting that "compiled" means "hidden," and you start putting your defenses where they'll actually hold.
$md$,
  ARRAY['reverse-engineering','decompilation','security','android','go']::text[],
  false,
  now() - interval '2 minute'
WHERE NOT EXISTS (SELECT 1 FROM public.posts e WHERE e.slug = 'reverse-engineering-field-guide-decompiling-apis-cipher');

-- Verify:
--   SELECT slug, title, is_published, array_length(tags,1) AS tags, length(content_md) AS chars
--   FROM public.posts
--   WHERE slug IN ('building-sk-music-hebrew-search-static-workers', 'reverse-engineering-field-guide-decompiling-apis-cipher');
