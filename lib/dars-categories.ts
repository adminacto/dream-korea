export const DARS_CATEGORIES = [
  { value: "ALIFBO", label: "Koreys alifbosi" },
  { value: "BOSHLANGICH", label: "Boshlang‘ich mavzular" },
  { value: "KUNDALIK", label: "Kundalik suhbat" },
  { value: "GRAMMATIKA", label: "Grammatika" },
  { value: "TOPIK", label: "TOPIK tayyorgarlik" },
] as const;

export type DarsCategory = (typeof DARS_CATEGORIES)[number]["value"];

export function categoryLabel(value: string) {
  return DARS_CATEGORIES.find(category => category.value === value)?.label ?? value;
}
