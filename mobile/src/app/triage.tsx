import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { HelpRequestResponse } from '@/lib/api';
import { categoryIcon, urgencyColor } from '@/lib/utils';

const FONT_REGULAR = 'AtkinsonHyperlegible_400Regular';
const FONT_BOLD = 'AtkinsonHyperlegible_700Bold';

/** Circular SVG progress ring — fills score/10, colored by urgency. */
function DangerGauge({ score, color }: { score: number; color: string }) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, score / 10));
  const dashOffset = circumference * (1 - fraction);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.surfaceContainer}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Start the arc at the top (12 o'clock).
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.gaugeCenter}>
        <Text style={[styles.gaugeScore, { color }]}>{score}</Text>
        <Text style={styles.gaugeUnit}>DANGER</Text>
      </View>
    </View>
  );
}

/**
 * AI triage result. Recreates ai_triage_refined: processing header, the main
 * urgency card with a left edge bar, danger gauge, supporting metrics and the
 * detected-needs pills, plus the map / submit-another actions.
 */
export default function TriageScreen() {
  const params = useLocalSearchParams<{ data?: string }>();

  const data = useMemo<HelpRequestResponse | null>(() => {
    if (typeof params.data !== 'string') return null;
    try {
      return JSON.parse(params.data) as HelpRequestResponse;
    } catch {
      return null;
    }
  }, [params.data]);

  // Continuous rotation for the "analyzing" icon.
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Triage Result</Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Text style={styles.emptyText}>No triage data to display.</Text>
          <Pressable
            android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedScale]}
            onPress={() => router.back()}>
            <Text style={styles.primaryLabel}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const color = urgencyColor(data.urgencyLevel);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Triage Result</Text>
        <Pressable
          accessibilityLabel="Information"
          hitSlop={8}
          android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: true }}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressedDim]}
          onPress={() => {}}>
          <MaterialIcons name="info-outline" size={24} color={Colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Processing indicator */}
        <View style={styles.processingRow}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <MaterialIcons name="autorenew" size={32} color={Colors.primary} />
          </Animated.View>
          <View>
            <Text style={styles.processingTitle}>AI Triage Active</Text>
            <Text style={styles.processingSubtitle}>Situation assessed</Text>
          </View>
        </View>

        {/* Main urgency card */}
        <View style={styles.card}>
          <View style={[styles.cardEdgeBar, { backgroundColor: color }]} />
          <View style={styles.cardBody}>
            {/* Top: category + urgency chip + gauge */}
            <View style={styles.cardTop}>
              <View style={styles.cardTopLeft}>
                <View style={styles.categoryRow}>
                  <MaterialIcons
                    name={categoryIcon(data.category) as keyof typeof MaterialIcons.glyphMap}
                    size={20}
                    color={Colors.onSurfaceVariant}
                  />
                  <Text style={styles.categoryText}>{data.category}</Text>
                </View>
                <View style={[styles.urgencyChip, { backgroundColor: color }]}>
                  <Text style={styles.urgencyChipText}>{data.urgencyLevel ?? 'UNKNOWN'}</Text>
                </View>
              </View>
              <DangerGauge score={data.dangerScore ?? 0} color={color} />
            </View>

            {/* Summary */}
            <Text style={styles.summaryLabel}>Situation Summary</Text>
            <Text style={[styles.summaryText, { borderLeftColor: color }]}>
              {data.summary ?? 'No summary available.'}
            </Text>

            {/* Metrics */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Vulnerability</Text>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeText}>{data.vulnerabilityScore}/10</Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricLabelRow}>
                <MaterialIcons name="people" size={20} color={Colors.onSurfaceVariant} />
                <Text style={styles.metricLabel}>People</Text>
              </View>
              <Text style={styles.metricValue}>{data.peopleCount}</Text>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricLabelRow}>
                <MaterialIcons name="language" size={20} color={Colors.onSurfaceVariant} />
                <Text style={styles.metricLabel}>Language</Text>
              </View>
              <Text style={styles.metricValue}>{data.detectedLanguage}</Text>
            </View>

            {/* Needs */}
            {data.needs?.length > 0 && (
              <View style={styles.needsSection}>
                <Text style={styles.metricLabel}>Detected Needs</Text>
                <View style={styles.needsWrap}>
                  {data.needs.map((need, i) => (
                    <View key={`${need}-${i}`} style={styles.needPill}>
                      <Text style={styles.needPillText}>{need}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <Pressable
          accessibilityRole="button"
          android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedScale]}
          onPress={() => router.push('/map')}>
          <MaterialIcons name="map" size={22} color={Colors.onPrimary} />
          <Text style={styles.primaryLabel}>View on Map</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          android_ripple={{ color: 'rgba(0,61,155,0.12)' }}
          style={({ pressed }) => [styles.outlineButton, pressed && styles.pressedDim]}
          onPress={() => router.back()}>
          <Text style={styles.outlineLabel}>Submit Another</Text>
        </Pressable>
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
    padding: Spacing.xl,
    gap: Spacing.xxl,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  processingTitle: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.headlineSm.fontSize,
    color: Colors.onSurface,
  },
  processingSubtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.labelMd.fontSize,
    color: Colors.onSurfaceVariant,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardEdgeBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTopLeft: {
    gap: Spacing.sm,
    flexShrink: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryText: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelMd.fontSize,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urgencyChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  urgencyChipText: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
    color: Colors.onSecondary,
    letterSpacing: 0.5,
  },
  gaugeCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScore: {
    fontFamily: FONT_BOLD,
    fontSize: 28,
    lineHeight: 30,
  },
  gaugeUnit: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  summaryLabel: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
    color: Colors.onSurfaceVariant,
  },
  summaryText: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyLg.fontSize,
    lineHeight: Typography.bodyLg.lineHeight,
    color: Colors.onSurface,
    borderLeftWidth: 4,
    paddingLeft: Spacing.md,
    fontStyle: 'italic',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricLabel: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
    color: Colors.onSurfaceVariant,
  },
  metricValue: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurface,
  },
  metricBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
  },
  metricBadgeText: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelMd.fontSize,
    color: Colors.onSurface,
  },
  needsSection: {
    gap: Spacing.sm,
  },
  needsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  needPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
  },
  needPillText: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.labelMd.fontSize,
    color: Colors.onSurface,
  },
  primaryButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  primaryLabel: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.bodyLg.fontSize,
    color: Colors.onPrimary,
  },
  outlineButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
  },
  outlineLabel: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.bodyLg.fontSize,
    color: Colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  emptyText: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyLg.fontSize,
    color: Colors.onSurfaceVariant,
  },
  pressedScale: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  pressedDim: {
    opacity: 0.7,
  },
});
