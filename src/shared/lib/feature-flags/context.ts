import { createContext } from 'react';

export type FeatureFlags = {
  documentCapture: boolean;
};

export const defaultFeatureFlags: FeatureFlags = {
  documentCapture: true,
};

export const FeatureFlagsContext = createContext<FeatureFlags | null>(null);
