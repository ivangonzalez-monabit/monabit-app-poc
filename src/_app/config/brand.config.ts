import { type ImageSourcePropType } from 'react-native';

import { brandFontFamily } from '@/_app/config/brand-font';

export type BrandConfig = {
  name: string;
  logo: ImageSourcePropType;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
  };
  featureFlags: {
    documentCapture: boolean;
  };
};

export const brandConfig: BrandConfig = {
  name: 'MonaBit',
  logo: require('../../../assets/images/splash-icon.png'),
  colors: {
    primary: '#208AEF',
    secondary: '#0274DF',
    background: '#ffffff',
    text: '#000000',
  },
  typography: {
    fontFamily: brandFontFamily,
  },
  featureFlags: {
    documentCapture: true,
  },
};
