import { type ImageSourcePropType, Platform } from 'react-native';

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
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }) ?? 'System',
  },
  featureFlags: {
    documentCapture: true,
  },
};
