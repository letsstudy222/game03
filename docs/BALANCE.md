# Điểm Kỳ Dị: three-map campaign

The campaign targets about one hour for an active player, including selecting upgrades. Each run remains short; progression comes from repeated purchases and permanent map unlocks. Timing is a tuning estimate, not a mandatory wait.

## Maps

| Map | Objective | Encounter |
| --- | --- | --- |
| Earth | Survive the recovery fleet | UFO arrives after 24–36 s; survival permanently opens orbit |
| Asteroid belt | Survive UFO and gather 3,500 mass | Stronger fleet, followed by up to 22 s to charge the next journey |
| Heliosphere | Survive UFO and absorb the Sun at 11,500 mass | Strongest fleet; solar gravity drains mass for up to 22 s |

UFO drain is `(48 + mass × 0.18) × map multiplier × armor fraction × defense multiplier`. Map multipliers are 1, 1.2, and 1.4. Basic beams remove one of three armor points; every hit lowers the drain. Radiation shields reduce the Sun's separate drain `(18 + mass × 0.026)`. The HUD reports the actual solar drain and missing mass.

Map-unlock rewards are 300 and 700 credits and are paid once. A transition banks the current run and opens the next map before the next run starts. Defeat never locks a previously opened map. Earth, the belt, and the solar area have distinct cached backgrounds, materials, and docks. The Sun appears only in the final area.

The black-hole radius is `18 + 86 × min(1, mass/mapGoal)^0.58`. It no longer saturates at low mass. In the final area, an underpowered hole remains smaller than the Sun; at the target it grows larger and the absorption animation starts.

## Economy and upgrades

33 evolutions split into independent branches. Purchases require their parent; already owned legacy nodes remain accessible. The default shop uses branch-specific cards with current/next effects, required parents, missing money, and direct purchase buttons. Recommendations favor defenses after UFO defeat and radiation protection after solar defeat. An optional graph preserves the overall tree.

Upgrade price is `round(base × (1 + 0.75 × (tier − 1)) × 3 ^ currentRank × (1 − 0.04 × researchRank))`. Roots cost 90–105 credits; subsequent ranks cost three times the previous base amount. For example, a gravity beam costs 90, 270, 810, and 2,430 credits before research discounts.

| Material | Mass | Credits | Interval/source |
| --- | ---: | ---: | ---: |
| Salvage | 4 | 3 | 1.2 s |
| Reactor fuel | 10 | 6 | 3.0 s |
| Fireworks | 8 | 5 | 3.6 s |
| Capacitor | 14 | 8 | 4.4 s |

Intervals scale by `0.9 ^ conveyorRank / sourceCount`, with a minimum of 0.18 s. Solar generation is 1.8 times faster. External generation pauses at 160 active objects rather than deleting held items. All purchased sources contribute.

Run reward: `floor(collectionCredits) + 20 + min(16, round) + round(peakMass × 0.04) + 35 if UFO survived`. Milestones at 100, 400, 1,000, 2,400, and 11,500 mass grant one-time rewards of 60, 100, 160, 240, and 360. The winning run also banks earnings. Cosmetics use separate crystals.

Click the gravity button or press Q to cast immediately; no targeting click is needed. Base cooldown is six seconds and improves with ranks. Entering the UFO phase caps remaining cooldown at one second.

## Graphics and persistence

Firework rockets have bright launch trails; their bursts use colored radial sparks, white cores, drag, gravity, fading, and a bounded 420-spark budget. Decorative sparks are separate from collectible embers, so cosmetic density does not create extra money or fuel. Particle/ring/arc/text budgets and cached backgrounds limit rendering work. Hit pulses never stop physics or the game clock. Reduced-motion preferences suppress shake, flashes, and reduce burst density.

`holeGameV5` remains the storage key. Schema 7 adds the highest opened map and one-time exploration rewards. Old currency, ranks, skins, records, and time are preserved; completed legacy universes start in the solar area. Old final milestone claims migrate by category to avoid duplicate payout. Historical elapsed play time cannot be reconstructed.

## Validation

```sh
node --test tools/game.test.mjs
node tools/balance.mjs 2
python3 tools/smoke.py
```

The browser check needs Python Playwright and `/usr/bin/chromium`. It starts and stops its own temporary HTTP server. Checks cover pointer/touch input, pause, settlement, card purchases, optional graph navigation, small screens, all three backgrounds, solar guidance, and fireworks.

The seeded harness runs the actual inline game logic at 60 steps/s, including damage, spawning, physics, map transitions, skills, rewards, and prices. Bots manually collect at 1.7, 1.1, or 0.7-second intervals, with different throw rates and branch preferences. Their collection gestures are instantaneous; they allow 25, 20, or 14 seconds of shopping per run, respectively.

Final tuning, two seeds per profile:

| Profile | Victory | Runs | Rank purchases |
| --- | ---: | ---: | ---: |
| Casual | 56.6–56.7 min | 42 | 84–85 |
| Steady | 48.9–50.2 min | 39–40 | 80 |
| Skilled | 45.6–46.1 min | 40 | 79 |

Actual reading, planning, missed throws, and different builds can extend those estimates toward an hour or beyond; optimized play can be faster. These are simulations, not measured human completion times.
