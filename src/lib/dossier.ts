export type Child = {
  id: string;
  name: string;
  avatar_url: string | null;
  theme_color: string;
  birthdate: string | null;
};

export type MemoryCard = {
  id: string;
  child_id: string;
  entry_id: string | null;
  date: string;
  title: string;
  body: string | null;
  category: string;
};

export type ProfileFact = {
  id: string;
  child_id: string;
  entry_id: string | null;
  field: string;
  value: string;
  date: string;
};

export type DocumentRow = {
  id: string;
  child_id: string | null;
  file_url: string;
  doc_type: string | null;
  extracted_json: Record<string, unknown> | null;
  uploaded_at: string;
};

export const CATEGORY_LABEL: Record<string, string> = {
  courage: "courage",
  dream: "dream",
  fear: "fear",
  friendship: "friendship",
  "first-time": "first time",
  interest: "interest",
  other: "moment",
};

export const FIELD_LABEL: Record<string, string> = {
  allergy: "Allergy",
  medical: "Medical",
  height: "Height",
  weight: "Weight",
  food_like: "Loves eating",
  food_dislike: "Won't eat",
  interest: "Interest",
  friend: "Friend",
};

export function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.replace(/./g, "$&$&") : clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatDate(value: string) {
  const date = new Date(value + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function ageAt(birthdate: string | null, on: string) {
  if (!birthdate) return null;
  const b = new Date(birthdate + "T00:00:00");
  const d = new Date(on + "T00:00:00");
  let years = d.getFullYear() - b.getFullYear();
  const before =
    d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate());
  if (before) years -= 1;
  return years;
}
