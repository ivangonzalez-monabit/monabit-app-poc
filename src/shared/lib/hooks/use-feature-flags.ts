import { useContext } from 'react';

import {
  defaultFeatureFlags,
  FeatureFlagsContext,
  type FeatureFlags,
} from '@/shared/lib/feature-flags/context';

export function useFeatureFlags(): FeatureFlags {
  const flags = useContext(FeatureFlagsContext);

  return flags ?? defaultFeatureFlags;
}
