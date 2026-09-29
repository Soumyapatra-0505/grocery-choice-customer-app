declare module 'expo-router' {
  export const useRouter: () => {
    push: (href: any) => void;
    replace: (href: any) => void;
    back: () => void;
    canGoBack: () => boolean;
    setParams: (params: any) => void;
  };
  export const useLocalSearchParams: <T = Record<string, string | string[]>>() => T;
  export const usePathname: () => string;
  export const useSegments: () => string[];
  export const Link: any;
  export const Stack: any;
  export const Tabs: any;
  export const Slot: any;
  export const router: {
    push: (href: any) => void;
    replace: (href: any) => void;
    back: () => void;
    canGoBack: () => boolean;
    setParams: (params: any) => void;
  };
  export const DarkTheme: any;
  export const DefaultTheme: any;
  export const ThemeProvider: any;
  export const SplashScreen: any;
}

declare module 'expo-router/ui' {
  export const Tabs: any;
}

declare module 'expo-router/unstable-native-tabs' {
  export const NativeTabs: any;
}

declare module 'react-native-reanimated' {
  const reanimated: any;
  export default reanimated;
  export const useSharedValue: (init: any) => any;
  export const useAnimatedStyle: (updater: () => any) => any;
  export const withTiming: (toValue: any, config?: any, callback?: any) => any;
  export const withSpring: (toValue: any, config?: any, callback?: any) => any;
  export const runOnJS: (fn: any) => any;
}

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}
