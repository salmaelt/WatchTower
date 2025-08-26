import { useEffect, useState } from "react";
import { fetchMarkers } from "../library/api";

export default function useMarkers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarkers()
      .then((rows) => setData(rows))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}