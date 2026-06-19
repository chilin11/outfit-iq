import { Platform } from 'react-native';

export const sans = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
}) as string;

export const sansMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
}) as string;

export const serif = Platform.select({
  ios: 'New York',
  android: 'serif',
  default: 'serif',
}) as string;
