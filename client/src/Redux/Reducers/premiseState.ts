interface ApiResponse<T> {
  success: boolean;
  premises: T;
}

// interface Floor {
//   floor: number;
//   blueprint_url?: string;
// }

interface Blueprint {
  floor: number;
  image: string;
  _id: string;
}

interface Outline {
  floor: number;
  image: string;
  _id: string;
}

export interface Space {
  _id: string;
  name: string;
  area: number;
  premise: string;
  building: string;
  floor: number;
  availabilities: string[];
  reservations: string[];
  mapPolygon?: { x: number; y: number }[];
}

export interface Reservation {
  _id: string;
  creator: string;
  startdate: Date;
  enddate: Date;
  premise: string;
  space: string;
  availability: string;
}

export interface BuildingDetails {
  location?: { latitude: number; longitude: number };
  _id: string;
  name: string;
  floors: number;
  rooms: number;
  blueprint: Blueprint[];
  facade: string[];
  outlines: Outline[];
  space: Space[];
}

export interface Premise {
  location?: { latitude: number; longitude: number };
  _id: string;
  name: string;
  address: string;
  users: string[];
  premise_facade: string[];
  buildings: BuildingDetails[];
}

export interface PremiseStateProps {
  premisesData: ApiResponse<Premise[]>;
  premiseData: Premise;
  currentPremise: Premise | null;
  isLoading: boolean;
  alertType: string | null;
  alertText: string | null;
  currentBuilding: BuildingDetails | null;
}

export const initialPremiseState: PremiseStateProps = {
  premisesData: {
    success: false,
    premises: [],
  },
  premiseData: {
    _id: "",
    name: "",
    address: "",
    users: [],
    premise_facade: [],
    buildings: [],
  },
  currentPremise: null,
  isLoading: false,
  alertType: null,
  alertText: null,
  currentBuilding: null,
};
