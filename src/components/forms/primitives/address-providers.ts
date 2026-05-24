/**
 * AddressField provider adapters.
 *
 * Each provider exposes a single function: given a search query, return
 * an array of AddressSuggestion. The AddressField component lazy-imports
 * this module only when an env-var-gated provider is configured, so users
 * without a configured provider pay zero bundle cost.
 *
 * To enable Google Places:
 *   1. Get a Places API key (https://console.cloud.google.com/google/maps-apis)
 *   2. Add NEXT_PUBLIC_GOOGLE_PLACES_KEY="..." to .env.local
 *   3. Add `*.googleapis.com` and `maps.googleapis.com` to CSP allowlist
 *      in next.config.mjs (script-src + connect-src)
 *
 * To add a different provider (Mapbox, Algolia Places, OpenCage, etc.):
 *   - Implement a function with the same signature as fetchGooglePlacesSuggestions
 *   - Update AddressField's `providerConfigured` check to recognize your
 *     env var
 *   - Switch the import in AddressField based on which key is set
 */

import type { AddressSuggestion, AddressComponents } from './AddressField';

/**
 * Cached Google Places script load. Loaded once on first call, reused after.
 */
let googleLoadPromise: Promise<void> | null = null;

function loadGoogleScript(apiKey: string): Promise<void> {
  if (googleLoadPromise) return googleLoadPromise;

  googleLoadPromise = new Promise((resolve, reject) => {
    // Already loaded by another component on the page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google?.maps?.places) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Places script'));
    document.head.appendChild(script);
  });

  return googleLoadPromise;
}

interface GooglePlacesService {
  getPlacePredictions(
    request: { input: string; componentRestrictions?: { country: string[] } },
    callback: (
      predictions: Array<{ description: string; place_id: string }> | null,
      status: string,
    ) => void,
  ): void;
}

interface GooglePlacesDetailService {
  getDetails(
    request: { placeId: string; fields: string[] },
    callback: (
      place: {
        address_components?: Array<{ types: string[]; long_name: string; short_name: string }>;
      } | null,
      status: string,
    ) => void,
  ): void;
}

function parseGooglePlaceComponents(
  components: Array<{ types: string[]; long_name: string; short_name: string }>,
): AddressComponents {
  const get = (type: string, useShort = false) => {
    const c = components.find((x) => x.types.includes(type));
    return c ? (useShort ? c.short_name : c.long_name) : undefined;
  };
  const streetNumber = get('street_number');
  const route = get('route');
  const street = [streetNumber, route].filter(Boolean).join(' ') || undefined;
  return {
    street,
    city: get('locality') || get('sublocality') || get('postal_town'),
    province: get('administrative_area_level_1', true),
    postalCode: get('postal_code'),
    country: get('country', true),
  };
}

/**
 * Fetch address suggestions from Google Places Autocomplete.
 *
 * Returns at most 5 suggestions, restricted to CA + US (Concierge's
 * primary markets). To support other countries, edit componentRestrictions.
 */
export async function fetchGooglePlacesSuggestions(query: string): Promise<AddressSuggestion[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
  if (!apiKey) return [];

  await loadGoogleScript(apiKey);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const google = (window as any).google;
  if (!google?.maps?.places) return [];

  const autocompleteService: GooglePlacesService = new google.maps.places.AutocompleteService();
  // PlacesService requires a DOM element OR a map; an attached div suffices.
  const dummyDiv = document.createElement('div');
  const detailService: GooglePlacesDetailService = new google.maps.places.PlacesService(dummyDiv);

  // Step 1 — get predictions (cheap, autocomplete-as-you-type)
  const predictions = await new Promise<Array<{ description: string; place_id: string }>>(
    (resolve) => {
      autocompleteService.getPlacePredictions(
        { input: query, componentRestrictions: { country: ['ca', 'us'] } },
        (res, status) => {
          if (status !== 'OK' || !res) {
            resolve([]);
            return;
          }
          resolve(res.slice(0, 5));
        },
      );
    },
  );

  // Step 2 — resolve details (with components) for each prediction.
  // Each getDetails call is BILLED — keep predictions count tight.
  const suggestions = await Promise.all(
    predictions.map(
      (p) =>
        new Promise<AddressSuggestion>((resolve) => {
          detailService.getDetails(
            { placeId: p.place_id, fields: ['address_components'] },
            (place, status) => {
              const components =
                status === 'OK' && place?.address_components
                  ? parseGooglePlaceComponents(place.address_components)
                  : undefined;
              resolve({
                description: p.description,
                placeId: p.place_id,
                components,
              });
            },
          );
        }),
    ),
  );

  return suggestions;
}
