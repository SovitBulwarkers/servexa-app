import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  line1: string;
  city?: string;
  region?: string;
  postalCode?: string;
}

interface UseLocationResult {
  loading: boolean;
  error: string | null;
  detectCurrentLocation: () => Promise<DetectedLocation | null>;
}

/**
 * Real device-GPS based location detection.
 * Requests foreground permission, reads current coordinates, and
 * reverse-geocodes them into a human readable address.
 */
export function useLocation(): UseLocationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectCurrentLocation = useCallback(async (): Promise<DetectedLocation | null> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Enable it in system settings to auto-detect your address.');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = results[0];

      const line1 = place
        ? [place.name, place.street].filter(Boolean).join(', ') ||
          [place.streetNumber, place.street].filter(Boolean).join(' ')
        : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      return {
        latitude,
        longitude,
        line1: line1 || 'Current location',
        city: place?.city ?? place?.subregion ?? undefined,
        region: place?.region ?? undefined,
        postalCode: place?.postalCode ?? undefined,
      };
    } catch (err: any) {
      setError(err?.message ?? 'Could not detect your location. Please check GPS is enabled.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, detectCurrentLocation };
}
