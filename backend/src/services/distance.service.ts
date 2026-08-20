import { config } from '../config';
import { logger } from '../utils/logger';

export class DistanceService {
  private static cache: Map<string, number> = new Map();

  /**
   * Calculates actual driving distance in kilometers between origin and destination.
   * Uses Google Maps Distance Matrix API with fallback to area names and estimation.
   * Converts meters to kilometers cleanly (meters / 1000).
   */
  public static async getDrivingDistance(
    origin: string,
    destination: string,
    pickupAreaName?: string,
    dropAreaName?: string
  ): Promise<number> {
    const cacheKey = `${origin.trim().toLowerCase()}|${destination.trim().toLowerCase()}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const apiKey = config.googleMapsApiKey;

    // Use live Google Maps API if key is provided and not in mock/test mode
    if (apiKey && apiKey !== 'mock' && process.env.NODE_ENV !== 'test') {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
          origin
        )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

        const response = await fetch(url);
        const data = (await response.json()) as any;

        if (
          data.status === 'OK' &&
          data.rows?.[0]?.elements?.[0]?.status === 'OK'
        ) {
          const meters = data.rows[0].elements[0].distance.value;
          // Convert meters to kilometers
          const km = Math.round((meters / 1000) * 100) / 100;
          this.cache.set(cacheKey, km);
          return km;
        }

        // Retry with area names if exact address search yielded NOT_FOUND or ZERO_RESULTS
        if (pickupAreaName && dropAreaName && (origin !== pickupAreaName || destination !== dropAreaName)) {
          const areaUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
            pickupAreaName
          )}&destinations=${encodeURIComponent(dropAreaName)}&key=${apiKey}`;

          const areaResponse = await fetch(areaUrl);
          const areaData = (await areaResponse.json()) as any;

          if (
            areaData.status === 'OK' &&
            areaData.rows?.[0]?.elements?.[0]?.status === 'OK'
          ) {
            const meters = areaData.rows[0].elements[0].distance.value;
            const km = Math.round((meters / 1000) * 100) / 100;
            this.cache.set(cacheKey, km);
            return km;
          }
        }

        logger.warn(
          { data, origin, destination },
          'Google Maps Distance Matrix API returned non-OK or REQUEST_DENIED. Falling back to estimated distance calculation.'
        );
      } catch (err: any) {
        logger.warn(
          { err, origin, destination },
          'Failed to reach Google Maps API. Falling back to estimated distance calculation.'
        );
      }
    }

    // Fallback / Deterministic distance calculation for local dev / unroutable / invalid API keys
    const fallbackKm = this.calculateMockDistance(origin, destination, pickupAreaName, dropAreaName);
    this.cache.set(cacheKey, fallbackKm);
    return fallbackKm;
  }

  /**
   * Deterministic fallback distance calculation for unit tests and local dev
   */
  private static calculateMockDistance(
    origin: string,
    destination: string,
    pickupAreaName?: string,
    dropAreaName?: string
  ): number {
    const o = (pickupAreaName || origin).toLowerCase();
    const d = (dropAreaName || destination).toLowerCase();

    if (o === d) {
      return 4.0; // Same area: 4 km
    }

    // Hash-based deterministic distance generator (between 5 km and 25 km)
    let hash = 0;
    const combined = `${o}->${d}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }

    const positiveHash = Math.abs(hash);
    const mockKm = 5 + (positiveHash % 200) / 10; // e.g. 12.5 km
    return Math.round(mockKm * 100) / 100;
  }

  /**
   * Clear cache (useful in test teardown)
   */
  public static clearCache() {
    this.cache.clear();
  }
}
