# Leaf Evolve (demo)
Phone-first realistic animal evolve-and-fight game by leafactivity.com. Play: https://rebecca0206.github.io/leaf-evolve/

- All fights take place in one Roman Colosseum-style arena (painted backdrop, animated crowd, gates, dust).
- Real-life stats (size, weight, speed, bite/strike force, armor) are log-compressed into game stats so skill can beat size.
- Kids mode (default): no scratches, no betting. 13+ mode: mild scratch marks + in-game-coin-only crowd betting (house edge, min/max bet). No real money, no blood.
- Tests: `python3 -m http.server 8765` then `node test/e2e.js` (Playwright, both phone viewports).

Credits: animal pose art and arena backdrop are original generated LeafFauna images from the leafactivity animal encyclopedia. Real-life figures are approximate.
