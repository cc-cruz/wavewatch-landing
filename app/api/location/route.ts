import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  findNearestMarineRegion,
  getDefaultMarinePromptSet,
  getMarineRegionById,
  resolveMarinePromptSet,
} from "@/lib/marine-regions";

const IP_LOOKUP_URL = "https://ipwho.is/";
const IP_LOOKUP_TIMEOUT_MS = 3000;

type IpLookupResponse = {
  success?: boolean;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  message?: string;
};

function asNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createResponse(params: {
  regionId: string;
  source: "server-header" | "server-ip" | "default";
  distanceKm?: number;
  city?: string | null;
  region?: string | null;
  country?: string | null;
}) {
  const region = getMarineRegionById(params.regionId);

  if (!region) {
    return NextResponse.json({
      source: "default",
      ...getDefaultMarinePromptSet(),
    });
  }

  return NextResponse.json({
    source: params.source,
    city: params.city ?? null,
    region: params.region ?? null,
    country: params.country ?? null,
    distanceKm:
      typeof params.distanceKm === "number"
        ? Math.round(params.distanceKm)
        : null,
    ...resolveMarinePromptSet(region),
  });
}

export async function GET() {
  const requestHeaders = await headers();

  const headerLatitude = asNumber(requestHeaders.get("x-vercel-ip-latitude"));
  const headerLongitude = asNumber(requestHeaders.get("x-vercel-ip-longitude"));
  const headerCity = requestHeaders.get("x-vercel-ip-city");
  const headerRegion = requestHeaders.get("x-vercel-ip-country-region");
  const headerCountry = requestHeaders.get("x-vercel-ip-country");

  if (headerLatitude !== null && headerLongitude !== null) {
    const match = findNearestMarineRegion(headerLatitude, headerLongitude);

    return createResponse({
      regionId: match.region.id,
      source: "server-header",
      distanceKm: match.distanceKm,
      city: headerCity,
      region: headerRegion,
      country: headerCountry,
    });
  }

  try {
    const response = await fetch(IP_LOOKUP_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(IP_LOOKUP_TIMEOUT_MS),
    });

    if (response.ok) {
      const data = (await response.json()) as IpLookupResponse;

      if (
        data.success !== false &&
        typeof data.latitude === "number" &&
        typeof data.longitude === "number"
      ) {
        const match = findNearestMarineRegion(data.latitude, data.longitude);

        return createResponse({
          regionId: match.region.id,
          source: "server-ip",
          distanceKm: match.distanceKm,
          city: data.city ?? null,
          region: data.region ?? null,
          country: data.country ?? null,
        });
      }
    }
  } catch {
    // Fall through to default prompts when IP lookup fails.
  }

  return NextResponse.json({
    source: "default",
    city: null,
    region: null,
    country: null,
    distanceKm: null,
    ...getDefaultMarinePromptSet(),
  });
}
