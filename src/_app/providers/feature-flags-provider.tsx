import { type PropsWithChildren } from 'react';

import { brandConfig } from '@/_app/config/brand.config';
import { FeatureFlagsContext } from '@/shared/lib/feature-flags/context';

export function FeatureFlagsProvider({ children }: PropsWithChildren) {
  return (
    <FeatureFlagsContext.Provider value={brandConfig.featureFlags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
