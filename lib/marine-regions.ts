export type MarineActivity = "surf" | "boating" | "diving" | "fishing";

export type MarineSpot = {
  activity: MarineActivity;
  label: string;
  latitude: number;
  longitude: number;
};

export type MarineRegion = {
  id: string;
  label: string;
  spots: Record<MarineActivity, MarineSpot>;
};

export type MarinePromptSet = {
  regionId: string;
  regionLabel: string;
  prompts: string[];
};

export type MarineRegionMatch = {
  region: MarineRegion;
  distanceKm: number;
  nearestSpot: MarineSpot;
};

export const DEFAULT_MARINE_REGION_ID = "northern-california";

export const marineRegions: MarineRegion[] = [
  {
    id: "san-diego",
    label: "San Diego",
    spots: {
      surf: {
        activity: "surf",
        label: "La Jolla Shores",
        latitude: 32.8507,
        longitude: -117.2726,
      },
      boating: {
        activity: "boating",
        label: "Mission Bay",
        latitude: 32.7762,
        longitude: -117.2511,
      },
      diving: {
        activity: "diving",
        label: "Point Loma",
        latitude: 32.6653,
        longitude: -117.2428,
      },
      fishing: {
        activity: "fishing",
        label: "San Diego offshore banks",
        latitude: 32.593,
        longitude: -117.45,
      },
    },
  },
  {
    id: "los-angeles",
    label: "Los Angeles",
    spots: {
      surf: {
        activity: "surf",
        label: "Malibu",
        latitude: 34.033,
        longitude: -118.678,
      },
      boating: {
        activity: "boating",
        label: "King Harbor",
        latitude: 33.8468,
        longitude: -118.3974,
      },
      diving: {
        activity: "diving",
        label: "Palos Verdes",
        latitude: 33.7737,
        longitude: -118.4137,
      },
      fishing: {
        activity: "fishing",
        label: "Catalina Channel",
        latitude: 33.53,
        longitude: -118.35,
      },
    },
  },
  {
    id: "central-california",
    label: "Monterey Bay",
    spots: {
      surf: {
        activity: "surf",
        label: "Pleasure Point",
        latitude: 36.952,
        longitude: -121.9655,
      },
      boating: {
        activity: "boating",
        label: "Moss Landing",
        latitude: 36.8069,
        longitude: -121.7908,
      },
      diving: {
        activity: "diving",
        label: "Carmel Bay",
        latitude: 36.5228,
        longitude: -121.9297,
      },
      fishing: {
        activity: "fishing",
        label: "Monterey Bay",
        latitude: 36.8,
        longitude: -121.9,
      },
    },
  },
  {
    id: "northern-california",
    label: "Northern California",
    spots: {
      surf: {
        activity: "surf",
        label: "Ocean Beach",
        latitude: 37.7594,
        longitude: -122.5107,
      },
      boating: {
        activity: "boating",
        label: "Bodega Harbor",
        latitude: 38.3188,
        longitude: -123.0662,
      },
      diving: {
        activity: "diving",
        label: "Sonoma Coast",
        latitude: 38.398,
        longitude: -123.1046,
      },
      fishing: {
        activity: "fishing",
        label: "Farallon grounds",
        latitude: 37.7,
        longitude: -123.1,
      },
    },
  },
  {
    id: "oregon-coast",
    label: "Oregon Coast",
    spots: {
      surf: {
        activity: "surf",
        label: "Pacific City",
        latitude: 45.2057,
        longitude: -123.9629,
      },
      boating: {
        activity: "boating",
        label: "Newport",
        latitude: 44.6368,
        longitude: -124.0534,
      },
      diving: {
        activity: "diving",
        label: "Cape Perpetua",
        latitude: 44.2782,
        longitude: -124.1094,
      },
      fishing: {
        activity: "fishing",
        label: "Newport nearshore",
        latitude: 44.62,
        longitude: -124.12,
      },
    },
  },
  {
    id: "washington-coast",
    label: "Washington Coast",
    spots: {
      surf: {
        activity: "surf",
        label: "Westport",
        latitude: 46.8901,
        longitude: -124.1041,
      },
      boating: {
        activity: "boating",
        label: "Shilshole Bay",
        latitude: 47.6845,
        longitude: -122.4031,
      },
      diving: {
        activity: "diving",
        label: "Puget Sound",
        latitude: 47.6,
        longitude: -122.4,
      },
      fishing: {
        activity: "fishing",
        label: "Neah Bay",
        latitude: 48.3682,
        longitude: -124.6154,
      },
    },
  },
  {
    id: "hawaii",
    label: "Oahu",
    spots: {
      surf: {
        activity: "surf",
        label: "Ala Moana",
        latitude: 21.2848,
        longitude: -157.8481,
      },
      boating: {
        activity: "boating",
        label: "Haleiwa Harbor",
        latitude: 21.5954,
        longitude: -158.1048,
      },
      diving: {
        activity: "diving",
        label: "South Shore",
        latitude: 21.2678,
        longitude: -157.8193,
      },
      fishing: {
        activity: "fishing",
        label: "Kaiwi Channel",
        latitude: 21.35,
        longitude: -157.67,
      },
    },
  },
  {
    id: "texas-gulf",
    label: "Texas Gulf Coast",
    spots: {
      surf: {
        activity: "surf",
        label: "Surfside",
        latitude: 28.9541,
        longitude: -95.2805,
      },
      boating: {
        activity: "boating",
        label: "Galveston",
        latitude: 29.3013,
        longitude: -94.7977,
      },
      diving: {
        activity: "diving",
        label: "Flower Garden Banks",
        latitude: 27.9,
        longitude: -93.6,
      },
      fishing: {
        activity: "fishing",
        label: "Galveston offshore",
        latitude: 29.15,
        longitude: -94.65,
      },
    },
  },
  {
    id: "florida-panhandle",
    label: "Florida Panhandle",
    spots: {
      surf: {
        activity: "surf",
        label: "Pensacola Beach",
        latitude: 30.3335,
        longitude: -87.1497,
      },
      boating: {
        activity: "boating",
        label: "Destin Pass",
        latitude: 30.3841,
        longitude: -86.5139,
      },
      diving: {
        activity: "diving",
        label: "Panhandle reefs",
        latitude: 30.25,
        longitude: -86.25,
      },
      fishing: {
        activity: "fishing",
        label: "Destin nearshore",
        latitude: 30.36,
        longitude: -86.42,
      },
    },
  },
  {
    id: "south-florida",
    label: "South Florida",
    spots: {
      surf: {
        activity: "surf",
        label: "South Beach",
        latitude: 25.7826,
        longitude: -80.1341,
      },
      boating: {
        activity: "boating",
        label: "Haulover Inlet",
        latitude: 25.8996,
        longitude: -80.1218,
      },
      diving: {
        activity: "diving",
        label: "Key Largo",
        latitude: 25.0865,
        longitude: -80.4473,
      },
      fishing: {
        activity: "fishing",
        label: "Gulf Stream edge",
        latitude: 25.78,
        longitude: -79.95,
      },
    },
  },
  {
    id: "outer-banks",
    label: "Outer Banks",
    spots: {
      surf: {
        activity: "surf",
        label: "Nags Head",
        latitude: 35.9574,
        longitude: -75.6241,
      },
      boating: {
        activity: "boating",
        label: "Oregon Inlet",
        latitude: 35.7699,
        longitude: -75.5336,
      },
      diving: {
        activity: "diving",
        label: "Hatteras wrecks",
        latitude: 35.2,
        longitude: -75.4,
      },
      fishing: {
        activity: "fishing",
        label: "Hatteras offshore",
        latitude: 35.25,
        longitude: -75.2,
      },
    },
  },
  {
    id: "mid-atlantic",
    label: "Mid-Atlantic",
    spots: {
      surf: {
        activity: "surf",
        label: "Manasquan",
        latitude: 40.1026,
        longitude: -74.0337,
      },
      boating: {
        activity: "boating",
        label: "Barnegat Inlet",
        latitude: 39.7643,
        longitude: -74.1085,
      },
      diving: {
        activity: "diving",
        label: "Shark River reefs",
        latitude: 40.1615,
        longitude: -73.9732,
      },
      fishing: {
        activity: "fishing",
        label: "Jersey nearshore",
        latitude: 39.9,
        longitude: -73.95,
      },
    },
  },
  {
    id: "new-england",
    label: "New England",
    spots: {
      surf: {
        activity: "surf",
        label: "Narragansett",
        latitude: 41.4501,
        longitude: -71.4495,
      },
      boating: {
        activity: "boating",
        label: "Newport Harbor",
        latitude: 41.4901,
        longitude: -71.3128,
      },
      diving: {
        activity: "diving",
        label: "Rhode Island south shore",
        latitude: 41.38,
        longitude: -71.5,
      },
      fishing: {
        activity: "fishing",
        label: "Block Island grounds",
        latitude: 41.1,
        longitude: -71.5,
      },
    },
  },
];

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusKm = 6371;
  const deltaLatitude = degreesToRadians(latitudeB - latitudeA);
  const deltaLongitude = degreesToRadians(longitudeB - longitudeA);
  const latitudeARadians = degreesToRadians(latitudeA);
  const latitudeBRadians = degreesToRadians(latitudeB);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(latitudeARadians) *
      Math.cos(latitudeBRadians) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function buildPromptSet(region: MarineRegion): MarinePromptSet {
  const surfSpot = region.spots.surf.label;
  const harborSpot = region.spots.boating.label;
  const diveSpot = region.spots.diving.label;
  const fishingSpot = region.spots.fishing.label;

  return {
    regionId: region.id,
    regionLabel: region.label,
    prompts: [
      `Is ${surfSpot} good at first light tomorrow?`,
      `Can I get out of ${harborSpot} safely at 6am?`,
      `Will afternoon wind hurt viz around ${diveSpot}?`,
      `Best fishing or diving window near ${fishingSpot} this weekend?`,
    ],
  };
}

export function getMarineRegionById(id: string) {
  return marineRegions.find((region) => region.id === id) ?? null;
}

export function getDefaultMarineRegion() {
  return (
    getMarineRegionById(DEFAULT_MARINE_REGION_ID) ?? marineRegions[0]
  );
}

export function getDefaultMarinePromptSet() {
  return buildPromptSet(getDefaultMarineRegion());
}

export function findNearestMarineRegion(
  latitude: number,
  longitude: number,
): MarineRegionMatch {
  let nearestRegion = getDefaultMarineRegion();
  let nearestSpot = nearestRegion.spots.surf;
  let shortestDistanceKm = Number.POSITIVE_INFINITY;

  for (const region of marineRegions) {
    const regionSpots = Object.values(region.spots);

    for (const spot of regionSpots) {
      const distanceKm = haversineDistanceKm(
        latitude,
        longitude,
        spot.latitude,
        spot.longitude,
      );

      if (distanceKm < shortestDistanceKm) {
        nearestRegion = region;
        nearestSpot = spot;
        shortestDistanceKm = distanceKm;
      }
    }
  }

  return {
    region: nearestRegion,
    nearestSpot,
    distanceKm: shortestDistanceKm,
  };
}

export function resolveMarinePromptSet(region: MarineRegion) {
  return buildPromptSet(region);
}
