import { type Ref } from "react";
import { Input } from "~/@/components/ui/input";
import { Label } from "~/@/components/ui/label";
import { type BuildingDetails } from "~/Redux/Reducers/premiseState";

export function ReservationMapControls({
  buildings,
  buildingId,
  floor,
  floors,
  times,
  timeRef,
  intervalValid,
  statusError,
  onBuildingChange,
  onFloorChange,
  onStartChange,
  onEndChange,
}: {
  buildings: BuildingDetails[];
  buildingId: string;
  floor: number | null;
  floors: number[];
  times: { start: string; end: string };
  timeRef: Ref<HTMLInputElement>;
  intervalValid: boolean;
  statusError: string;
  onBuildingChange: (buildingId: string) => void;
  onFloorChange: (floor: number | null) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  return (
    <div aria-label="Kartalla näytettävä varaustilanne">
      <div
        className={`grid min-w-0 grid-cols-2 gap-3 ${
          floor === null
            ? "max-w-xl"
            : "@min-[60rem]/map:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.25fr)_minmax(0,1.25fr)]"
        }`}
      >
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="building">Rakennus</Label>
          <select
            id="building"
            value={buildingId}
            onChange={(event) => onBuildingChange(event.target.value)}
            className="border-input bg-background h-10 w-full min-w-0 rounded-md border px-3 py-2 text-base md:text-sm"
          >
            {buildings.map((building) => (
              <option key={building._id} value={building._id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="floor">Kerros</Label>
          {floors.length > 1 ? (
            <select
              id="floor"
              value={floor ?? ""}
              onChange={(event) =>
                onFloorChange(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              className="border-input bg-background h-10 w-full min-w-0 rounded-md border px-3 py-2 text-base md:text-sm"
            >
              <option value="">Valitse kerros</option>
              {floors.map((item) => (
                <option key={item} value={item}>
                  {item}. kerros
                </option>
              ))}
            </select>
          ) : (
            <div
              id="floor"
              className="bg-muted/40 flex h-10 items-center rounded-md border px-3 text-sm"
            >
              {floor}. kerros
            </div>
          )}
        </div>
        {floor !== null && (
          <>
            <div className="col-span-2 min-w-0 space-y-1.5 @min-[36rem]/map:col-span-1">
              <Label htmlFor="map-start">Alkaa</Label>
              <Input
                ref={timeRef}
                id="map-start"
                type="datetime-local"
                value={times.start}
                onChange={(event) => onStartChange(event.target.value)}
              />
            </div>
            <div className="col-span-2 min-w-0 space-y-1.5 @min-[36rem]/map:col-span-1">
              <Label htmlFor="map-end">Päättyy</Label>
              <Input
                id="map-end"
                type="datetime-local"
                value={times.end}
                onChange={(event) => onEndChange(event.target.value)}
              />
            </div>
          </>
        )}
      </div>
      {floor !== null && !intervalValid && (
        <p role="alert" className="text-destructive mt-3 text-sm">
          Valitse kelvollinen aloitus- ja lopetusaika.
        </p>
      )}
      {floor !== null && statusError && (
        <p role="alert" className="text-destructive mt-3 text-sm">
          {statusError}
        </p>
      )}
    </div>
  );
}
