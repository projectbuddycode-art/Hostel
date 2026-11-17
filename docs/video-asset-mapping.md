# Video asset mapping

All four source films are 10 seconds, 1920×1080, 24 fps, H.264. They were inspected frame by frame before assignment. Compressed copies live in `public/videos`. Originals remain in the project root and in `assets/originals`.

Playback uses a poster immediately, then a muted, looping, inline file. Desktop prefers WebM and falls back to MP4. Viewports under 768 px use the smaller MP4. `prefers-reduced-motion` keeps the poster and does not start playback.

| Source file | Served as | Duration | What the picture actually does | Where it is used |
| --- | --- | --- | --- | --- |
| `Chefs_preparing_royal_dining_feast_223d68b0_1080p.mp4` | `hero.webm`, `hero.mp4`, `hero-mobile.mp4`, poster `posters/hero.jpg` | 10.0s | 0–2.5s plating a pistachio dessert. About 2s, a crimson drink poured into cut glass. 3.5–5.5s chefs setting curries, naan, pizza and salad. 6–8s a dense spread of Indian and Italian dishes, salads, juices and sweets. 8–10s the wide chandelier room. | Homepage hero. The eyebrow follows those phases: preparation before 3s, the spread from 3s to 7s, the wide room after 7s. Headline and actions are readable from the opening so the film never blocks the next step. |
| `Breakfast_commercial_for_luxury_…_a3209a56_1080p.mp4` | `breakfast.webm`, `breakfast.mp4`, `breakfast-mobile.mp4` | 10.0s | Opens on a buttered paratha, then a hand finishing poha, and settles on dosa, idli, sambar, chai and fruit. | Homepage dining collection, dining experience, breakfast page. Loaded only when the frame nears the viewport. |
| `Chef_preparing_Indian_curry_lunch_8230474c_1080p.mp4` | `lunch.webm`, `lunch.mp4`, `lunch-mobile.mp4` | 10.0s | A simmering kadai, hands composing a thali, then the finished brass tray with bread. | Homepage, dining experience, lunch page. Lazy loaded. |
| `Chef_preparing_Indian_dinner_dish_25a6c8c3_1080p.mp4` | `dinner.webm`, `dinner.mp4`, `dinner-mobile.mp4` | 10.0s | Coriander placed on a copper-pot curry, then biryani and naan, then a laid evening table. | Homepage, dining experience, dinner page. Lazy loaded. |

The grand-table section on the homepage uses the still `public/images/grand-table.jpg`, taken at 8.6 seconds of the hero film. The hero is already playing that footage, so the lower section does not download it a second time.

Stills used elsewhere are frames from the same films: plating, the pour, service, the breakfast table, the lunch kadai and thali, and the dinner garnish and biryani.
