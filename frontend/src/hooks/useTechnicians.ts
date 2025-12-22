import { useState, useEffect } from 'react';
import { getTechnicians } from '../api/data';

let cachedTechnicians: { id: number; name: string }[] | null = null;
let techniciansPromise: Promise<{ id: number; name: string }[]> | null = null;

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<{ id: number; name: string }[]>(cachedTechnicians || []);
  const [loading, setLoading] = useState(!cachedTechnicians);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have cached data, use it immediately
    if (cachedTechnicians) {
      setTechnicians(cachedTechnicians);
      setLoading(false);
      return;
    }

    // If there's already a pending request, wait for it
    if (techniciansPromise) {
      techniciansPromise
        .then((data) => {
          cachedTechnicians = data;
          setTechnicians(data);
          setLoading(false);
          techniciansPromise = null;
        })
        .catch((err) => {
          setError(err.message || 'Failed to load technicians');
          setLoading(false);
          techniciansPromise = null;
        });
      return;
    }

    // Start a new request
    setLoading(true);
    techniciansPromise = getTechnicians()
      .then((res) => {
        const data = res.data;
        cachedTechnicians = data;
        techniciansPromise = null;
        return data;
      })
      .catch((err) => {
        techniciansPromise = null;
        throw err;
      });

    techniciansPromise
      .then((data) => {
        setTechnicians(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load technicians');
        setLoading(false);
      });
  }, []);

  return { technicians, loading, error };
}
