# Third Round Analysis — 177/1280 After Round 4 Generation

## Stats

| Metric | Round 3 | Round 4 | Change |
|--------|---------|---------|--------|
| Batch size | 160 | 160 | Same |
| Liked | 4 (2.5%) | 32 (20.0%) | **8x improvement** |
| Overall liked | 145/1120 (12.9%) | 177/1280 (13.8%) | +0.9% |
| Best category | Textile 2/8 | Geometric Mechanical 5/8 | New top |

---

## The Central Finding: MECHANISMS Beat MEDIUMS and ENVIRONMENTS

Round 4 proved a clear hierarchy of what works:

### Tier 1: Mechanical Reveals (62.5% approval)
Text revealed through a **physical mechanism** — doors opening, panels rolling, fans unfolding. These work because:
- The mechanism IS the text animation
- Everyone understands how doors/fans/shutters work
- The text appears BECAUSE of the mechanism, not despite it

### Tier 2: Authentic Glitch/Corruption (50% approval)
Specific, named digital failures — VHS pause, buffer freeze, font corruption, kernel panic. These work because:
- Each failure mode has a distinctive, recognizable visual language
- The failure HAPPENS TO the text, not around it
- Technical specificity ("kernel panic hex dump") beats generic ("software error")

### Tier 3: Pattern-Based Reveals (50% approval)
Checkerboard, dot matrix, diagonal sweep, grid unlock. These work because:
- The pattern IS the reveal mechanic
- Each pattern creates a unique visual rhythm
- Text appears through the pattern, not on top of it

### What Failed (0% across 5 categories)

**Environment Simulations** — Digital UI (BSOD, CAPTCHA), Internet Nostalgia (GeoCities, MySpace), Stationery (paper clips, tape), Art Supplies (spray paint, markers)

All share the same flaw: **the environment/object is the star, and text is just content placed inside it.** When you see "a paper clip holding text," you see the paper clip. When you see "VHS pause distortion," you see the text being distorted.

> **Rule: The text must BE the effect, not be INSIDE the effect.**

---

## Refined Rules (v3)

### Rule 1 (UPDATED): Mechanisms > Mediums > Environments
| Level | What it means | Example | Approval |
|-------|--------------|---------|----------|
| Mechanism | HOW text appears/moves | Sliding doors reveal | 62.5% |
| Medium | WHAT happens to text | VHS distortion | 50% |
| Environment | WHERE text sits | GeoCities page | 0% |

### Rule 2 (UPDATED): Specificity Wins
"VHS Pause" > "Video Glitch" > "Retro Effect"
"Kernel Panic" > "Software Error" > "Glitch"
"Checkerboard Flip" > "Pattern Reveal" > "Geometric"
"Git Diff" > "Code Display" > "Terminal"

The more specific and named the effect, the higher the approval.

### Rule 3 (NEW): Physical Objects as Containers = Death
Paper clip, sticky tape, index card, memo pad, rubber stamp — placing text ON/IN a physical object kills it. The object becomes the star. But physical MECHANISMS (doors, fans, shutters) work because the mechanism serves the text.

### Rule 4 (UPDATED): Generic Physics = Low Signal
MagneticPull, GravitySlam, SpringOscillate, Slingshot — generic physics words don't evoke anything recognizable. The ones that worked (ShockwavePush, ImplosionGather, CrumplePaper) have a specific visual reference. ShockwavePush = Dragon Ball energy blast. ImplosionGather = Avengers assemble. CrumplePaper = wadding up a page.

### Rule 5 (CONFIRMED): Minimal Works, but Only MOTION Minimals
Minimal clip-path shapes (diamond, hex, star) = 0% approval
Minimal motion mechanics (blur, stroke, roll, fan) = 25% approval
The previously liked minimals (fade, mask, reveal line, rotate, slide up) are all about MOTION, not SHAPE.

### Rule 6 (CONFIRMED): Scene Templates Frozen
0 new scene likes in round 4. The 30 liked scenes from round 2 appear to be the ceiling. Don't generate more scenes.

---

## Updated Category Tiers

### Tier S++ (50-62% approval — generate MOST):
1. **Mechanical Reveals** — doors, shutters, panels, fans, gates, latches
2. **Glitch/Corruption (specific)** — named hardware/software failures
3. **Pattern Reveals** — checkerboard, dot matrix, grid, diagonal sweep

### Tier A (25-50% — generate many):
4. **Minimal Motion** — blur, stroke, roll, fan (NOT shapes)
5. **Film Camera** — rack focus, barrel distort (specific lens effects)
6. **Comic Visual Language** — Ben-Day dots, caption boxes

### Tier B (12-25% — generate selectively, only the BEST ideas):
7. **Physics with Cultural Reference** — only when it evokes something specific (shockwave = DBZ, implosion = Avengers)
8. **Film Edit** — only time-lapse worked, others too abstract
9. **Magazine Editorial** — only pull quote worked
10. **Hacker/Dev** — only git diff worked
11. **Cyberpunk** — only quantum flicker worked

### DEMOTED to Banned:
- ~~Minimal Clip-Path Shapes~~ — 0% (geometric shapes are boring)
- ~~Digital UI Simulation~~ — 0% (text inside UI = bad)
- ~~Stationery & Office Objects~~ — 0% (physical containers = bad)
- ~~Art Supply Tools~~ — 0% (tool simulation > text)
- ~~Internet Nostalgia~~ — 0% (era simulation > text)
- ~~Generic Physics~~ — 0% for most (no cultural reference)

---

## Generation Strategy for Round 5

### Focus 80% on Tier S++ categories

**Mechanical Reveals (deep dive — 4 categories x 8 = 32):**
1. Industrial mechanisms — conveyor belt, printing press, assembly line, crane
2. Home mechanisms — blinds, curtain rod, drawer slide, cabinet door
3. Locking mechanisms — combination lock, deadbolt, padlock, vault door
4. Transport mechanisms — train doors, bus display, airplane overhead bin, car window

Wait — this might repeat the round 3 "niche medium" mistake. The LIKED mechanical reveals were GENERIC mechanisms everyone knows (garage door, sliding doors, revolving door, elevator), not niche ones.

**Better approach — explore DIFFERENT mechanical motions:**

**Mechanical Reveal Types (3 categories x 8 = 24):**
1. Rotation-based reveals — turntable, carousel, roulette, clock hand, compass needle, dial, knob, reel
2. Sliding/tracking reveals — drawer, rail, conveyor, trolley, slot, slide rule, sash, guillotine
3. Folding/hinging reveals — gate fold, bi-fold, tri-fold, clamshell, flip phone, laptop lid, trunk, hatch

**Glitch Variants (3 categories x 8 = 24):**
4. Display technology failures — LCD bleed, OLED burn-in, projector flicker, monitor degauss
5. Transmission errors — satellite mosaic, radio static, cell dropout, streaming buffer
6. File corruption — JPEG artifact, PNG interlace, corrupted save, file recovery

**Pattern Reveals (3 categories x 8 = 24):**
7. Tile patterns — honeycomb, brick, herringbone, basketweave, pinwheel, scale
8. Scan patterns — radar sweep, barcode scan, QR decode, thermal scan
9. Matrix patterns — crossword, word search, Tetris, Sudoku, pixel art

**Remaining 88 from other approved tiers:**
10-20: More minimal motions, specific film techniques, comic conventions, etc.

### Quality Gate v3 (UPDATED)
Every template must pass ALL:
- [ ] Is the text BEING the effect (not text INSIDE an effect)?
- [ ] Is this a MECHANISM or a MEDIUM (not an ENVIRONMENT)?
- [ ] Can you describe it in 3 words that a teen recognizes?
- [ ] Is the effect SPECIFIC (not "text bounces" but "text slams like a car door")?
- [ ] Does it create a distinctive visual RHYTHM (not just a shape)?
- [ ] Would this look different from every other template at a glance?

---

## Self-Improvement Notes

### What Worked in Round 4
- Analysis-driven category selection (20% vs round 3's 2.5%)
- Parallel agent generation (20 agents, fast completion)
- Specific prompts per category with quality gates

### What to Improve
- **Over-generated in low-approval categories** — 3 physics categories (24 templates) produced only 3 likes. Should have done 1 physics category max.
- **Environment simulation trap** — Digital UI, Stationery, Art Supplies, Internet Nostalgia all fell into "text inside environment" pattern. Need stronger anti-pattern in prompts.
- **Minimal Clip-Path was a bad bet** — should have tested 2-3 first, not committed a full 8.
- **Round 5 should weight heavily toward Tier S++** — mechanical reveals, specific glitch, and pattern reveals should get 60%+ of budget.
