import { ChevronDown, ChevronUp, PanelLeftClose, Search } from "lucide-react";
import { Button } from "~/@/components/ui/button";
import { Input } from "~/@/components/ui/input";
import { Label } from "~/@/components/ui/label";
import { type Space } from "~/Redux/Reducers/premiseState";

export function ReservationRoomPanel({
  title,
  address,
  rooms,
  query,
  selectedRoomId,
  desktopVisible,
  mobileExpanded,
  roomDetails,
  onQueryChange,
  onSelect,
  onHideDesktop,
  onToggleMobile,
}: {
  title: string;
  address: string;
  rooms: Space[];
  query: string;
  selectedRoomId: string | null;
  desktopVisible: boolean;
  mobileExpanded: boolean;
  roomDetails: (room: Space) => { label: string; dot: string };
  onQueryChange: (query: string) => void;
  onSelect: (room: Space) => void;
  onHideDesktop: () => void;
  onToggleMobile: () => void;
}) {
  return (
    <aside
      aria-label="Kerrokseen kuuluvat tilat"
      className={`map-floating-panel absolute inset-x-3 bottom-3 z-20 flex min-h-0 flex-col overflow-hidden rounded-2xl lg:inset-x-auto lg:top-4 lg:bottom-4 lg:left-4 lg:h-auto lg:w-80 ${
        mobileExpanded ? "h-[min(60%,24rem)]" : "h-16"
      } ${desktopVisible ? "lg:flex" : "lg:hidden"}`}
    >
      <div className="hidden border-b px-5 pt-5 pb-4 lg:block">
        <div className="flex items-start justify-between gap-2">
          <h1 className="min-w-0 text-lg leading-snug font-semibold tracking-tight break-words">
            {title}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-1 -mr-2 h-9 w-9 shrink-0"
            aria-label="Piilota tilalista"
            onClick={onHideDesktop}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        {address && (
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {address}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-expanded={mobileExpanded}
        aria-controls="map-room-list"
        onClick={onToggleMobile}
        className="focus-visible:outline-primary relative flex min-h-16 shrink-0 items-center justify-between gap-3 px-5 pt-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] lg:hidden"
      >
        <span
          aria-hidden="true"
          className="bg-border absolute top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full"
        />
        <span className="flex items-center gap-2 text-sm font-semibold">
          Tilat{" "}
          <span className="text-muted-foreground text-xs font-normal">
            {rooms.length}
          </span>
        </span>
        <span className="text-muted-foreground flex items-center gap-2 text-xs">
          {mobileExpanded ? "Piilota lista" : "Näytä lista"}
          {mobileExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </span>
      </button>
      <div
        className={`${mobileExpanded ? "flex" : "hidden"} min-h-0 flex-1 flex-col lg:flex`}
      >
        <div className="shrink-0 space-y-3 px-4 pt-3 pb-4">
          <div className="hidden items-center justify-between lg:flex">
            <h2 className="text-sm font-semibold">Tilat</h2>
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs tabular-nums">
              {rooms.length}
            </span>
          </div>
          <div className="relative">
            <Label htmlFor="room-search" className="sr-only">
              Hae tilaa
            </Label>
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4"
            />
            <Input
              id="room-search"
              className="pl-9"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Hae tilan nimellä"
            />
          </div>
        </div>
        <div
          id="map-room-list"
          className="min-h-0 flex-1 [scrollbar-gutter:stable] space-y-1 overflow-y-auto overscroll-contain border-t p-2"
        >
          {rooms.length ? (
            rooms.map((room) => {
              const details = roomDetails(room);
              return (
                <button
                  key={room._id}
                  type="button"
                  aria-pressed={selectedRoomId === room._id}
                  data-room-select
                  onClick={() => onSelect(room)}
                  className={`hover:bg-accent focus-visible:outline-primary flex w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${selectedRoomId === room._id ? "border-primary/20 bg-accent" : "border-transparent"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${details.dot}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium break-words">
                      {room.name}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {room.area > 0 && <>{room.area} m² · </>}
                      {details.label}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="text-muted-foreground p-3 text-sm">
              {query
                ? "Hakua vastaavia tiloja ei löytynyt."
                : "Tässä kerroksessa ei ole tiloja."}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
