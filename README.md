# Fish Weight

Estimate a fish's weight from its length, and compare up to three fish side-by-side.
A no-backend, installable web app (PWA).

## What it does

- Pick a **species**
  and a **length** in whole/quarter-inch increments.
- Get an estimated weight (in **lb + oz**) computed from a power curve (W = a × L^b)
  fit to MN DNR source data.
- Add up to **3 fish** (any species) shown as columns side-by-side to compare them.

Weights are **estimates derived from length only** — for comparison / catch-and-release
use, not official measurement.  Mainly a personal project to make relative comparisons
between similar-sized fish of different species, not to accurately reflect weights.

## Data sources

Weight estimates use power curves fitted to MN DNR length-to-weight tables:

- Minnesota DNR — https://files.dnr.state.mn.us/rlp/regulations/fishing/fishing_regs.pdf

Source data (whole-inch values from the DNR tables) is in `data/` at the project root
for reference.

## Why it is very limited

Because this is all I needed for now.

## Tech

React + Vite, Mantine (dark theme), `vite-plugin-pwa`. Package manager: **pnpm** (via
corepack). **Node** is needed only for local development and building — the deployed site
is static HTML/CSS/JS.

## Develop

```sh
corepack enable pnpm   # one-time, if pnpm isn't already active
pnpm install
pnpm dev               # local dev server
pnpm test              # run the unit tests (Vitest)
pnpm build             # production build into dist/
pnpm preview           # preview the production build (incl. service worker)
pnpm icons             # regenerate PWA icons from assets/icon.svg
```

The core lookup logic lives in `src/lib/fishweight.js` (with tests alongside).

## Deploy (Firebase Hosting — free)

This app is fully static, so it runs on Firebase Hosting's **free Spark plan**. Because
there's no backend, there's nothing for bots to abuse beyond static bandwidth, which the
free plan caps — so there's no auth and no billing risk.

> ⚠️ Stay on the **Spark (free)** plan. Don't upgrade to Blaze (pay-as-you-go) unless you
> intentionally need it — Spark gives a hard quota and never bills you.

One-time setup:

1. Install the CLI: `pnpm add -g firebase-tools` (or `npm i -g firebase-tools`).
2. `firebase login`.
3. Create a Firebase project at https://console.firebase.google.com (note its **Project
   ID**), then put that ID in `.firebaserc` (replace `YOUR_FIREBASE_PROJECT_ID`).

Deploy:

```sh
pnpm build
firebase deploy
```

Your app will be live at `https://<project-id>.web.app` (and `.firebaseapp.com`), with
HTTPS, for free. To preview hosting locally first: `firebase emulators:start`.

On a phone, open the URL and use the browser's **Add to Home Screen** to install it — no
app store involved. It then opens full-screen and works offline.

A `robots.txt` (and a `noindex` meta tag) keep crawlers away; the URL isn't meant to be
widely publicized.

