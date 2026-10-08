# Điểm Kỳ Dị: campaign balance

The first campaign targets roughly 30 minutes for an active player, including time choosing upgrades. This is a tuning target, not a timer or a mandatory delay. Existing `holeGameV5` saves retain currency, owned ranks, skins, and records; historical play time cannot be reconstructed.

## Progression

- 33 evolutions, four branches, all accessible in the first universe. Each branch unlocks progressively through its previous node. Already owned nodes remain accessible when an old save is loaded.
- First UFO after 42 seconds; signal upgrades extend this to 66 seconds.
- UFO attack lasts 12 seconds, reducible to 9.6 seconds. Each UFO has three armor points. Basic gravity beams deal one damage; penetration upgrades increase that to three.
- The solar stage lasts at most 48 seconds. Reach 6,500 mass and survive the UFO attack to absorb the Sun.
- Material stations aggregate all purchased sources; there is no eight-slot truncation.
- Mass milestones at 100, 400, 1,000, 2,400, and 6,500 grant one-time credit rewards of 60, 100, 160, 240, and 360.

| Material | Mass | Credits | Base interval per source |
| --- | ---: | ---: | ---: |
| Salvage | 4 | 3 | 1.6 s |
| Reactor fuel | 10 | 6 | 3.8 s |
| Fireworks | 8 | 5 | 4.5 s |
| Capacitor | 14 | 8 | 5.5 s |

Source intervals scale by `0.9 ^ conveyor rank / source count`; solar generation is 1.8 times faster. Each station has a minimum 0.18-second interval. External generation stops temporarily at 160 active objects rather than deleting player-held objects. Firework secondary objects are processed separately.

Upgrade price is `round(base × (1 + 0.55 × (tier − 1)) × 1.85 ^ currentRank × (1 − 0.04 × researchRank))`. Early roots cost 85–100 credits. Collection, recycling, round rewards, milestones, and victory rewards use the same wallet. The final winning round banks its earnings, too.

Round rewards are `20 + min(16, round) + round(peakMass × 0.04) + 35 if UFO survived`. One-time milestones are added separately. Money is rounded down only at settlement; fractional collection/recycling is retained during a run.

Later branches add automatic collection, wider ground attraction, satellites, longer capacitor chains, radiation resistance, persistent starting mass, and fusion. Throw and combo bonuses reward active play. Cosmetics use a separate crystal currency.

Visual hit pulses do not pause physics or timers. Pause, loss of window focus, and hidden tabs pause active play. Cosmetic effect arrays have bounded sizes for busy late-game scenes.

## Reproducing validation

```sh
node --test tools/game.test.mjs
node tools/balance.mjs 3
python3 tools/smoke.py
```

The browser check needs Python Playwright and `/usr/bin/chromium`. It serves the repository on a temporary local port and shuts down only its own server.

The balance harness executes the game's actual inline JavaScript, with a mock DOM and seeded randomness. It keeps real spawning, physics, skills, upgrade transactions, rewards, and damage. Bots substitute bounded manual collection: one object every 1.7, 1.1, or 0.7 seconds, with different throw rates and branch preferences. They choose affordable upgrades between runs. Collection gestures are instantaneous at each interval, so this is a favorable approximation rather than a human playtest.

Validation at 60 simulation steps per second, three seeds per profile:

| Profile | First victory | Rounds | Rank purchases |
| --- | ---: | ---: | ---: |
| Casual | 27.6 min | 14 | 57–58 |
| Steady | 27.0–27.4 min | 14 | 59–61 |
| Skilled | 25.6 min | 14 | 56 |

These times include 25, 20, and 14 seconds of shopping per round respectively. Reading the expanded tree, slower gestures, different purchases, and abandoned runs can lengthen the campaign; an optimized build can shorten it. Validate actual player sessions before treating these estimates as measured completion times.
