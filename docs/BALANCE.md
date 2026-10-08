# Điểm Kỳ Dị: five-region continuous flight

Each run starts as a small hole in Earth orbit. Reaching an energy goal immediately moves the live game to the next region, with a 1.4-second crossfade and warp streaks. Collection, controls, sources, earnings and elapsed run time continue during flight. Reduced motion uses a short crossfade. Defeat ends the run; the next run always starts in region one. Coins, purchased ranks, cosmetics and specimen discoveries persist.

## Route and timing

| Region | Energy needed to leave | Source speed | UFO multiplier |
| --- | ---: | ---: | ---: |
| Earth orbit | 400 | 1.00 | 1.00 |
| Asteroid belt | 2,400 | 1.25 | 1.12 |
| Blue ice region | 8,500 | 1.60 | 1.25 |
| Nebula sea | 24,000 | 2.10 | 1.40 |
| Stellar core | 42,000 to absorb the Sun | 2.70 | Solar field |

Energy carries between regions. Every nonfinal region allows up to 58 seconds; the Sun allows 32 seconds. Each early region schedules UFO arrival after 24–36 seconds, depending on delay ranks. A survived attack schedules another after 18 seconds plus delay; survival alone does not advance the route. Reaching a goal cancels the local fleet and begins the next region immediately.

UFO drain is `(48 + energy × 0.18) × region multiplier × remaining armor fraction × defense multiplier`. Basic beams remove one of three armor points, immediately weakening the drain. The final solar field drains `(24 + energy × 0.019) × solarResistance`; radiation protection reduces it 12% per rank. Later NG+ universes increase drain. The HUD explains current target, solar drain and remaining time. Reaching a target before the next update wins over the following frame's drain.

Hole radius follows total energy, `20 + 84 × min(1, energy/42000)^0.5`, so it does not shrink when changing regions. The Sun has a 95-unit radius; the hole reaches 104 at victory. Absorption pulses are bounded so rare specimens cannot inflate the hole's apparent size disproportionately.

## Prices, ranks and rewards

33 upgrades use five branches. The discount branch is available immediately at 80 coins and reduces prices 15% per rank, up to 60%. Price is `round(base × (1 + 0.75 × (tier − 1)) × 6 ^ currentRank × (1 − 0.15 × discountRank))`. A gravity beam costs 90, 540, 3,240 and 19,440 before discounts. Cards show the clickable parent prerequisite, current/next effect and upgrades unlocked by purchase; a complete graph remains available.

Mass gain ranks grant 20% per rank. Starting energy is `12 + 10 × startingRank`, regardless of past records. The former carry upgrade now grants 2.5% of the passed region's goal per rank during each transition; it does not enlarge the initial hole. Special-fuel ranks grant 14% extra energy per rank for fuel, fireworks and batteries, excluding rare specimens.

| Regular item | Energy | Coins | Interval per source |
| --- | ---: | ---: | ---: |
| Salvage | 4 | 3 | 1.2 s |
| Reactor fuel | 10 | 6 | 3.0 s |
| Fireworks | 8 | 5 | 3.6 s |
| Battery | 14 | 8 | 4.4 s |

Intervals scale by `0.9 ^ conveyorRank / sourceCount / regionSupply`, with a minimum of 0.18 s. Solar generation receives an extra factor of 1.3. All purchased sources contribute. Generation pauses at 160 active objects without deleting held items.

Run reward is `floor(collectionCoins) + 20 + min(16, round) + round(peakEnergy × 0.04) + 35 if UFO survived or a region was crossed`. Milestones at 100, 400, 2,400, 8,500, 24,000 and 42,000 grant 60, 100, 180, 280, 420 and 650 coins once. The four first-exploration rewards are 90, 170, 300 and 480; they join the live run's earnings and are marked claimed only when that run settles. Abandoning a flight cannot lose an unpaid exploration reward. Victory settles the final run once and adds 600 plus 300 per NG+ universe.

## Specimens, art and saves

Twelve rare specimens pass every nine seconds, live for twelve seconds and must be dragged into the hole while held. They ignore ambient gravity, collectors, satellites, capacitor chains and blast pushes. They have custom irregular SVG silhouettes and a small “KÉO TAY” label, with no circular frame. Three species appear in each of the first two regions, and two in each later region. Existing discovery IDs retain their counts. The collection shows black silhouettes until capture; discovered cards show names, counts and base rewards.

Thirteen custom SVG material drawings replace collectible emoji, with metallic, glass and faceted shading. Images load once and are reused. Backgrounds use cached lighting, textured planets, atmospheric limbs, occluded rings, layered nebula noise and foreground parallax. Nebula noise never consumes gameplay RNG. Rendering honors reduced motion. Firework particles remain bounded and separate from collectible embers; hit pulses do not freeze physics.

`holeGameV5` remains the save key. Schema 9 treats stored region as a best-route record, never a starting checkpoint. Existing coins, ranks, skins, records and discoveries remain intact. Legacy milestone claims migrate to the matching new categories; completed legacy runs cannot claim the final milestone again. Schema 9 claims are filtered directly, so claiming region four cannot silently claim victory on reload.

Infinite upgrade money remains on by default for the requested preview. Menu and shop buttons toggle it. The separate `holePreviewMoney` setting preserves the real wallet; preview purchases do not subtract coins. Prerequisites and rank limits still apply. Simulations and logic tests disable preview money.

## Validation and pacing

```sh
node --test tools/game.test.mjs
node tools/balance.mjs 2
python3 tools/smoke.py
```

The browser test requires Python Playwright and `/usr/bin/chromium`, and starts its own temporary HTTP server. It checks all 25 SVG images, mouse/touch collection, rare capture, collection silhouettes, pause, purchases, preview toggling, graph navigation, small-screen scrolling, all five scenes, warp continuity and restarting from Earth.

The seeded harness executes the actual game at 60 steps/s. Bots substitute instantaneous manual gestures at 1.7, 1.1 or 0.7-second intervals and shop for 25, 20 or 14 seconds per run. Two seeds per profile, normal money:

| Profile | Completion | Runs | Rank purchases |
| --- | ---: | ---: | ---: |
| Casual | 54.8–55.8 min | 32–33 | 89–90 |
| Steady | 43.0–44.7 min | 27–28 | 82–83 |
| Skilled | 35.9–37.2 min | 24–25 | 78–80 |

The target is roughly one hour for casual play, with faster completion for optimized builds. These are simulation estimates, not measured human times. Reading, planning and missed gestures can extend them; infinite money intentionally removes the economy's pacing.
