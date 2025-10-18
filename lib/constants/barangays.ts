// Official Barangay List for Pili, Camarines Sur
export const PILI_BARANGAYS = [
  'Anayan',
  'Bagong Sirang',
  'Binanwaanan',
  'Binobong',
  'Cadlan',
  'Caroyroyan',
  'Curry',
  'Del Rosario',
  'Himaao',
  'La Purisima',
  'New San Roque',
  'Old San Roque',
  'Palestina',
  'Pawili',
  'Sagrada',
  'Sagurong',
  'San Agustin',
  'San Antonio',
  'San Isidro',
  'San Jose',
  'San Juan',
  'San Vicente',
  'Santiago',
  'Santo Niño',
  'Tagbong',
  'Tinangis'
] as const;

export type BarangayName = typeof PILI_BARANGAYS[number];

// Helper function to validate barangay
export function isValidBarangay(barangay: string): boolean {
  return PILI_BARANGAYS.includes(barangay as any);
}

// Get barangay code from name
export function getBarangayCode(barangay: string): string {
  return barangay.toLowerCase().replace(/\s+/g, '_');
}
