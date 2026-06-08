import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { api, errorMessage, isNetworkError, CONNECTION_ERROR_MESSAGE } from '@/lib/api';
import { generateClientId } from '@/lib/utils';

const FONT_REGULAR = 'AtkinsonHyperlegible_400Regular';
const FONT_BOLD = 'AtkinsonHyperlegible_700Bold';

type LocationState =
  | { status: 'loading' }
  | { status: 'ready'; latitude: number; longitude: number }
  | { status: 'denied' };

type Category = 'RESCUE' | 'MEDICAL' | 'SUPPLIES' | 'SHELTER';

const CATEGORIES: { key: Category; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'RESCUE', label: 'Rescue', icon: 'directions-boat' },
  { key: 'MEDICAL', label: 'Medical', icon: 'medical-services' },
  { key: 'SUPPLIES', label: 'Supplies', icon: 'inventory-2' },
  { key: 'SHELTER', label: 'Shelter', icon: 'home' },
];

/**
 * SOS form. Recreates emergency_request_refined: free-text situation input
 * (AI does the triage), optional category grid, live location, and submit.
 */
export default function RequestScreen() {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [location, setLocation] = useState<LocationState>({ status: 'loading' });
  const [submitting, setSubmitting] = useState(false);

  // Acquire GPS on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setLocation({ status: 'denied' });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setLocation({
            status: 'ready',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        }
      } catch {
        if (!cancelled) setLocation({ status: 'denied' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const locationReady = location.status === 'ready';
  const canSubmit = message.trim().length > 0 && locationReady && !submitting;

  async function handleSubmit() {
    if (location.status !== 'ready') {
      Alert.alert('Location required', 'Enable location to send your request.');
      return;
    }
    if (message.trim().length === 0) {
      Alert.alert('Message required', 'Please describe your situation.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.submitRequest({
        clientRequestId: generateClientId(),
        message: message.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
      });
      router.push({
        pathname: '/triage',
        params: { data: JSON.stringify(response.data) },
      });
    } catch (err: any) {
      if (isNetworkError(err)) {
        Alert.alert('Connection Error', CONNECTION_ERROR_MESSAGE);
      } else {
        Alert.alert('Request failed', errorMessage(err, 'Could not send your request.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={8}
          android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: true }}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressedDim]}
          onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color={Colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Report Emergency</Text>
        <View style={styles.iconButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Location status row */}
          <View style={styles.locationStatusRow}>
            <MaterialIcons
              name={locationReady ? 'my-location' : 'location-searching'}
              size={22}
              color={location.status === 'denied' ? Colors.error : Colors.primary}
            />
            <Text
              style={[
                styles.locationStatusText,
                location.status === 'denied' && { color: Colors.error },
              ]}>
              {location.status === 'ready'
                ? 'Location acquired'
                : location.status === 'denied'
                  ? 'Location required. Enable in settings.'
                  : 'Acquiring…'}
            </Text>
          </View>

          {/* Core message input */}
          <View style={styles.field}>
            <Text style={styles.label}>Describe your situation</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your situation in your own words — Malay, English, or any language"
              placeholderTextColor={Colors.outline}
              multiline
              textAlignVertical="top"
              editable={!submitting}
            />
          </View>

          {/* Optional category grid */}
          <View style={styles.field}>
            <Text style={styles.label}>Request category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const selected = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    android_ripple={{ color: 'rgba(0,61,155,0.12)' }}
                    style={({ pressed }) => [
                      styles.categoryButton,
                      selected && styles.categoryButtonSelected,
                      pressed && styles.pressedDim,
                    ]}
                    onPress={() => setCategory(selected ? null : cat.key)}>
                    <MaterialIcons
                      name={cat.icon}
                      size={28}
                      color={selected ? Colors.primary : Colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: selected ? Colors.primary : Colors.onSurface },
                      ]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.categoryNote}>
              Optional — AI will automatically detect your situation
            </Text>
          </View>

          {/* Location display row */}
          <View style={styles.locationDisplayRow}>
            <MaterialIcons name="place" size={22} color={Colors.primary} />
            <Text style={styles.locationDisplayText}>
              {location.status === 'ready'
                ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                : 'Getting location…'}
            </Text>
          </View>

          {/* Submit */}
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.pressedScale,
            ]}
            onPress={handleSubmit}>
            {submitting ? (
              <ActivityIndicator color={Colors.onSecondary} />
            ) : (
              <>
                <MaterialIcons name="send" size={22} color={Colors.onSecondary} />
                <Text style={styles.submitLabel}>Send Emergency Request</Text>
              </>
            )}
          </Pressable>
          {submitting && (
            <Text style={styles.analysingText}>AI is analysing your request…</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.headlineSm.fontSize,
    color: Colors.onSurface,
  },
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xxl,
  },
  locationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  locationStatusText: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurface,
    flex: 1,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
    color: Colors.onSurfaceVariant,
  },
  messageInput: {
    minHeight: 120,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    fontFamily: FONT_REGULAR,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryButton: {
    // two per row, accounting for the gap
    width: '47%',
    flexGrow: 1,
    minHeight: 80,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  categoryButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceContainer,
  },
  categoryLabel: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
  },
  categoryNote: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.labelMd.fontSize,
    color: Colors.onSurfaceVariant,
  },
  locationDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationDisplayText: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurfaceVariant,
  },
  submitButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.md,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.outline,
  },
  submitLabel: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.bodyLg.fontSize,
    color: Colors.onSecondary,
  },
  analysingText: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  pressedScale: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  pressedDim: {
    opacity: 0.7,
  },
});
