export type Top3Item = { council: string; population: number; rank: number };
export type SuburbRow = { suburb: string; postcode?: string | null };

export type SuburbSummary = {
  suburb: string;
  medianHousing: number | null;
  rent_allprop?: number | null;
  buy_flat?: number | null;
  buy_house?: number | null;
};

export type SchoolRow = {
  school_name: string;
  school_type?: string | null;
  education_sector?: string | null;
  lat?: number | null;
  lon?: number | null;
  address_postcode?: number | null;
};
