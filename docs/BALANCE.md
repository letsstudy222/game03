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

33 evolutions split into five branches, including an immediately available discount branch. Purchases require their parent; already owned legacy nodes remain accessible. The default shop uses branch-specific cards with current/next effects, required parents, missing money, and direct purchase buttons. Recommendations favor defenses after UFO defeat and radiation protection after solar defeat. An optional graph preserves the overall tree.

Upgrade price is `round(base × (1 + 0.75 × (tier − 1)) × 5 ^ currentRank × (1 − 0.15 × researchRank))`. Roots cost 80–105 coins. Subsequent ranks multiply the base price by five; the discount branch costs 80 initially and reduces prices by 15% per rank, up to 60%. A gravity beam costs 90, 450, 2,250 and 11,250 before discounts.

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

`holeGameV5` remains the storage key. Schema 8 retains map unlocks and adds counts for six manually collected space specimens. Old currency, ranks, skins, records, and time are preserved; completed legacy universes start in the solar area. Old final milestone claims migrate by category to avoid duplicate payout. Historical elapsed play time cannot be reconstructed.

## Validation

```sh
node --test tools/game.test.mjs
node tools/balance.mjs 2
python3 tools/smoke.py
```

The browser check needs Python Playwright and `/usr/bin/chromium`. It starts and stops its own temporary HTTP server. Checks cover pointer/touch input, pause, settlement, card purchases, optional graph navigation, small screens, all three backgrounds, solar guidance, and fireworks.

The seeded harness runs the actual inline game logic at 60 steps/s, including damage, spawning, physics, map transitions, skills, rewards, and prices. Bots manually collect at 1.7, 1.1, or 0.7-second intervals, with different throw rates and branch preferences. Their collection gestures are instantaneous; they allow 25, 20, or 14 seconds of shopping per run, respectively.

Current tuning, one seed per profile, preview money disabled:

| Profile | Victory | Runs | Rank purchases |
| --- | ---: | ---: | ---: |
| Casual | 53.4 min | 39 | 83 |
| Steady | 49.7 min | 39 | 81 |
| Skilled | 41.4 min | 35 | 79 |

Bots include rare-object manual captures using held state and a fifth shop preference for discounts. Actual reading, planning, missed throws and different builds can extend these estimates toward an hour or beyond. Infinite-money preview intentionally removes the economy's pacing. These are simulations, not measured human completion times.

## Preview money and manual specimens

Infinite upgrade money is on by default for the requested preview. Menu and shop buttons can disable it. Its setting is stored separately in `holePreviewMoney`; the real coin wallet still accumulates rewards and preview purchases never subtract it. Prerequisites and rank limits apply in both modes. Harness tests and balance simulations disable preview money.

Rare objects pass across the upper playfield every nine seconds, live for up to twelve seconds, and use a gold rim and manual-drag label. They ignore gravity, collectors, satellites, capacitor chains and blast pushes. Consumption requires the held state, so throwing them or letting them pass through the hole cannot collect them. The six specimens unlock across maps (two per map). The collection page shows undiscovered specimens as black silhouettes, reveals names only after capture, and records persistent counts without duplicate settlement. Accessible from menu, shop and pause.

Player text uses “tiền” for upgrade currency and “sức mạnh” for the growing resource drained by enemies. Menu and shop explain their purposes. Upgrade cards show a clickable required parent, current/next effect, and child unlock names; the graph includes the separate discount root. UFOs use canvas metal gradients, a glass dome, underside lighting and animated tractor beams.
