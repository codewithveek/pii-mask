import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseTokenMapReturn {
  navigateToTokenMap: (tokenMap: Record<string, string>) => void;
}

export function useTokenMap(): UseTokenMapReturn {
  const navigate = useNavigate();

  const navigateToTokenMap = useCallback(
    (tokenMap: Record<string, string>) => {
      navigate('/token-map', { state: { tokenMap } });
    },
    [navigate],
  );

  return { navigateToTokenMap };
}
