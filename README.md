# GodOfDeals

A live PC game deals comparison site. It aggregates active discounts across every major storefront (Steam, GOG, Epic, Humble, Fanatical, and more), lets you track games and get notified when they drop to your target price, and shows how good a deal actually is compared to that game's own price history.

It's a static, client-only React app — no backend, no server-side database. All personal data (wishlist, theme, currency) lives in the browser's `localStorage`.

## Features

- **Live deal aggregation** — browse and search active discounts across every store CheapShark tracks, refreshed automatically every 5 minutes.
- **Search bypasses the on-sale filter** — searching for a specific game (even a full-price new release) still finds it; only the undirected browse grid is restricted to active deals.
- **Bundle/edition grouping** — different editions of the same game (Deluxe, GOTY, Ultimate, etc.) and duplicate listings across stores are collapsed into a single card.
- **Deal quality indicator** — flags whether a sale price is actually good relative to that game's own tracked price history, not just the sticker discount.
- **Wishlist with price alerts** — heart any game to track it; get a visual alert once its price drops to (or below) a target you set, shown in your selected currency.
- **Multi-currency display** — prices are fetched and compared internally in USD, then converted to your selected currency for display only (INR, EUR, GBP, JPY, and others).
- **Filters & sorting** — by store, price ceiling, Big Deals Only, Highly Rated Only, and multiple sort orders.
- **Dark/light theme.**
- **Visitor counter** — a rolling 30-day visitor count shown in the header.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) (build tool/dev server)
- [Tailwind CSS v4](https://tailwindcss.com/)
- No backend — all state is client-side, persisted to `localStorage`.

## APIs used

| API | Purpose |
|---|---|
| [CheapShark API](https://apidocs.cheapshark.com/) | Core deal data — active discounts, game details, price history, and the list of tracked stores. |
| [Frankfurter API](https://frankfurter.dev/) | Live USD exchange rates, used to convert displayed prices into the selected currency (cached client-side for 12 hours). |
| [GoatCounter](https://www.goatcounter.com/) | Privacy-friendly, cookie-less visitor analytics — powers the "visitors in the last 30 days" counter. |

All requests are made directly from the browser; there is no proxy or backend server involved.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
```

## Deployment

Since this is a purely static Vite build, it deploys as-is to any static host (Vercel, Netlify, GitHub Pages, etc.). On Vercel, the Vite framework preset is auto-detected — no environment variables are required.
