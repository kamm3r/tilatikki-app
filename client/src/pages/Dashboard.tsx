import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, ArrowRight, Building2, Search, X } from "lucide-react";
import { Button } from "~/@/components/ui/button";
import { Input } from "~/@/components/ui/input";
import { Label } from "~/@/components/ui/label";
import { usePremiseAction } from "~/hooks/usePremise";
import { useTypedSelector } from "~/hooks/useTypedSelector";
import { type Premise } from "~/Redux/Reducers/premiseState";

type SearchResult = {
  key: string;
  name: string;
  subtitle: string;
  premise: Premise;
  buildingId?: string;
  floor?: number;
  roomId?: string;
  floors: number;
  rooms: number;
  location?: { latitude: number; longitude: number };
};

function validLocation(location: SearchResult["location"]) {
  return Boolean(
    location &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180,
  );
}

export function Dashboard() {
  const { getAllPremises } = usePremiseAction();
  const { premisesData, isLoading, alertText } = useTypedSelector(
    (state) => state.premise,
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [tileError, setTileError] = useState(false);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    getAllPremises();
  }, [getAllPremises]);

  const buildings = useMemo<SearchResult[]>(() => {
    const premises = Array.isArray(premisesData.premises)
      ? premisesData.premises
      : [];
    return premises.flatMap((premise) =>
      premise.buildings.length
        ? premise.buildings.map((building) => ({
            key: building._id,
            name: premise.name,
            subtitle: `${building.name} · ${premise.address}`,
            premise,
            buildingId: building._id,
            floors: building.floors,
            rooms: building.rooms,
            location: building.location ?? premise.location,
          }))
        : [
            {
              key: premise._id,
              name: premise.name,
              subtitle: premise.address,
              premise,
              floors: 0,
              rooms: 0,
              location: premise.location,
            },
          ],
    );
  }, [premisesData.premises]);

  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fi-FI");
    if (!term) return buildings;
    const matches = buildings.filter((item) =>
      `${item.name} ${item.subtitle}`.toLocaleLowerCase("fi-FI").includes(term),
    );
    const rooms = buildings.flatMap((item) => {
      const building = item.premise.buildings.find(
        (building) => building._id === item.buildingId,
      );
      return (building?.space ?? [])
        .filter((room) => room.name.toLocaleLowerCase("fi-FI").includes(term))
        .map((room) => ({
          ...item,
          key: room._id,
          name: room.name,
          subtitle: `${item.premise.name} · ${building!.name} · ${room.floor}. kerros`,
          roomId: room._id,
          floor: room.floor,
        }));
    });
    return [...matches, ...rooms];
  }, [buildings, query]);

  useEffect(() => {
    if (!mapElement.current) return;
    const map = L.map(mapElement.current, { zoomControl: false }).setView(
      [60.22, 24.94],
      12,
    );
    mapRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);
    const tiles = L.tileLayer(
      import.meta.env.VITE_MAP_TILE_URL ||
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    tiles.on("load", () => {
      if (mapElement.current?.querySelector("img.leaflet-tile-loaded"))
        setTileError(false);
    });
    markersRef.current = L.layerGroup().addTo(map);
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(mapElement.current);
    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const positions: L.LatLngTuple[] = [];
    for (const item of buildings) {
      if (!validLocation(item.location)) continue;
      const coordinates: L.LatLngTuple = [
        item.location!.latitude,
        item.location!.longitude,
      ];
      positions.push(coordinates);
      const marker = L.marker(coordinates, {
        title: `${item.name}, ${item.subtitle}`,
        alt: item.name,
        icon: L.divIcon({
          className: "reservation-building-pin",
          html: '<span aria-hidden="true">▥</span>',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        }),
      }).addTo(layer);
      const label = document.createElement("span");
      label.textContent = item.name;
      marker.bindTooltip(label, { direction: "top", offset: [0, -40] });
      marker.on("click", () => setSelected(item));
    }
    if (positions.length)
      map.fitBounds(L.latLngBounds(positions), {
        paddingTopLeft:
          map.getSize().x >= 1024
            ? [384, 30]
            : [30, map.getSize().y * 0.6 + 24],
        paddingBottomRight: [30, 45],
        maxZoom: 15,
      });
  }, [buildings]);

  useEffect(() => {
    if (!selected || !validLocation(selected.location)) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const map = mapRef.current;
    if (!map) return;
    map.setView(
      [selected.location!.latitude, selected.location!.longitude],
      17,
      { animate: false },
    );
    map.panBy(
      map.getSize().x >= 1024 ? [-184, 0] : [0, -map.getSize().y * 0.22],
      { animate: !reducedMotion },
    );
  }, [selected]);

  return (
    <main className="relative isolate min-h-0 min-w-0 flex-1 overflow-hidden bg-slate-100">
      <div
        ref={mapElement}
        aria-label="Toimipaikkojen kartta"
        className="absolute inset-0 z-0"
      />
      <section
        aria-label="Rakennusten ja tilojen haku"
        className="map-floating-panel absolute top-3 right-3 left-3 z-10 flex max-h-[60%] min-h-0 flex-col overflow-hidden rounded-2xl lg:top-4 lg:right-auto lg:bottom-4 lg:left-4 lg:max-h-none lg:w-[22rem]"
      >
        <div className="shrink-0 p-4">
          <h1 className="text-lg font-semibold tracking-tight">
            Löydä varattava tila
          </h1>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Hae toimipaikkaa, rakennusta, osoitetta tai huonetta.
          </p>
          <div className="relative mt-4">
            <Label htmlFor="place-search" className="sr-only">
              Hae rakennusta tai tilaa
            </Label>
            <Search
              className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4"
              aria-hidden="true"
            />
            <Input
              id="place-search"
              className="pr-10 pl-9"
              placeholder="Esim. Pakila tai B204"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
              }}
            />
            {query && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-0 right-0"
                aria-label="Tyhjennä haku"
                onClick={() => {
                  setQuery("");
                  setSelected(null);
                  document.getElementById("place-search")?.focus();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {alertText && (
          <p role="alert" className="text-destructive px-4 pb-3 text-sm">
            {alertText}
          </p>
        )}
        {tileError && (
          <p role="alert" className="px-4 pb-3 text-xs">
            Karttapohjaa ei voitu ladata. Voit silti valita rakennuksen
            hakutuloksista.
          </p>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t">
          {selected ? (
            <div className="space-y-4 p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(null)}
                className="-ml-2 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Takaisin tuloksiin
              </Button>
              <div>
                <h2 className="text-base font-semibold break-words">
                  {selected.name}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {selected.subtitle}
                </p>
              </div>
              <p className="text-muted-foreground text-sm">
                {selected.floors} kerrosta · {selected.rooms} tilaa
              </p>
              {!validLocation(selected.location) && (
                <p className="text-muted-foreground text-xs">
                  Tämän rakennuksen sijaintia ei ole vielä lisätty kartalle.
                </p>
              )}
              <Button asChild className="w-full gap-2">
                <Link
                  to={`/premises/${selected.premise._id}`}
                  state={{
                    buildingId: selected.buildingId,
                    floor: selected.floor,
                    roomId: selected.roomId,
                  }}
                >
                  {selected.roomId
                    ? "Avaa tilan varaus"
                    : "Valitse kerros ja tila"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground px-4 pt-3 pb-1 text-xs">
                {isLoading
                  ? "Haetaan toimipaikkoja..."
                  : `${results.length} ${query ? "hakutulosta" : "rakennusta"}`}
              </p>
              <ul className="space-y-1 p-2">
                {results.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="hover:bg-accent focus-visible:outline-primary flex w-full items-start gap-3 rounded-xl p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                    >
                      <span className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <Building2
                          className="h-5 w-5 text-slate-600"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium break-words">
                          {item.name}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-xs leading-relaxed break-words">
                          {item.subtitle}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {!isLoading && !results.length && (
                <p className="text-muted-foreground px-4 pb-4 text-sm">
                  {query
                    ? "Hakua vastaavia rakennuksia tai tiloja ei löytynyt. Kokeile toista nimeä tai osoitetta."
                    : "Toimipaikkoja ei ole vielä lisätty."}
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
