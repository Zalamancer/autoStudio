# Second Round Analysis — Refined Preferences After 1120 Templates

## Stats
- **145 liked** (12.9%) — 115 kinetic, 30 scene
- **975 disliked** (87.1%) — 511 kinetic, 464 scene
- **Round 3 templates: 4/160 liked (2.5%)** — the niche medium approach failed

### Compared to Round 1
| Metric | Round 1 | Round 2 | Change |
|--------|---------|---------|--------|
| Total rated | 799 | 1120 | +321 |
| Liked | 114 (14.3%) | 145 (12.9%) | Rate dropped |
| Kinetic approval | ~28% | 18.4% | Dropped — round 3 diluted |
| Scene approval | ~4.7% | 6.1% | Slight improvement |

---

## The Central Finding: Round 3 Was Wrong

Round 3 generated 160 templates across 20 niche real-world medium categories (darkroom chemistry, cartography, signal processing, etc.). **Only 4 survived (2.5%)**. This is the worst-performing batch in the project's history.

### Why Round 3 Failed
The round-3 approach doubled down on the analysis.md insight that "every liked template evokes a real-world medium." But it misunderstood **which mediums work**:

| What works | What doesn't | Why |
|---|---|---|
| Typewriter, newspaper, chalk | Flexography, intaglio, cyanotype | **Familiarity** — everyone knows what a typewriter looks like |
| Glitch, hologram, matrix | Sine wave, ring mod, bit crush | **Visual impact** — glitch is visually exciting, a sine wave is boring |
| Neon sign, cinema letterbox | Argon glow, sodium vapor, mercury vapor | **Cultural resonance** — "neon" is a vibe, "sodium vapor" is a chemistry lesson |
| Prism rainbow, stained glass | Raindrop lens, fiber optic | **Text is the star** — prism refraction acts ON the text, raindrop lens is a background |
| Cross stitch, quilt patch | Embroidery hoop, loom weave | **Craft everyone recognizes** — cross stitch is a meme, loom weave is obscure |

### The Rule We Missed
> **"Real-world medium" doesn't mean "technically accurate simulation of an obscure process." It means "everyone instantly recognizes this aesthetic and it does something interesting to the text."**

---

## What Gets Liked — Refined Rules (v2)

### Rule 1: The Text Effect IS the Template
The text animation is not just "a feature" — it IS the entire point. Templates that simulate a process (darkroom development, leather stamping, postal sorting) fail because the simulation takes center stage and the text becomes secondary.

**Approved pattern**: Text glitches, splits, types, fills, morphs, bounces, reveals
**Rejected pattern**: A simulation of darkroom chemistry that happens to have text in it

### Rule 2: Instant Recognition in Under 1 Second
If a viewer can't immediately name the aesthetic, it fails. The recognition test:
- "That's a typewriter" ✅
- "That's a glitch" ✅
- "That's a manga page" ✅
- "What's flexography?" ❌
- "What's intaglio?" ❌
- "What's a fermata?" ❌

### Rule 3: The Aesthetic Must Be Culturally Active
Templates succeed when they reference aesthetics that are **currently alive in culture**:
- Active on social media: glitch, vaporwave, dark academia, manga
- Active in daily life: newspaper, neon signs, chalkboard, post-it notes
- Active in entertainment: cinema, holograms, HUD, matrix, game over

Templates fail when they reference aesthetics that are **dead, museum-piece, or specialist**:
- Historical processes: daguerreotype, cyanotype, mimeograph
- Specialist knowledge: signal processing, cartography, musical notation
- Mundane infrastructure: parking garage, elevator display, manhole cover

### Rule 4: Minimal Works When Precise
All 6 minimal templates were liked (100% approval — highest category). The key: **one clear mechanic, executed perfectly**. No background decoration, no theme, just pure text animation.

- Minimal Fade, Mask, Reveal Line, Rotate, Slide Up, Paste — ALL liked
- Gradient Flow, Gradient Mesh, Outline Stroke — liked as minimal variants

### Rule 5: Scene Templates Must Be Text-First OR Culturally Iconic UI
Only 30/494 scenes survived (6.1%). The survivors fall into exactly two categories:

**A. Pure text display** (quotes, definitions, journal entries):
Quote Card, Minimal Quote, Book Quote, Chapter Title, Journal Entry, Definition, Podcast Quote, POV, Mindfulness Quote, Gratitude Journal, Testimonial Card

**B. Culturally iconic UI everyone recognizes** (social media, internet culture):
Tweet Card, Reddit Comment, iMessage Bubble, YouTube Comment, Social Post, 404 Error, Terms of Service, Stock Ticker, Tier List, Game Over, Nutrition Facts

**Everything else is rejected**: data dashboards, product cards, workout trackers, weather displays, cooking timers, real estate listings, crypto prices, etc.

### Rule 6: Scene Data Displays Only Work When They're Memes
- Stock Ticker: liked (Bloomberg terminal is an aesthetic/meme)
- Nutrition Facts: liked (the FDA label is an iconic format, used as memes)
- Tier List: liked (S-tier is a meme format)
- Minimal Number: liked (single big number is a TikTok format)
- KPI Dashboard: disliked (nobody wants a dashboard as content)
- Pie Chart: disliked (that's a PowerPoint, not content)

---

## Approved Categories for Future Generation

### Tier S — 90%+ approval, generate more of these:
1. **Minimal/Clean reveals** — new single-mechanic variations (100% approval)
2. **Glitch/Digital** — new corruption/interference effects (92% approval from round 1+2)

### Tier A — 60%+ approval, strong performers:
3. **Terminal/Code** — new computing interfaces people actually know
4. **Film/Cinema** — more cinematic text treatments
5. **Print/Editorial** — more MAINSTREAM print aesthetics (magazine, poster, newspaper — NOT niche printing processes)
6. **Handcraft/Drawing** — tools everyone recognizes (marker, pen, tape, sticker)
7. **Geometric reveals** — new mechanical reveal animations
8. **Text transforms** — new physics/deformation effects on text

### Tier B — 40%+ approval, selective generation:
9. **Manga/Anime** — strong but limited space
10. **Sci-Fi/Futuristic** — hologram, HUD, space variants
11. **Retro aesthetic** — vaporwave, brutalist, dark academia variants
12. **Architecture/Technical** — blueprint, wireframe, dimension (NOT buildings/infrastructure)

### Tier C — Text-centric scenes only:
13. **Quote variations** — new quote/text display layouts
14. **Social media UI** — platforms people actually use
15. **Internet culture** — meme formats, viral UI patterns, text-forward

---

## Banned Categories — Do NOT Generate

These have been tested across 1120 templates with consistent 0% approval:

1. ~~Niche printing processes~~ (flexography, intaglio, lithograph, mimeograph)
2. ~~Niche science/medical~~ (EKG, spectrometer, molecular, DNA)
3. ~~Signal processing/audio synthesis~~ (sine wave, ring mod, granular)
4. ~~Musical notation~~ (sheet music, metronome, fermata, treble clef)
5. ~~Cartography/navigation~~ (compass, nautical chart, GPS, flight path)
6. ~~Decay/aging/damage~~ (rust, foxing, water damage, sun bleach)
7. ~~Postal/mail systems~~ (stamps, postmarks, airmail, telegram)
8. ~~Neon gas chemistry~~ (argon, sodium vapor, mercury — use "neon sign" instead)
9. ~~Industrial/urban infrastructure~~ (parking, elevator, manhole, construction)
10. ~~Niche vintage computing~~ (specific machines like C64, Apple II, ZX Spectrum)
11. ~~Cultural/ethnic art patterns~~ (Aboriginal, African, Celtic, Chinese, etc.)
12. ~~Nature/weather/organic~~ (aurora, autumn, cherry blossom, ocean)
13. ~~Horror/gore~~ (blood, zombie, spider)
14. ~~Meditation/spiritual~~ (chakra, mandala, zen, lotus)
15. ~~Food/drink~~ (cafe, coffee stain, menu)
16. ~~ALL data dashboards/charts~~ (bar chart, pie chart, funnel, analytics)
17. ~~ALL lifestyle utility~~ (workout, recipe, travel, skincare, routine)
18. ~~ALL e-commerce/marketing~~ (product card, cart, coupon, shipping)
19. ~~ALL profile/showcase cards~~ (player card, artist profile, chef profile)
20. ~~ALL real estate~~ (property listing, open house, mortgage)
21. ~~ALL gaming UI~~ except game-over (health bar, inventory, leaderboard)
22. ~~ALL crypto/finance~~ except stock ticker (budget, savings, investment)

---

## Generation Strategy for Round 4

### Approach: Go WIDE in approved categories, not DEEP into niche mediums

Instead of "8 templates exploring different types of neon gas," do:
- 8 new geometric reveal mechanics (curtain, shutter, diamond, hexagon)
- 8 new text physics effects (elastic, magnetic, gravity, whip, bounce variants)
- 8 new glitch/corruption variations (VHS tracking, signal loss, broadcast error)
- 8 new minimal single-mechanic reveals
- 8 new handcraft tools everyone knows (marker, tape, sticker, stamp, washi)

### Quality Test Before Generating
Every template must pass ALL of these:
- [ ] Can a 16-year-old TikTok user name this aesthetic instantly?
- [ ] Is the TEXT the star, not the background?
- [ ] Does the text DO something interesting (not just fade/slide)?
- [ ] Is this a currently alive cultural reference, not a museum piece?
- [ ] Would this work applied to ANY text, not just specific content?
- [ ] If a scene: is it PURELY text display or iconic social media UI?

---

## Templates to Consider Deleting

The 160 round-3 templates (minus the 4 liked) represent 156 templates that add bulk without value. They dilute the template picker and slow down the app. Consider:
1. Removing all 156 rejected round-3 templates from the codebase
2. Or at minimum, hiding them from the template picker UI
