import { useCallback, useState } from "react";

const useGeoLocation = () => {
  const [state, setState] = useState({
    loaded: false,
    coordinates: null,
    accuracy: null,
    error: null,
  });

  const request = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        const error = { code: 0, message: "Geolocation not supported" };
        setState(s => ({ ...s, loaded: true, error }));
        reject(error);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const payload = {
            loaded: true,
            coordinates: { lat: latitude, lng: longitude },
            accuracy,
            error: null,
          };
            setState(payload);
            resolve(payload);
        },
        (err) => {
          const error = { code: err.code, message: err.message || "Failed to get location" };
          setState(s => ({ ...s, loaded: true, error }));
          reject(error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    });
  }, []);

  return { ...state, request };
};

export default useGeoLocation;