# TilaTikki

## About this fork

This is my personal continuation of [VirittamoHelsinki/tilatikki-app](https://github.com/VirittamoHelsinki/tilatikki-app), maintained independently at [kamm3r/tilatikki-app](https://github.com/kamm3r/tilatikki-app). It develops my original idea into a working prototype: make it easy for users to find available rooms in registered buildings and reserve them through a map.

This version adds geographic building search, room search, multiple floors, clickable room maps with reservation status, booking and cancellation, and a smoother flow between search, sign-in, and reservation. The original project's Git history is retained, with credit to its contributors.

## How it works

Find buildings on a geographic map, search registered buildings, addresses, or rooms, and reserve rooms from a floor map. The plan image comes from a building's `blueprint` entry. Each room's clickable outline is stored in the room's `mapPolygon` as points from 0 to 100 percent across that image. The room list, availability windows, existing reservations, and booking IDs all come from MongoDB.

## Run the demo

Use Node.js 24 and a local MongoDB server. Copy `.env.example` to `.env` and set a random `JWT_SECRET`.

```sh
npm run setup:project
npm run seed:demo
npm run dev
```

Open [http://localhost:5050](http://localhost:5050). Search for `Pakila`, `Halkosuontie`, or `B204`, or select the building marker. Building results open the first floor with tabs for switching floors; room results open that room's booking popup. Sign in with `demo.user@edu.hel.fi` / `DemoPassword1!`. The demo seed is safe to run again: it updates the same local premise, the Pakila demo and two clearly labeled mock locations, floor plans, and availability windows. It refuses nonlocal MongoDB connections.

The extra mock locations are **Keskustan työtila** (two floors, eight rooms) and **Kallion kokoustalo** (three floors, twelve rooms). Their addresses, locations, and layouts are fictional. The demo user can book rooms at all three locations. Rerunning the seed preserves existing bookings and availability windows.

## Geographic map prototype

The geographic map uses Leaflet and OpenStreetMap tiles without an API key. Search covers locations and rooms registered in this app, rather than all worldwide places. Set a building's `location` to `{ "latitude": 60.243484, "longitude": 24.934855 }` to show a marker. A premise can also have a location, used as the fallback for its buildings. Records without coordinates remain searchable and bookable. The demo coordinates come from the [Helsinki Service Map](https://palvelukartta.hel.fi/en/unit/76240).

The existing floor-plan viewer opens after selecting a building; indoor geometry is not yet geographically aligned over the street map. Multiple floors and booking are managed by our app.

The default public tile service requires visible attribution and compliance with the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/). No offline download or tile prefetch is provided. For another OSM-derived tile endpoint, set `VITE_MAP_TILE_URL` in `client/.env.local` and rebuild the client. Provider-specific attribution must also be updated when switching providers.

Choose a start and end time to see each room's status on the map and in the room list. Green rooms are free, red rooms are reserved, and gray rooms cannot be reserved for that time. Select a room on the map or in the list to open its popup and book the selected time there. If you sign in from the popup, the app returns to the same room and time. The archive button in the header shows your reservations and lets you cancel them. Booking or cancellation updates the map; the API rejects overlapping bookings.

The [short demo recording](http://localhost:5050/reservation-map-flow.mp4) shows room selection on both floors, booking, and cancellation.

To add a mapped room, send an authenticated `POST /api/space` with `premiseId`, `buildingId`, `floor`, `name`, and `mapPolygon` (at least three points, each with `x` and `y` percentages between 0 and 100). Add its reservable time window with `POST /api/availability` using the new `spaceId`, `startdate`, and `enddate`. The map and room popup then read both records from MongoDB.

For live frontend edits, run `npm --prefix client run dev` alongside the server. Vite proxies `/api` to port 5050.

## Checks

```sh
npm run build
npm run lint
npm test
npm run typecheck
```

`npm run build` builds the client and server. `npm start` serves the built app. The project uses React, Express, MongoDB, Redux, Tailwind CSS, TypeScript, and Vitest.
