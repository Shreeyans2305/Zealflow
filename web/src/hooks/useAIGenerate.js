import { useState } from 'react';
import { api } from '../utils/apiClient';

export function useAIGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateForm = async (prompt, context = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/api/ai/generate-form', { prompt, context });
      return data;
    } catch (err) {
      const msg = err.message || 'AI generation failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateForm, loading, error };
}
