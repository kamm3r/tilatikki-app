export function FloorTabs({
  floors,
  floor,
  onSelect,
}: {
  floors: number[];
  floor: number;
  onSelect: (floor: number) => void;
}) {
  return (
    <div className="overflow-x-auto border-t px-3 py-2">
      <div
        role="tablist"
        aria-label="Valitse kerros"
        className="flex w-max min-w-full gap-1"
      >
        {floors.map((item, index) => (
          <button
            key={item}
            id={`floor-tab-${item}`}
            type="button"
            role="tab"
            data-floor-tab={item}
            aria-selected={item === floor}
            aria-controls="floor-map-panel"
            tabIndex={item === floor ? 0 : -1}
            onClick={() => {
              if (item !== floor) onSelect(item);
            }}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight")
                next = (index + 1) % floors.length;
              else if (event.key === "ArrowLeft")
                next = (index - 1 + floors.length) % floors.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = floors.length - 1;
              else return;
              event.preventDefault();
              if (floors[next] !== floor) onSelect(floors[next]);
            }}
            className={`h-10 shrink-0 rounded-lg px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700 ${item === floor ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700/20 ring-inset" : "text-muted-foreground hover:bg-muted"}`}
          >
            {item}. kerros
          </button>
        ))}
      </div>
    </div>
  );
}
