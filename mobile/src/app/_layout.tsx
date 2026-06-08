import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
  useFonts,
} from '@expo-google-fonts/atkinson-hyperlegible';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Keep the native splash visible while we load fonts.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Hold the splash until fonts resolve (loaded or errored).
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/*
        Stack navigation — screens navigate imperatively via router.push().
        request/triage present as modals (slide up from the bottom).
      */}
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen
          name="request"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="triage"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
