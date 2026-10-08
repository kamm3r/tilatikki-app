import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type SetStateAction,
} from "react";
import {
  ChevronDown,
  ArrowLeft,
  Maximize2,
  PanelLeftOpen,
  SlidersHorizontal,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Cookies from "universal-cookie";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "~/@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/@/components/ui/dialog";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "~/@/components/ui/popover";
import { FloorTabs } from "~/@/components/FloorTabs";
import { ReservationRoomPanel } from "~/@/components/ReservationRoomPanel";
import { ReservationMapControls } from "~/@/components/ReservationMapControls";
import { usePremiseAction } from "~/hooks/usePremise";
import { useTypedSelector } from "~/hooks/useTypedSelector";
import {
  type BuildingDetails,
  type Space,
} from "~/Redux/Reducers/premiseState";
import {
  getRoomStatus,
  type Availability,
  type RoomStatus,
} from "~/utils/roomStatus";
import { reservationsChangedEvent } from "~/utils/reservationEvents";

type Times = { start: string; end: string };
type DisplayStatus = RoomStatus | "loading" | "error" | "invalid";
type BookingFeedback = {
  roomId: string;
  kind: "saving" | "success" | "error" | "login";
  message?: string;
};

const statusDetails: Record<
  DisplayStatus,
  { label: string; fill: string; stroke: string; dot: string; badge: string }
> = {
  available: {
    label: "Vapaa",
    fill: "#46bd96",
    stroke: "#087855",
    dot: "bg-emerald-600",
    badge: "bg-emerald-50 text-emerald-800",
  },
  reserved: {
    label: "Varattu",
    fill: "#ef8b8b",
    stroke: "#a02d37",
    dot: "bg-rose-600",
    badge: "bg-rose-50 text-rose-800",
  },
  unavailable: {
    label: "Ei varattavissa",
    fill: "#adb5bd",
    stroke: "#66717d",
    dot: "bg-slate-500",
    badge: "bg-slate-100 text-slate-600",
  },
  loading: {
    label: "Tarkistetaan",
    fill: "#b7c4d0",
    stroke: "#607587",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
  },
  error: {
    label: "Tieto ei saatavilla",
    fill: "#b7c4d0",
    stroke: "#607587",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
  },
  invalid: {
    label: "Valitse aika",
    fill: "#b7c4d0",
    stroke: "#607587",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
  },
};

const dateTime = new Intl.DateTimeFormat("fi-FI", {
  dateStyle: "short",
  timeStyle: "short",
});
const showDate = (value: string) => dateTime.format(new Date(value));
const showTime = new Intl.DateTimeFormat("fi-FI", { timeStyle: "short" });

function showInterval(times: Times) {
  return times.start.slice(0, 10) === times.end.slice(0, 10)
    ? `${showDate(times.start)}–${showTime.format(new Date(times.end))}`
    : `${showDate(times.start)} – ${showDate(times.end)}`;
}

function localInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function defaultTimes() {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: localInput(start), end: localInput(end) };
}

function selectedInterval(times: Times) {
  const start = new Date(times.start);
  const end = new Date(times.end);
  return Number.isFinite(start.getTime()) &&
    Number.isFinite(end.getTime()) &&
    start < end
    ? { start, end }
    : null;
}

function RoomBookingDetails({
  room,
  status,
  times,
  feedback,
  loggedIn,
  returnTo,
  onReserve,
  onEditTime,
}: {
  room: Space;
  status: DisplayStatus;
  times: Times;
  feedback: BookingFeedback | null;
  loggedIn: boolean;
  returnTo: string;
  onReserve: (room: Space) => void;
  onEditTime: () => void;
}) {
  const bookedHere =
    feedback?.roomId === room._id && feedback.kind === "success";
  const currentFeedback = feedback?.roomId === room._id ? feedback : null;
  const details = statusDetails[bookedHere ? "reserved" : status];
  return (
    <div className="space-y-3">
      <p
        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${details.badge}`}
      >
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 rounded-full ${details.dot}`}
        />
        {bookedHere ? "Varattu sinulle" : details.label}
      </p>
      {selectedInterval(times) && (
        <dl className="bg-muted/60 space-y-2 rounded-lg p-3 text-xs">
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">Alkaa</dt>
            <dd className="tabular-nums">{showDate(times.start)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">Päättyy</dt>
            <dd className="tabular-nums">{showDate(times.end)}</dd>
          </div>
        </dl>
      )}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {bookedHere
          ? "Löydät varauksen omista varauksista."
          : status === "reserved"
            ? "Tila on varattu valittuna aikana."
            : status === "unavailable"
              ? "Tälle ajalle ei ole varausmahdollisuutta."
              : status === "error"
                ? "Aikataulun tarkistus epäonnistui."
                : status === "invalid"
                  ? "Valitse kelvollinen aloitus- ja lopetusaika."
                  : status === "loading"
                    ? "Tarkistetaan varauksia..."
                    : "Tila on varattavissa valittuna aikana."}
      </p>
      {currentFeedback?.kind === "error" && (
        <p role="alert" className="text-destructive text-sm">
          {currentFeedback.message}
        </p>
      )}
      {bookedHere && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          Varaus vahvistettu.
        </p>
      )}
      {status === "available" && !bookedHere ? (
        !loggedIn || currentFeedback?.kind === "login" ? (
          <Button asChild className="w-full">
            <Link
              to="/login"
              state={{
                from: returnTo,
                times,
                roomId: room._id,
                buildingId: room.building,
                floor: room.floor,
              }}
            >
              Kirjaudu sisään varaamaan
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={currentFeedback?.kind === "saving"}
            onClick={() => onReserve(room)}
          >
            {currentFeedback?.kind === "saving"
              ? "Varataan..."
              : "Varaa tämä aika"}
          </Button>
        )
      ) : !bookedHere && status !== "loading" && status !== "error" ? (
        <Button variant="outline" className="w-full" onClick={onEditTime}>
          Muuta aikaa
        </Button>
      ) : null}
    </div>
  );
}

function FloorMap({
  building,
  floor,
  floors,
  title,
  address,
  controls,
  settingsOpen,
  onSettingsChange,
  rooms,
  query,
  onQueryChange,
  selectedRoomId,
  times,
  statusError,
  roomStatus,
  inspectedRoom,
  feedback,
  loggedIn,
  returnTo,
  sectionRef,
  onFloorSelect,
  onInspect,
  onClose,
  onReserve,
  onEditTime,
}: {
  building: BuildingDetails;
  floor: number | null;
  floors: number[];
  title: string;
  address: string;
  controls: ReactNode;
  settingsOpen: boolean;
  onSettingsChange: (open: boolean) => void;
  rooms: Space[];
  query: string;
  onQueryChange: (query: string) => void;
  selectedRoomId: string | null;
  times: Times;
  statusError: string;
  roomStatus: (room: Space) => DisplayStatus;
  inspectedRoom: Space | null;
  feedback: BookingFeedback | null;
  loggedIn: boolean;
  returnTo: string;
  sectionRef: Ref<HTMLElement>;
  onFloorSelect: (floor: number) => void;
  onInspect: (room: Space) => void;
  onClose: () => void;
  onReserve: (room: Space) => void;
  onEditTime: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [desktopRoomsVisible, setDesktopRoomsVisible] = useState(true);
  const [mobileRoomsExpanded, setMobileRoomsExpanded] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [imageRatio, setImageRatio] = useState(0);
  const [dragging, setDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const revealRoomsRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<SVGPolygonElement | null>(null);
  const interactedOutsideRef = useRef(false);
  const suppressClickRef = useRef(false);
  const panRef = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const image = building.blueprint.find((item) => item.floor === floor)?.image;
  const mapped = building.space.filter(
    (room) =>
      room.floor === floor && room.mapPolygon && room.mapPolygon.length >= 3,
  );
  const inspectedStatus = inspectedRoom ? roomStatus(inspectedRoom) : null;
  const polygon = inspectedRoom?.mapPolygon ?? [];
  const popupX = polygon.length
    ? (Math.min(...polygon.map((point) => point.x)) +
        Math.max(...polygon.map((point) => point.x))) /
      2
    : 50;
  const popupY = polygon.length
    ? (Math.min(...polygon.map((point) => point.y)) +
        Math.max(...polygon.map((point) => point.y))) /
      2
    : 50;
  const fitWidth =
    imageRatio && viewportSize.width
      ? Math.min(viewportSize.width, viewportSize.height * imageRatio)
      : viewportSize.width;
  const canvasWidth = fitWidth * zoom;
  const canvasHeight = imageRatio ? canvasWidth / imageRatio : 0;
  const sidebarOpen = floor !== null && desktopRoomsVisible;
  const controlsVisible = floor === null || settingsOpen;

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setViewportSize({
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    });
    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inspectedRoom) return;
    const element = viewportRef.current?.querySelector<SVGPolygonElement>(
      `[data-room-id="${inspectedRoom._id}"]`,
    );
    openerRef.current = element ?? null;
    element?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [inspectedRoom]);

  function inspect(room: Space) {
    setMobileRoomsExpanded(false);
    onSettingsChange(false);
    onInspect(room);
  }

  function keyboardOpen(event: KeyboardEvent<SVGPolygonElement>, room: Space) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inspect(room);
    }
  }

  function changeZoom(next: number) {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;
    const x =
      (viewport.scrollLeft + viewport.clientWidth / 2 - canvas.offsetLeft) /
      canvas.clientWidth;
    const y =
      (viewport.scrollTop + viewport.clientHeight / 2 - canvas.offsetTop) /
      canvas.clientHeight;
    setZoom(next);
    requestAnimationFrame(() => {
      viewport.scrollTo({
        left:
          next === 1
            ? 0
            : canvas.offsetLeft +
              x * canvas.clientWidth -
              viewport.clientWidth / 2,
        top:
          next === 1
            ? 0
            : canvas.offsetTop +
              y * canvas.clientHeight -
              viewport.clientHeight / 2,
      });
    });
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if (zoom === 1 || !event.isPrimary || event.button !== 0) return;
    const viewport = event.currentTarget;
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
      moved: false,
    };
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || !event.isPrimary) return;
    const dx = event.clientX - pan.x;
    const dy = event.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) < 5) return;
    if (!pan.moved) {
      pan.moved = true;
      suppressClickRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    event.preventDefault();
    event.currentTarget.scrollLeft = pan.left - dx;
    event.currentTarget.scrollTop = pan.top - dy;
  }

  function endPan(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    panRef.current = null;
    setDragging(false);
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }

  return (
    <Popover
      open={Boolean(inspectedRoom)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <section
        ref={sectionRef}
        aria-label="Varauskartta"
        className="reservation-map-surface relative isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        {floor !== null && (
          <ReservationRoomPanel
            title={title}
            address={address}
            rooms={rooms}
            query={query}
            selectedRoomId={selectedRoomId}
            desktopVisible={desktopRoomsVisible}
            mobileExpanded={mobileRoomsExpanded}
            roomDetails={(room) => statusDetails[roomStatus(room)]}
            onQueryChange={onQueryChange}
            onSelect={inspect}
            onHideDesktop={() => {
              setDesktopRoomsVisible(false);
              requestAnimationFrame(() =>
                revealRoomsRef.current?.focus({ preventScroll: true }),
              );
            }}
            onToggleMobile={() => setMobileRoomsExpanded((open) => !open)}
          />
        )}
        <div
          className={`map-floating-panel @container/map relative z-20 mt-3 max-h-[calc(100%-7rem)] shrink-0 overflow-y-auto overscroll-contain rounded-2xl lg:mt-4 lg:max-h-[calc(100%-6rem)] ${floor === null ? "mx-auto w-[calc(100%-1.5rem)] max-w-3xl lg:w-[calc(100%-2rem)]" : `mx-3 lg:mx-4 ${sidebarOpen ? "lg:ml-88" : ""}`}`}
        >
          <div className="flex min-w-0 items-center gap-3 p-3 sm:px-4">
            <Button asChild variant="ghost" size="icon" className="shrink-0">
              <Link to="/" aria-label="Takaisin rakennusten kartalle">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            {floor !== null && !desktopRoomsVisible && (
              <Button
                ref={revealRoomsRef}
                variant="ghost"
                size="icon"
                aria-label="Näytä tilalista"
                onClick={() => {
                  setDesktopRoomsVisible(true);
                  requestAnimationFrame(() =>
                    document
                      .getElementById("room-search")
                      ?.focus({ preventScroll: true }),
                  );
                }}
                className="hidden shrink-0 lg:inline-flex"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h1
                className={`truncate text-sm font-semibold ${sidebarOpen ? "lg:hidden" : ""}`}
              >
                {title}
              </h1>
              <h2
                className={`${sidebarOpen ? "text-muted-foreground lg:text-foreground text-xs lg:text-sm lg:font-semibold" : "text-muted-foreground text-xs"} truncate`}
              >
                {building.name}
                {floor !== null && ` · ${floor}. kerros`}
              </h2>
              {floor !== null && (
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed tabular-nums">
                  {selectedInterval(times)
                    ? showInterval(times)
                    : "Valitse varausaika"}
                </p>
              )}
              {floor !== null && statusError && !settingsOpen && (
                <p role="alert" className="text-destructive mt-1 text-xs">
                  {statusError}
                </p>
              )}
            </div>
            {floor !== null && (
              <Button
                variant="ghost"
                size="sm"
                data-map-settings-toggle
                aria-expanded={settingsOpen}
                aria-controls="map-settings"
                onClick={() => onSettingsChange(!settingsOpen)}
                className="h-auto min-h-10 shrink-0 gap-2 px-2 sm:px-3"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Varausaika</span>
                <span className="sr-only sm:hidden">Varausaika</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 ${settingsOpen ? "rotate-180" : ""}`}
                />
              </Button>
            )}
          </div>
          {floor !== null && (
            <FloorTabs floors={floors} floor={floor} onSelect={onFloorSelect} />
          )}
          <div
            id="map-settings"
            className={`${controlsVisible ? "block" : "hidden"} border-t p-4`}
          >
            {controls}
          </div>
        </div>
        {floor === null ? (
          <p className="text-muted-foreground p-6 text-sm">
            Rakennukselle ei ole lisätty kerroksia.
          </p>
        ) : (
          <div
            id="floor-map-panel"
            role="tabpanel"
            aria-labelledby={`floor-tab-${floor}`}
            className="relative min-h-0 flex-1"
          >
            <div
              ref={viewportRef}
              aria-label="Pohjakartan vieritysalue"
              className={`map-viewport absolute top-4 right-4 bottom-36 left-4 flex overflow-auto overscroll-contain lg:right-6 lg:bottom-20 ${sidebarOpen ? "lg:left-92" : "lg:left-6"} ${canvasHeight <= viewportSize.height ? "items-center" : "items-start"} ${zoom > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
              style={{
                touchAction: zoom > 1 ? "none" : "auto",
              }}
              onPointerDown={startPan}
              onPointerMove={movePan}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              onClickCapture={(event) => {
                if (suppressClickRef.current) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
            >
              {image ? (
                <div
                  ref={canvasRef}
                  className={`relative shrink-0 ${canvasWidth <= viewportSize.width ? "mx-auto" : ""}`}
                  style={{ width: fitWidth ? `${canvasWidth}px` : "100%" }}
                >
                  <img
                    src={image}
                    alt={`${building.name}, ${floor}. kerroksen pohjapiirros`}
                    onLoad={(event) =>
                      setImageRatio(
                        event.currentTarget.naturalWidth /
                          event.currentTarget.naturalHeight,
                      )
                    }
                    className="block h-auto w-full mix-blend-multiply select-none"
                    draggable={false}
                  />
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-label="Kartalta valittavat tilat"
                  >
                    {mapped.map((room) => {
                      const details = statusDetails[roomStatus(room)];
                      const active = inspectedRoom?._id === room._id;
                      return (
                        <polygon
                          key={room._id}
                          points={room
                            .mapPolygon!.map((point) => `${point.x},${point.y}`)
                            .join(" ")}
                          role="button"
                          tabIndex={0}
                          aria-pressed={active}
                          data-room-id={room._id}
                          aria-label={`${room.name}: ${details.label.toLocaleLowerCase()}. Näytä tilan tiedot`}
                          onClick={() => inspect(room)}
                          onKeyDown={(event) => keyboardOpen(event, room)}
                          className="cursor-pointer hover:opacity-80 focus:opacity-80 focus:outline-none"
                          vectorEffect="non-scaling-stroke"
                          style={{
                            fill: details.fill,
                            stroke: details.stroke,
                            fillOpacity: active ? 0.72 : 0.45,
                            strokeWidth: active ? 3 : 1.5,
                          }}
                        >
                          <title>
                            {room.name}: {details.label}
                          </title>
                        </polygon>
                      );
                    })}
                  </svg>
                  {mapped.map((room) => {
                    const points = room.mapPolygon!;
                    const minX = Math.min(...points.map((point) => point.x));
                    const maxX = Math.max(...points.map((point) => point.x));
                    const minY = Math.min(...points.map((point) => point.y));
                    const maxY = Math.max(...points.map((point) => point.y));
                    const labelWidth = ((maxX - minX) * canvasWidth) / 100;
                    return labelWidth >=
                      Math.max(90, room.name.length * 6 + 16) ? (
                      <span
                        key={room._id}
                        aria-hidden="true"
                        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 truncate rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-800 shadow-sm"
                        style={{
                          left: `${(minX + maxX) / 2}%`,
                          top: `${(minY + maxY) / 2}%`,
                          maxWidth: labelWidth - 8,
                        }}
                      >
                        {room.name}
                      </span>
                    ) : null;
                  })}
                  {inspectedRoom && (
                    <PopoverAnchor asChild>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute h-px w-px"
                        style={{ left: `${popupX}%`, top: `${popupY}%` }}
                      />
                    </PopoverAnchor>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground m-auto p-4 text-center text-sm">
                  Tälle kerrokselle ei ole pohjapiirrosta. Valitse tila
                  listasta.
                </p>
              )}
            </div>
            <div
              className={`map-floating-panel absolute bottom-24 left-3 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-[11px] lg:bottom-4 ${sidebarOpen ? "lg:left-88" : "lg:left-4"}`}
              aria-label="Kartan varaustilanteen selite"
            >
              {(["available", "reserved", "unavailable"] as const).map(
                (status) => (
                  <span key={status} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full ${statusDetails[status].dot}`}
                    />
                    {statusDetails[status].label}
                  </span>
                ),
              )}
            </div>
            <div className="map-floating-panel absolute right-3 bottom-36 z-10 flex flex-col divide-y overflow-hidden rounded-xl lg:right-4 lg:bottom-4">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Suurenna karttaa"
                disabled={zoom >= 3}
                onClick={() => changeZoom(Math.min(3, zoom + 0.5))}
                className="h-11 w-11 rounded-none"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Pienennä karttaa"
                disabled={zoom <= 1}
                onClick={() => changeZoom(Math.max(1, zoom - 0.5))}
                className="h-11 w-11 rounded-none"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sovita kartta"
                disabled={zoom === 1}
                onClick={() => changeZoom(1)}
                className="h-11 w-11 rounded-none"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
      {inspectedRoom && inspectedStatus && (
        <PopoverContent
          side="top"
          sideOffset={12}
          collisionPadding={16}
          sticky="always"
          aria-label={`${inspectedRoom.name}, tilan tiedot`}
          className="max-h-[var(--radix-popover-content-available-height)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-xl p-5 shadow-xl data-[state=closed]:animate-none data-[state=open]:animate-none"
          onOpenAutoFocus={() => {
            interactedOutsideRef.current = false;
          }}
          onInteractOutside={(event) => {
            const target = event.detail.originalEvent.target;
            if (
              target instanceof Element &&
              target.closest("[data-room-id], [data-room-select]")
            )
              event.preventDefault();
            else interactedOutsideRef.current = true;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!interactedOutsideRef.current)
              openerRef.current?.focus({ preventScroll: true });
          }}
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-semibold break-words">
                {inspectedRoom.name}
              </h3>
              {inspectedRoom.area > 0 && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {inspectedRoom.area} m²
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sulje tilan tiedot"
              className="-mt-2 -mr-2 h-9 w-9 shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <RoomBookingDetails
            room={inspectedRoom}
            status={inspectedStatus}
            times={times}
            feedback={feedback}
            loggedIn={loggedIn}
            returnTo={returnTo}
            onReserve={onReserve}
            onEditTime={() => {
              interactedOutsideRef.current = true;
              onEditTime();
            }}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}

export function Premise() {
  const { id } = useParams();
  const location = useLocation();
  const routeState = location.state as {
    times?: Times;
    roomId?: string;
    buildingId?: string;
    floor?: number;
  } | null;
  const { getPremiseById } = usePremiseAction();
  const { premiseData, isLoading, alertText } = useTypedSelector(
    (state) => state.premise,
  );
  const [buildingId, setBuildingId] = useState(routeState?.buildingId ?? "");
  const [floor, setFloor] = useState<number | null>(routeState?.floor ?? null);
  const [query, setQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    routeState?.roomId ?? null,
  );
  const [bookingFeedback, setBookingFeedback] =
    useState<BookingFeedback | null>(null);
  const [times, setTimesValue] = useState<Times>(() => {
    const restored = routeState?.times;
    return restored &&
      typeof restored.start === "string" &&
      typeof restored.end === "string" &&
      selectedInterval(restored)
      ? restored
      : defaultTimes();
  });
  const [statusRevision, setStatusRevision] = useState(0);
  const [statusResponse, setStatusResponse] = useState<{
    key: string;
    schedules: Availability[];
    error: string;
  }>({
    key: "",
    schedules: [],
    error: "",
  });
  const mapRef = useRef<HTMLElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const building =
    premiseData.buildings.find((item) => item._id === buildingId) ??
    premiseData.buildings[0];
  const selectedRoom =
    premiseData.buildings
      .flatMap((item) => item.space)
      .find((room) => room._id === selectedRoomId) ?? null;
  const floors = Array.from(
    { length: building?.floors ?? 0 },
    (_, index) => index + 1,
  );
  const activeFloor =
    floor !== null && floors.includes(floor) ? floor : (floors[0] ?? null);
  const rooms =
    building?.space.filter(
      (room) =>
        room.floor === activeFloor &&
        room.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    ) ?? [];
  const interval = selectedInterval(times);
  const statusKey = `${id}:${times.start}:${times.end}:${statusRevision}`;
  const statusError =
    statusResponse.key === statusKey ? statusResponse.error : "";
  const loggedIn = Boolean(new Cookies().get("tilatikkiToken"));
  const selectedOnMap =
    selectedRoom &&
    selectedRoom.mapPolygon &&
    selectedRoom.mapPolygon.length >= 3 &&
    selectedRoom.building === building?._id &&
    selectedRoom.floor === activeFloor &&
    building?.blueprint.some((item) => item.floor === selectedRoom.floor);

  const setTimes: Dispatch<SetStateAction<Times>> = (next) => {
    setTimesValue(next);
    setStatusRevision((previous) => previous + 1);
    setBookingFeedback(null);
  };

  function changeStart(value: string) {
    setTimes((previous) => {
      const nextStart = new Date(value);
      const end = new Date(previous.end);
      const oldStart = new Date(previous.start);
      if (!Number.isFinite(nextStart.getTime())) {
        return { ...previous, start: value };
      }
      const previousDuration = end.getTime() - oldStart.getTime();
      const duration =
        Number.isFinite(previousDuration) && previousDuration > 0
          ? previousDuration
          : 60 * 60 * 1000;
      return {
        start: value,
        end: localInput(new Date(nextStart.getTime() + duration)),
      };
    });
  }

  function inspectRoom(room: Space) {
    setSelectedRoomId(room._id);
    setBookingFeedback(null);
  }

  function changeFloor(nextFloor: number | null) {
    setFloor(nextFloor);
    setQuery("");
    setSelectedRoomId(null);
    setBookingFeedback(null);
    setSettingsOpen(false);
    requestAnimationFrame(() => {
      mapRef.current
        ?.querySelector<HTMLElement>(`[data-floor-tab="${nextFloor ?? 1}"]`)
        ?.focus({ preventScroll: true });
    });
  }

  function editTime() {
    setSelectedRoomId(null);
    setSettingsOpen(true);
    requestAnimationFrame(() =>
      timeRef.current?.focus({ preventScroll: true }),
    );
  }

  useEffect(() => {
    if (id) getPremiseById(id);
  }, [getPremiseById, id]);

  useEffect(() => {
    const refresh = () => {
      setStatusRevision((previous) => previous + 1);
      setBookingFeedback(null);
    };
    window.addEventListener(reservationsChangedEvent, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(reservationsChangedEvent, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    const selected = selectedInterval(times);
    if (!id || !selected) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/availability/premise/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startdate: selected.start.toISOString(),
          enddate: selected.end.toISOString(),
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Varaustilannetta ei voitu hakea.");
          setStatusResponse({ key: statusKey, schedules: data, error: "" });
        })
        .catch((reason: Error) => {
          if (reason.name !== "AbortError") {
            setStatusResponse({
              key: statusKey,
              schedules: [],
              error: reason.message,
            });
          }
        });
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [id, times, statusRevision, statusKey]);

  function roomStatus(room: Space): DisplayStatus {
    if (!interval) return "invalid";
    if (statusResponse.key !== statusKey) return "loading";
    if (statusError) return "error";
    return getRoomStatus(
      room._id,
      statusResponse.schedules,
      interval.start,
      interval.end,
    );
  }

  async function reserveRoom(room: Space) {
    const selected = selectedInterval(times);
    const available =
      selected &&
      statusResponse.key === statusKey &&
      roomStatus(room) === "available"
        ? statusResponse.schedules.find(
            (item) =>
              item.space === room._id &&
              new Date(item.startdate) <= selected.start &&
              selected.end <= new Date(item.enddate),
          )
        : null;
    if (!selected || !available) {
      setBookingFeedback({
        roomId: room._id,
        kind: "error",
        message: "Tarkista aika ja tilan varaustilanne uudelleen.",
      });
      return;
    }
    const token = new Cookies().get("tilatikkiToken");
    if (!token) {
      setBookingFeedback({ roomId: room._id, kind: "login" });
      return;
    }
    setBookingFeedback({ roomId: room._id, kind: "saving" });
    try {
      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startdate: selected.start.toISOString(),
          enddate: selected.end.toISOString(),
          availabilityId: available._id,
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setBookingFeedback({ roomId: room._id, kind: "login" });
        return;
      }
      if (!response.ok) {
        if (response.status === 409)
          setStatusRevision((previous) => previous + 1);
        throw new Error(
          response.status === 409
            ? "Tila ehdittiin varata. Valitse toinen aika."
            : data.error || "Varaus epäonnistui.",
        );
      }
      setBookingFeedback({ roomId: room._id, kind: "success" });
      setStatusRevision((previous) => previous + 1);
    } catch (reason) {
      setBookingFeedback({
        roomId: room._id,
        kind: "error",
        message:
          reason instanceof Error ? reason.message : "Varaus epäonnistui.",
      });
    }
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col">
      {alertText && !isLoading && (
        <p role="alert" className="text-destructive shrink-0 px-4 py-2 text-sm">
          {alertText}
        </p>
      )}
      {isLoading && <p className="p-6">Tilat ladataan...</p>}
      {building && (
        <FloorMap
          key={`${building._id}-${activeFloor}`}
          building={building}
          floor={activeFloor}
          floors={floors}
          title={premiseData.name || "Tilat"}
          address={premiseData.address}
          rooms={rooms}
          query={query}
          onQueryChange={setQuery}
          selectedRoomId={selectedRoomId}
          settingsOpen={settingsOpen}
          onSettingsChange={setSettingsOpen}
          controls={
            <ReservationMapControls
              buildings={premiseData.buildings}
              buildingId={building._id}
              floor={activeFloor}
              times={times}
              timeRef={timeRef}
              intervalValid={Boolean(interval)}
              statusError={statusError}
              onBuildingChange={(nextBuilding) => {
                setBuildingId(nextBuilding);
                changeFloor(null);
              }}
              onStartChange={changeStart}
              onEndChange={(value) =>
                setTimes((previous) => ({ ...previous, end: value }))
              }
            />
          }
          times={times}
          statusError={statusError}
          roomStatus={roomStatus}
          inspectedRoom={selectedOnMap ? selectedRoom : null}
          feedback={bookingFeedback}
          loggedIn={loggedIn}
          returnTo={location.pathname}
          sectionRef={mapRef}
          onFloorSelect={changeFloor}
          onInspect={inspectRoom}
          onClose={() => setSelectedRoomId(null)}
          onReserve={(room) => void reserveRoom(room)}
          onEditTime={() => editTime()}
        />
      )}
      {selectedRoom &&
        selectedRoom.building === building?._id &&
        selectedRoom.floor === activeFloor &&
        !selectedOnMap && (
          <Dialog
            open
            onOpenChange={(open) => {
              if (!open) setSelectedRoomId(null);
            }}
          >
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>{selectedRoom.name}</DialogTitle>
              </DialogHeader>
              <RoomBookingDetails
                room={selectedRoom}
                status={roomStatus(selectedRoom)}
                times={times}
                feedback={bookingFeedback}
                loggedIn={loggedIn}
                returnTo={location.pathname}
                onReserve={(room) => void reserveRoom(room)}
                onEditTime={editTime}
              />
            </DialogContent>
          </Dialog>
        )}
    </main>
  );
}
