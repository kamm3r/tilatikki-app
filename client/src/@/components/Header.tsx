import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "~/@/components/ui/avatar";

import { Button } from "~/@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/@/components/ui/dropdown-menu";
import React, { useState } from "react";
import Cookies from "universal-cookie";
import { useUserAction } from "~/hooks/useUser";
import { useTypedSelector } from "~/hooks/useTypedSelector";
import { ArchiveIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { reservationsChangedEvent } from "~/utils/reservationEvents";
type Booking = { _id: string; space: string; startdate: string; enddate: string };

function HistoryList() {
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [spaceNames, setSpaceNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = () => new Cookies().get("tilatikkiToken");

  async function loadBookings() {
    if (!token()) {
      setError("Kirjaudu sisään nähdäksesi varaukset.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [bookingsResponse, spacesResponse] = await Promise.all([
        fetch("/api/reservation", { headers: { Authorization: `Bearer ${token()}` } }),
        fetch("/api/space"),
      ]);
      if (!bookingsResponse.ok || !spacesResponse.ok) throw new Error("Varauksia ei voitu hakea.");
      const rows: Booking[] = await bookingsResponse.json();
      const spaces: { data: { _id: string; name: string }[] } = await spacesResponse.json();
      setBookings(rows);
      setSpaceNames(Object.fromEntries(spaces.data.map((space) => [space._id, space.name])));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Varauksia ei voitu hakea.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(id: string) {
    const response = await fetch(`/api/reservation/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
    });
    if (response.ok) {
      setBookings((previous) => previous.filter((booking) => booking._id !== id));
      window.dispatchEvent(new Event(reservationsChangedEvent));
    }
    else setError("Varausta ei voitu perua.");
  }

  return (
    <Popover open={open} onOpenChange={(value) => { setOpen(value); if (value) void loadBookings(); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Omat varaukset"
        >
          <ArchiveIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={16}
        className="max-h-[var(--radix-popover-content-available-height)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl">
        <div className="space-y-3">
          <p className="font-medium">Omat varaukset</p>
          {loading && <p className="text-sm">Ladataan...</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {!loading && !error && bookings.length === 0 && <p className="text-sm text-muted-foreground">Ei varauksia.</p>}
          <ul className="max-h-80 space-y-3 overflow-y-auto overscroll-contain">
            {bookings.map((booking) => (
              <li key={booking._id} className="rounded-md border p-3 text-sm">
                <p className="break-words font-medium">{spaceNames[booking.space] || "Tila"}</p>
                <p>{new Intl.DateTimeFormat("fi-FI", { dateStyle: "short", timeStyle: "short" }).format(new Date(booking.startdate))}</p>
                <p>{new Intl.DateTimeFormat("fi-FI", { dateStyle: "short", timeStyle: "short" }).format(new Date(booking.enddate))}</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => void cancelBooking(booking._id)}>Peru varaus</Button>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Profile({ children }: { children?: React.ReactNode }) {
  const { logoutUser } = useUserAction();
  const { firstname, lastname, email } = useTypedSelector(
    (state) => state.user.currentUser,
  );
  const initials = `${firstname?.[0] ?? ""}${lastname?.[0] ?? ""}`.toLocaleUpperCase() || "TT";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0" aria-label="Oma profiili">
          <Avatar className="h-9 w-9 border">
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          {children}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-w-[calc(100vw-2rem)]" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {firstname} {lastname}
            </p>
            <p className="break-all text-xs leading-snug text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link to="/settings">Hallinointi</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link to="/login" onClick={() => logoutUser()}>
            Kirjaudu ulos
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const loggedIn = Boolean(new Cookies().get("tilatikkiToken"));
  return (
    <header className="shrink-0 border-b bg-background">
      <div className="mx-auto flex h-18 w-full min-w-0 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link className='shrink-0 font-["Archivo"] text-2xl font-black tracking-tight sm:text-3xl' to="/">
          TilaTikki
        </Link>
        <nav className="flex shrink-0 items-center gap-2" aria-label="Oma tili">
          {loggedIn ? <><HistoryList /><Profile /></> : (
            <Button asChild variant="outline" size="sm">
              <Link to="/login" state={{ from: pathname }}>Kirjaudu sisään</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
