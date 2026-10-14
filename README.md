# monitor-miuix

Miuix-inspired public status theme for [Monitor](https://github.com/monitor-probe/monitor). This repository is a web implementation inspired by the visual language of [Miuix](https://github.com/compose-miuix-ui/miuix); it does not bundle the Compose Multiplatform library, which targets native/Compose applications rather than a browser-hosted Monitor theme.

## Development

```sh
npm ci
npm run dev
```

The Vite development server proxies `/api` and the live WebSocket to `http://127.0.0.1:9911`. Set `MONITOR_HUB=https://your-public-hub.example` to use another hub. Use `http://localhost:5173/?demo=1` for a generated local preview without a hub.

```sh
npm run build
npm test
npm run preview
```

The release asset `theme.tar.gz` contains `theme.json`, `preview.png`, and `dist/` at the archive root; the Monitor installer uses the manifest's `short` (`miuix`) as the installed directory name. Download `theme.tar.gz` from Releases (not GitHub's Source code archives). The GitHub Actions workflow checks the build, tests, lint, archive layout, and tag/manifest version before publishing. This repository is published under the standard MIT License, which permits commercial use.

## Theme design

A soft, expressive interface with rounded surfaces, pastel status accents, compact infrastructure cards, a light/dark toggle, node search and groups, plus shareable `/node/{id}` detail pages. Only public fields from Monitor's theme API are shown.

## License

This project is available under the standard MIT License, which permits use, modification, distribution, sublicensing, and sale, including commercial use, subject to the license notice and disclaimer in `LICENSE`.
