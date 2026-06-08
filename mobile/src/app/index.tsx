import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { checkServerReachable, type HelpRequestResponse } from '@/lib/api';


const FONT_REGULAR = 'AtkinsonHyperlegible_400Regular';
const FONT_BOLD = 'AtkinsonHyperlegible_700Bold';

/** PENDING → warning orange, DISPATCHED/anything else → primary blue. */
function statusChipColors(status: string): { bg: string; fg: string } {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return { bg: Colors.tertiary, fg: Colors.onSecondary };
    case 'DISPATCHED':
    case 'IN_PROGRESS':
      return { bg: Colors.primary, fg: Colors.onPrimary };
    default:
      return { bg: Colors.primary, fg: Colors.onPrimary };
  }
}

/**
 * Home — victim portal. Recreates victim_portal_refined: header, severe-weather
 * banner, greeting, the large "I Need Help" SOS focal point, last-request status,
 * and the map/notifications row.
 */
export default function HomeScreen() {
  const params = useLocalSearchParams<{ lastRequest?: string }>();
  const [lastRequest, setLastRequest] = useState<HelpRequestResponse | null>(null);
  const [serverReachable, setServerReachable] = useState(true);

  // One-shot reachability probe so we can warn before the user taps SOS.
  useEffect(() => {
    let cancelled = false;
    checkServerReachable().then((ok) => {
      if (!cancelled) setServerReachable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Populate the status card if we returned here with a freshly submitted request.
  useEffect(() => {
    if (typeof params.lastRequest === 'string' && params.lastRequest.length > 0) {
      try {
        setLastRequest(JSON.parse(params.lastRequest) as HelpRequestResponse);
      } catch {
        // Ignore malformed param — leave the "no active requests" state.
      }
    }
  }, [params.lastRequest]);

  // Soft pulse on the flood-warning icon.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <MaterialIcons name="gpp-good" size={28} color={Colors.primary} />
          <Text style={styles.brandName}>SIAGA</Text>
        </View>
        <Pressable
          accessibilityLabel="Account"
          hitSlop={8}
          android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: true }}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressedDim]}
          onPress={() => Alert.alert('Account', 'Profile is not available in this demo.')}>
          <MaterialIcons name="account-circle" size={28} color={Colors.onSurfaceVariant} />
        </Pressable>
      </View>

      {/* Offline banner — shown when the server health probe fails */}
      {!serverReachable && (
        <View style={styles.offlineBanner}>
          <MaterialIcons name="cloud-off" size={18} color={Colors.onSecondary} />
          <Text style={styles.offlineText}>
            Offline mode — requests will sync when connection returns
          </Text>
        </View>
      )}

      {/* Severe-weather alert banner */}
      <View style={styles.alertBanner}>
        <Animated.View style={[styles.alertIconWrap, { transform: [{ scale: pulse }] }]}>
          <MaterialIcons name="flood" size={24} color={Colors.onSecondary} />
        </Animated.View>
        <View style={styles.alertTextWrap}>
          <Text style={styles.alertTitle}>Water Level: Rising (Severe)</Text>
          <Text style={styles.alertSubtitle}>Severe warning active</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Hello, Resident</Text>
          <Text style={styles.greetingSubtitle}>Stay safe. Help is coordinated.</Text>
        </View>

        {/* Emergency focal point */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="I need help. Send an emergency request."
          android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
          style={({ pressed }) => [styles.sosButton, pressed && styles.pressedScale]}
          onPress={() => router.push('/request')}>
          <MaterialIcons name="warning" size={48} color={Colors.onSecondary} />
          <Text style={styles.sosLabel}>I Need Help</Text>
        </Pressable>

        {/* Last request status card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusCardTitle}>My Last Request</Text>
          {lastRequest ? (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: statusChipColors(lastRequest.status).bg },
                ]}>
                <Text
                  style={[
                    styles.statusChipText,
                    { color: statusChipColors(lastRequest.status).fg },
                  ]}>
                  {lastRequest.status?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.statusSummary} numberOfLines={2}>
                {lastRequest.summary || lastRequest.message}
              </Text>
            </View>
          ) : (
            <Text style={styles.statusEmpty}>No active requests.</Text>
          )}
        </View>

        {/* Map + notifications row */}
        <View style={styles.bottomRow}>
          <Pressable
            android_ripple={{ color: 'rgba(0,61,155,0.12)' }}
            style={({ pressed }) => [
              styles.outlineButton,
              styles.outlinePrimary,
              pressed && styles.pressedDim,
            ]}
            onPress={() => router.push('/map')}>
            <MaterialIcons name="map" size={22} color={Colors.primary} />
            <Text style={[styles.outlineLabel, { color: Colors.primary }]}>View Map</Text>
          </Pressable>

          <Pressable
            android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
            style={({ pressed }) => [
              styles.outlineButton,
              styles.outlineGrey,
              pressed && styles.pressedDim,
            ]}
            onPress={() =>
              Alert.alert('Notifications', 'No new notifications right now.')
            }>
            <MaterialIcons name="notifications" size={22} color={Colors.onSurfaceVariant} />
            <Text style={[styles.outlineLabel, { color: Colors.onSurfaceVariant }]}>
              Notifications
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandName: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.headlineMd.fontSize,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  offlineText: {
    flex: 1,
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelMd.fontSize,
    color: Colors.onSecondary,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
    color: Colors.onSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertSubtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.labelMd.fontSize,
    color: Colors.onSecondary,
    opacity: 0.85,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xxl,
  },
  greeting: {
    gap: Spacing.xs,
  },
  greetingTitle: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.headlineLg.fontSize,
    lineHeight: Typography.headlineLg.lineHeight,
    color: Colors.onSurface,
  },
  greetingSubtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurfaceVariant,
  },
  sosButton: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.xxl,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: Spacing.xxl,
    // Elevation / shadow
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  sosLabel: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.headlineMd.fontSize,
    color: Colors.onSecondary,
  },
  statusCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  statusCardTitle: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.headlineSm.fontSize,
    color: Colors.onSurface,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusChipText: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelMd.fontSize,
    letterSpacing: 0.5,
  },
  statusSummary: {
    flex: 1,
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurfaceVariant,
  },
  statusEmpty: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurfaceVariant,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  outlineButton: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  outlinePrimary: {
    borderColor: Colors.primary,
  },
  outlineGrey: {
    borderColor: Colors.outline,
  },
  outlineLabel: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
  },
  pressedScale: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  pressedDim: {
    opacity: 0.7,
  },
});
