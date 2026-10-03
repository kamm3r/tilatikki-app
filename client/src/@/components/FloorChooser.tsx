import { ArrowRight, Layers } from "lucide-react";
import { type BuildingDetails } from "~/Redux/Reducers/premiseState";

export function FloorChooser({
  building,
  floors,
  onChoose,
}: {
  building: BuildingDetails;
  floors: number[];
  onChoose: (floor: number) => void;
}) {
  return (
    <div
      className="map-floating-panel mx-auto w-full max-w-3xl rounded-2xl p-5 sm:p-6"
      aria-label="Kerroksen valinta"
    >
      <div className="mx-auto max-w-3xl">
        <h3 className="text-lg font-semibold tracking-tight">Valitse kerros</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Avaa kerroksen pohjakartta ja valitse varattava tila.
        </p>
        <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
          {floors.map((floor) => {
            const image = building.blueprint.find(
              (item) => item.floor === floor,
            )?.image;
            const roomCount = building.space.filter(
              (room) => room.floor === floor,
            ).length;
            return (
              <button
                key={floor}
                type="button"
                aria-label={`Avaa ${floor}. kerroksen kartta`}
                onClick={() => onChoose(floor)}
                className="bg-background hover:border-primary/50 focus-visible:outline-primary min-w-0 overflow-hidden rounded-xl border text-left shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <div className="bg-muted/30 flex aspect-[16/7] items-center justify-center border-b p-4">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <Layers
                      aria-hidden="true"
                      className="text-muted-foreground h-10 w-10 stroke-1"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {floor}. kerros
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {roomCount} {roomCount === 1 ? "tila" : "tilaa"}
                    </span>
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="text-muted-foreground h-4 w-4 shrink-0"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
