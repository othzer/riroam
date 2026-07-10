"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet touches `window` at import time, so it's loaded client-only via a
// dynamic import inside this client boundary (ssr:false isn't allowed inside
// a Server Component file, but is fine here).
const LeafletMapInner = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-card" />,
});

export function LeafletMap(props: { lat: number; lng: number; label: string }) {
  return <LeafletMapInner {...props} />;
}
