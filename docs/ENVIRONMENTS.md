# Environment art and scientific inspiration

The previous scenery repeated a shaded planet, tinted dust and floating polygon debris. Changing its colors did not create different places. The current five environments each have an original illustration, different dominant geometry and dedicated moving foreground materials. The original generated PNGs are retained in the execution workspace; deployed WebP derivatives preserve their full dimensions and reduce the five files to approximately 1.3 MiB.

These are original game illustrations, not NASA photographs or observational reconstructions. Their lighting, giant nearby mineral structures and viewing distances are composed for gameplay.

| Region | Scientific inspiration | Visual composition | Moving foreground |
| --- | --- | --- | --- |
| Earth orbit | Earth's atmosphere, cloud systems and orbital hardware | Curved blue horizon, Moon, station structure and solar panels | Orbital panels and small probes |
| Metallic asteroid field | Metal-rich asteroid (16) Psyche; iron and nickel are plausible materials | Fractured irregular silver/rust-colored masses, rock stream at varying distances and a distant cratered body | Dark faceted rubble and distant probes |
| Ice ocean | Europa and evidence for a subsurface ocean beneath a fractured icy shell | White/blue ice horizon with reddish fissures, a large banded Jupiter-like world and several moons | Refracting water-ice shards |
| Carbon region | Hypothetical carbon-rich rocky worlds and high-pressure mineral formation | Black graphite/obsidian-inspired rock, bright faceted outcrops, a hot rocky planet and small companion | Angular crystalline fragments |
| Solar corona | Ionized plasma, magnetic loops and the solar atmosphere | Fine arching gold/orange plasma filaments, scorching rim light and small rocky bodies | Hot drifting particles and filaments |

The carbon scene is speculative. It does not assert that an observed planet is made entirely of diamonds. Carbon-rich interior models and popular descriptions of “diamond planets” are not confirmation of giant exposed diamond fields. Likewise, the metal region does not assert the existence of a planet made of gold. Europa's liquid ocean is depicted as hidden below ice, rather than as an exposed tropical sea.

Reference pages for review:

- [NASA: asteroid (16) Psyche](https://science.nasa.gov/solar-system/asteroids/16-psyche/)
- [NASA: Psyche mission](https://science.nasa.gov/mission/psyche/)
- [NASA: Europa](https://science.nasa.gov/jupiter/moons/europa/)
- [NASA: 55 Cancri e catalog](https://science.nasa.gov/exoplanet-catalog/55-cancri-e/)
- [NASA: Sun facts](https://science.nasa.gov/sun/facts/)

The art brief uses established planetary-science knowledge and the scientific/artistic distinctions above. Direct retrieval of these NASA pages during this session was blocked by the environment's network proxy (HTTP 403), so the links are supplied for review and are not represented as freshly fetched sources.

## Visual and interaction rules

The center remains visually clear for the hole and collectibles. A narrow dark backing under interface text keeps it legible over bright ice and reflections. Foreground objects drift at different rates by depth; their alpha and edge placement distinguish scenery from interactive items. Canvas backgrounds are cached; image decoding invalidates the current cache when necessary.

Growth now follows `18 + 82 × (energy/42000)^0.34`, clamped to the victory energy. A hole grows from roughly 23 units at 12 energy to 35 at 400, 49 at 2,400, 66 at 8,500, 86 at 24,000 and 100 at victory. Physical capture and attraction use the same base radius. Render pulses have a 104-unit cap, so large rewards cannot inflate the whole screen.

Travel is an original spectral light-column effect inspired by cinematic portal journeys: a luminous foot, filaments rising through the column, a lift of the real attraction center, then a soft scene change around the bright midpoint and a landing. It does not pause collecting or open an overlay. The column avoids a full-screen white flash. Reduced motion uses a short crossfade with no lift or filaments.
