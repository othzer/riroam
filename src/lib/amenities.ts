import {
  Wifi, ParkingCircle, Coffee, Utensils, Snowflake, Flame,
  Tv, WashingMachine, Mountain, ShieldCheck, Bath, Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MAP: Record<string, { label: string; icon: LucideIcon }> = {
  wifi: { label: "Wi-Fi", icon: Wifi },
  parking: { label: "Parking", icon: ParkingCircle },
  breakfast: { label: "Breakfast", icon: Coffee },
  meals: { label: "Meals included", icon: Utensils },
  heating: { label: "Room heating", icon: Flame },
  ac: { label: "Air conditioning", icon: Snowflake },
  tv: { label: "TV", icon: Tv },
  laundry: { label: "Laundry", icon: WashingMachine },
  view: { label: "Mountain view", icon: Mountain },
  security: { label: "24/7 security", icon: ShieldCheck },
  attached_bathroom: { label: "Attached bathroom", icon: Bath },
  common_area: { label: "Common area", icon: Users },
};

export function amenityMeta(key: string) {
  const norm = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return MAP[norm] ?? { label: key, icon: ShieldCheck };
}
