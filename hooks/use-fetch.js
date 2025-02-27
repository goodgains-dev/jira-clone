import { useState, useCallback } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use useCallback to stabilize the function reference
  const fn = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      setError(null);
    } catch (error) {
      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [cb]);

  // Stabilize setData as well
  const stableSetData = useCallback((newData) => {
    setData(newData);
  }, []);

  return { 
    data, 
    loading, 
    error, 
    fn, 
    setData: stableSetData 
  };
};

export default useFetch;
