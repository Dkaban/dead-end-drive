# Dead End Drive

**A top-down zombie-driving survivor game with a destination.**

Drive a battered car along a ruined highway, avoid and ram zombies, let your mounted turret auto-fire, collect green salvage, and choose upgrades. Reach three safehouses to win.

This is a **playable desktop-first prototype**, intentionally made with simple procedural graphics so that you can focus on learning game mechanics before worrying about artwork.

## Tech stack

- [Phaser 4](https://phaser.io/) for rendering, input, scenes and camera
- JavaScript (ES modules), no TypeScript required
- [Vite](https://vite.dev/) for the development server and production builds
- Plain HTML/CSS for the overlay and HUD, which can later be moved to React if desired
- GitHub Pages for **free** static hosting
- No server, login, API key, database, paid service or external game asset required

## Run it on your computer

You need Node.js 22.12+ or 24+ and npm. On a Mac or Windows machine, open a terminal inside this folder and run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). The first install downloads dependencies; subsequent starts are much faster.

## Play

| Key | Action |
| --- | --- |
| `W` / `↑` | Accelerate |
| `S` / `↓` | Brake / reverse |
| `A` / `←` | Steer left |
| `D` / `→` | Steer right |

- The turret automatically attacks the nearest zombie in range.
- Run over zombies at speed to deal ramming damage.
- Pick up **green salvage** from defeated zombies. Leveling up gives a choice of three random upgrades.
- Follow the arrow and the **gold waypoint ring** to each safehouse.
- A safehouse restores up to 35 integrity and grants a free upgrade.
- Reach the final evacuation point alive to win. If integrity hits zero, restart the run.

This version is designed for a keyboard, not a phone touch screen.

## Project structure

```text
.
├── index.html                 # Game mount, heads-up display and upgrade screen
├── package.json               # Runtime and developer dependencies
├── vite.config.js             # Relative path base for GitHub Pages
├── src/
│   ├── main.js                # Phaser setup
│   ├── style.css               # HUD and overlay styling
│   └── game/
│       └── DriveScene.js       # Driving, enemies, bullets, salvage, progression
└── .github/workflows/
    └── deploy.yml              # GitHub Pages automatic deployment
```

## Put it on GitHub

1. Create a **public** repository named `dead-end-drive` at https://github.com/new. Create it **empty**, without checking the initial README or .gitignore boxes.
2. Open a terminal in the extracted `dead-end-drive` folder and run:

   ```bash
   git init
   git add .
   git commit -m "Create playable driving zombie game prototype"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/dead-end-drive.git
   git push -u origin main
   ```

   Replace `YOUR-USERNAME` with your GitHub username; if using GitHub Desktop, publish this directory there instead.
3. On GitHub, open **Settings → Pages**. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Visit **Actions** to see the included workflow build and deploy the site. The published URL will be `https://YOUR-USERNAME.github.io/dead-end-drive/`.

If the workflow says that no lockfile is available: it is fine, the project uses `npm install`, not `npm ci`. It will resolve packages and deploy on each push to `main`.

## Build a production version

```bash
npm run build
npm run preview
```

A production site is generated in `dist/`, which is ignored by Git.

## Roadmap

**Milestone 1 — Drive and survive (done in prototype)**

- [x] Top-down car with arcade steering
- [x] Zombies chase the player
- [x] Auto-targeting turret with bullets
- [x] Ramming, damage, scrap collection and level-ups
- [x] Pick-one-of-three upgrades
- [x] Three checkpoints, repairs and victory/defeat
- [x] Free deployment workflow

**Milestone 2 — Make it feel like a game**

- [ ] Enemy variety (fast crawlers, tanks, explosive infected)
- [ ] Particle effects, screen shake, engine noise, shooting sounds
- [ ] Basic pixel-art car, roads, zombies and wrecks
- [ ] Road hazards, physical obstacles and steering polish
- [ ] Better level-ups and car weapon attachment visuals

**Milestone 3 — Add depth**

- [ ] Three vehicle classes and starting loadouts
- [ ] Forking route choice with risk vs reward
- [ ] Garage with upgrade costs and build combinations
- [ ] Boss battles at high-risk roadblocks
- [ ] Saved progress, unlocks and a more complete start menu

## Notes

The prototype is deliberately single-player and entirely client-side. Game data is stored only in memory; restarting the page resets the run. No personal information is collected by the game code. The CSS loads fonts from Google Fonts (you can remove the import if you prefer offline-only styling).

You can modify the route in `ROUTE` and the upgrade definitions in `UPGRADES` near the top of `src/game/DriveScene.js`.