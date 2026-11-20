# Leaf Evolve (demo)
Phone-first realistic animal park-and-fight game by leafactivity.com. Play: https://rebecca0206.github.io/leaf-evolve/

- Start with a tiger or lion cub. Buy or earn real animals (tiger, lion, jaguar, snow leopard, cheetah, bears, gorilla, wolf, crocs, hippo, rhino, elephant and more) and optional lion x tiger hybrids (liger, tigon).
- Feed and train each animal; growth stages Cub, Juvenile, Adult, Alpha scale real size, weight, bite and speed.
- Leaf Park: build and upgrade habitats (forest, savanna, jungle, arctic, wetland, desert); visitors pay coins over time.
- Colosseum: one painted Roman arena with an animated crowd. Team of up to 3 with tag-switching, block/parry, dodge, stamina, grapple/pin minigame and per-animal specials.
- Kids mode (default): no scratches, no betting. 13+ mode: mild scratch marks and coin-only crowd betting (house edge, min/max bet). No blood, no real money.
- Tests: `python3 -m http.server 8765` then `node test/e2e.js` (Playwright, both phone viewports).

Credits: animal pose art and the arena backdrop are original generated LeafFauna images from the leafactivity animal encyclopedia. The liger and tigon art is a procedural re-tint of the lion and tiger poses. Real-life figures are approximate.

## v4 graphics upgrade
Painted crowd (3 parallax layers, bobbing strips, kid-safe variant without slips), real cub/juvenile art for tiger, lion, wolf and grizzly (other species keep scaled adult art), springy squash/stretch + breathing + run bob, lunge trails, contact shadows, sun shafts + dust motes + depth haze, impact rings, big-hit punch-in zoom, restyled HUD/buttons, painted habitat cards and park hero. Particles capped at 90. Art is original generated imagery (leafactivity.com).
