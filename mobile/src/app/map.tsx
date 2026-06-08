import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import {
  api,
  CONNECTION_ERROR_MESSAGE,
  DangerZone,
  errorMessage,
  isNetworkError,
  MapPin,
} from '../lib/api';
import { categoryIcon, urgencyColor } from '../lib/utils';

const FONT_REGULAR = 'AtkinsonHyperlegible_400Regular';
const FONT_BOLD = 'AtkinsonHyperlegible_700Bold';

type TabKey = 'needs' | 'available' | 'routes';

// Self-contained Leaflet + OpenStreetMap page. Note: no `${}` or backticks
// inside — inner JS uses string concatenation so this TS template stays literal.
const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
  body { overflow: hidden; }
  .pin {
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.45);
    box-sizing: border-box;
  }
  .pin-critical { position: relative; }
  .pin-critical::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 0 rgba(182,23,30,0.6);
    animation: siaga-pulse 1.4s infinite ease-out;
  }
  @keyframes siaga-pulse {
    0% { box-shadow: 0 0 0 0 rgba(182,23,30,0.6); }
    70% { box-shadow: 0 0 0 16px rgba(182,23,30,0); }
    100% { box-shadow: 0 0 0 0 rgba(182,23,30,0); }
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false }).setView([1.4927, 103.7414], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var requestLayer = L.layerGroup().addTo(map);
  var resourceLayer = L.layerGroup().addTo(map);
  var zoneLayer = L.layerGroup().addTo(map);

  function urgencyColor(level) {
    if (level === 'CRITICAL') return '#b6171e';
    if (level === 'HIGH') return '#ea580c';
    if (level === 'MODERATE') return '#ca8a04';
    if (level === 'LOW') return '#64748b';
    return '#64748b';
  }

  function send(obj) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }
  }

  function makeMarker(pin, color, critical, size) {
    var cls = 'pin' + (critical ? ' pin-critical' : '');
    var style = 'background:' + color + ';width:' + size + 'px;height:' + size + 'px;';
    var html = '<div class="' + cls + '" style="' + style + '"></div>';
    var icon = L.divIcon({
      className: '',
      html: html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
    var marker = L.marker([pin.latitude, pin.longitude], { icon: icon });
    marker.on('click', function () {
      send({ type: 'PIN_TAP', pin: pin });
    });
    return marker;
  }

  function addRequestPins(pins) {
    requestLayer.clearLayers();
    if (!pins) return;
    for (var i = 0; i < pins.length; i++) {
      var p = pins[i];
      var critical = p.urgencyLevel === 'CRITICAL';
      makeMarker(p, urgencyColor(p.urgencyLevel), critical, 18).addTo(requestLayer);
    }
  }

  function addResourcePins(pins) {
    resourceLayer.clearLayers();
    if (!pins) return;
    for (var i = 0; i < pins.length; i++) {
      makeMarker(pins[i], '#1b5e20', false, 16).addTo(resourceLayer);
    }
  }

  function addZones(zones) {
    zoneLayer.clearLayers();
    if (!zones) return;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      L.circle([z.centerLatitude, z.centerLongitude], {
        radius: z.radiusMeters,
        fillColor: '#b6171e',
        fillOpacity: 0.10,
        color: '#b6171e',
        opacity: 0.45,
        weight: 1
      }).addTo(zoneLayer);
    }
  }

  function setTab(tab) {
    if (tab === 'needs') {
      map.addLayer(requestLayer);
      map.removeLayer(resourceLayer);
    } else if (tab === 'available') {
      map.removeLayer(requestLayer);
      map.addLayer(resourceLayer);
    } else {
      map.addLayer(requestLayer);
      map.addLayer(resourceLayer);
    }
  }

  function handleRNMessage(e) {
    try {
      var data = JSON.parse(e.data);
      if (data.type === 'SET_PINS') {
        addRequestPins(data.requests);
        addResourcePins(data.resources);
      } else if (data.type === 'SET_ZONES') {
        addZones(data.zones);
      } else if (data.type === 'SET_TAB') {
        setTab(data.tab);
      }
    } catch (err) {}
  }

  document.addEventListener('message', handleRNMessage);
  window.addEventListener('message', handleRNMessage);

  map.whenReady(function () {
    send({ type: 'MAP_READY' });
  });
</script>
</body>
</html>`;

function titleCase(value: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function MapScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('needs');
  const [requestPins, setRequestPins] = useState<MapPin[]>([]);
  const [resourcePins, setResourcePins] = useState<MapPin[]>([]);
  const [zones, setZones] = useState<DangerZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const bottomSheetY = useRef(new Animated.Value(400)).current;

  const webViewRef = useRef<WebView>(null);
  const mapReady = useRef<boolean>(false);

  // ─── injectors ─────────────────────────────────────────────────────────
  function injectPins(requests: MapPin[], resources: MapPin[]) {
    if (mapReady.current !== true) return;
    webViewRef.current?.injectJavaScript(`
      handleRNMessage({data: JSON.stringify({
        type:'SET_PINS',
        requests:${JSON.stringify(requests)},
        resources:${JSON.stringify(resources)}
      })});true;
    `);
  }

  function injectZones(zoneList: DangerZone[]) {
    if (mapReady.current !== true) return;
    webViewRef.current?.injectJavaScript(`
      handleRNMessage({data: JSON.stringify({
        type:'SET_ZONES',
        zones:${JSON.stringify(zoneList)}
      })});true;
    `);
  }

  function injectTab(tab: TabKey) {
    if (mapReady.current !== true) return;
    webViewRef.current?.injectJavaScript(`
      handleRNMessage({data: JSON.stringify({
        type:'SET_TAB',
        tab:'${tab}'
      })});true;
    `);
  }

  // ─── data ──────────────────────────────────────────────────────────────
  async function loadData() {
    setLoading(true);
    try {
      const [pinsRes, zonesRes] = await Promise.all([api.getMapPins(), api.getZones()]);
      const requests = pinsRes.data.requests ?? [];
      const resources = pinsRes.data.resources ?? [];
      const zoneList = zonesRes.data ?? [];
      setRequestPins(requests);
      setResourcePins(resources);
      setZones(zoneList);
      injectPins(requests, resources);
      injectZones(zoneList);
    } catch (err) {
      if (isNetworkError(err)) {
        Alert.alert('Connection Error', CONNECTION_ERROR_MESSAGE);
      } else {
        Alert.alert('Map unavailable', errorMessage(err, 'Could not load map data.'));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleGenerateDemo() {
    Alert.alert(
      'Generate Demo Data?',
      'This seeds 8 resources and 20 help requests for the demo.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              await api.generateDemo();
              await loadData();
            } catch (err) {
              if (isNetworkError(err)) {
                Alert.alert('Connection Error', CONNECTION_ERROR_MESSAGE);
              } else {
                Alert.alert('Failed', errorMessage(err, 'Could not generate demo data.'));
              }
            }
          },
        },
      ],
    );
  }

  // ─── webview bridge ────────────────────────────────────────────────────
  function onWebViewMessage(e: WebViewMessageEvent) {
    let msg: any;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'MAP_READY') {
      mapReady.current = true;
      injectPins(requestPins, resourcePins);
      injectZones(zones);
      injectTab(activeTab);
    } else if (msg.type === 'PIN_TAP') {
      showSheet(msg.pin as MapPin);
    }
  }

  function changeTab(tab: TabKey) {
    setActiveTab(tab);
    injectTab(tab);
  }

  // ─── bottom sheet ──────────────────────────────────────────────────────
  function showSheet(pin: MapPin) {
    setSelectedPin(pin);
    Animated.spring(bottomSheetY, { toValue: 0, useNativeDriver: true }).start();
  }

  function hideSheet() {
    Animated.timing(bottomSheetY, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedPin(null));
  }

  const isEmpty = !loading && requestPins.length === 0 && resourcePins.length === 0;

  return (
    <View style={styles.root}>
      {/* Layer 1 — WebView map */}
      <WebView
        ref={webViewRef}
        style={styles.webview}
        source={{ html: MAP_HTML }}
        onMessage={onWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
      />

      {/* Layer 2 + 3 — header + tab bar */}
      <SafeAreaView style={styles.topSafe} edges={['top']} pointerEvents="box-none">
        <View style={styles.header}>
          <View style={styles.brand}>
            <MaterialIcons name="gpp-good" size={26} color={Colors.primary} />
            <Text style={styles.brandName}>SIAGA</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Refresh map"
              hitSlop={8}
              android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: true }}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressedDim]}
              onPress={loadData}>
              <MaterialIcons name="refresh" size={24} color={Colors.primary} />
            </Pressable>
            <Pressable
              accessibilityLabel="Generate demo data"
              hitSlop={8}
              android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: true }}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressedDim]}
              onPress={handleGenerateDemo}>
              <MaterialIcons name="science" size={24} color={Colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.tabBar}>
          {(['needs', 'available', 'routes'] as TabKey[]).map((tab) => {
            const active = activeTab === tab;
            const label =
              tab === 'needs' ? 'Help Needed' : tab === 'available' ? 'Help Available' : 'Safe Routes';
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                android_ripple={{ color: 'rgba(0,61,155,0.15)' }}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => changeTab(tab)}>
                <Text
                  style={[styles.tabLabel, active ? styles.tabLabelActive : styles.tabLabelInactive]}
                  numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Layer 4 — loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading emergency data…</Text>
        </View>
      )}

      {/* Layer 5 — empty state */}
      {isEmpty && (
        <View style={styles.emptyWrap} pointerEvents="box-none">
          <View style={styles.emptyCard}>
            <MaterialIcons name="location-off" size={32} color={Colors.outline} />
            <Text style={styles.emptyTitle}>No active data</Text>
            <Text style={styles.emptyText}>Tap 🔬 to generate demo data</Text>
          </View>
        </View>
      )}

      {/* Layer 6 — SOS FAB */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send emergency request"
        android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: false }}
        style={({ pressed }) => [styles.fab, pressed && styles.pressedScale]}
        onPress={() => router.push('/request')}>
        <MaterialIcons name="warning" size={28} color={Colors.onSecondary} />
        <Text style={styles.fabText}>SOS</Text>
      </Pressable>

      {/* Layer 7 — backdrop */}
      {selectedPin !== null && (
        <Pressable
          accessibilityLabel="Dismiss details"
          android_ripple={{ color: 'transparent' }}
          style={styles.backdrop}
          onPress={hideSheet}
        />
      )}

      {/* Layer 8 — bottom sheet */}
      {selectedPin !== null && (
        <Animated.View style={[styles.sheet, { transform: [{ translateY: bottomSheetY }] }]}>
          <View style={styles.dragHandle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
            {selectedPin.pinType === 'REQUEST'
              ? renderRequestSheet(selectedPin, hideSheet)
              : renderResourceSheet(selectedPin, hideSheet)}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

// ─── sheet content (plain functions — kept outside to avoid re-creation) ───
function renderRequestSheet(pin: MapPin, onClose: () => void) {
  const color = urgencyColor(pin.urgencyLevel);
  return (
    <>
      <View style={styles.sheetTopRow}>
        <View style={[styles.chip, { backgroundColor: color }]}>
          <Text style={styles.chipText}>{pin.urgencyLevel ?? 'UNKNOWN'}</Text>
        </View>
        <View style={styles.categoryRow}>
          <MaterialIcons
            name={categoryIcon(pin.category) as keyof typeof MaterialIcons.glyphMap}
            size={20}
            color={Colors.onSurfaceVariant}
          />
          <Text style={styles.categoryText}>{titleCase(pin.category)}</Text>
        </View>
      </View>

      <View style={[styles.scoreCard, { borderLeftColor: color }]}>
        <Text style={styles.scoreLabel}>Urgency Score</Text>
        <Text style={[styles.scoreValue, { color }]}>
          {pin.urgencyScore != null ? `${Math.round(pin.urgencyScore)}/10` : '—'}
        </Text>
      </View>

      <Text style={styles.detailLine}>Status: {titleCase(pin.status)}</Text>
      <Text style={styles.detailLineMuted}>Request ID: #{pin.id}</Text>

      <View style={styles.sheetActions}>
        <Pressable
          android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedScale]}
          onPress={() => {
            Alert.alert('Claim Request', `Request #${pin.id} claimed (demo placeholder).`);
            onClose();
          }}>
          <MaterialIcons name="assignment-turned-in" size={20} color={Colors.onPrimary} />
          <Text style={styles.primaryButtonText}>Claim</Text>
        </Pressable>
        <Pressable
          android_ripple={{ color: 'rgba(0,61,155,0.12)' }}
          style={({ pressed }) => [styles.outlineButton, pressed && styles.pressedDim]}
          onPress={onClose}>
          <Text style={styles.outlineButtonText}>Close</Text>
        </Pressable>
      </View>
    </>
  );
}

function renderResourceSheet(pin: MapPin, onClose: () => void) {
  return (
    <>
      <View style={styles.sheetTopRow}>
        <View style={[styles.chip, { backgroundColor: Colors.urgencySafe }]}>
          <Text style={styles.chipText}>AVAILABLE</Text>
        </View>
        <View style={styles.categoryRow}>
          <MaterialIcons
            name={categoryIcon(pin.category) as keyof typeof MaterialIcons.glyphMap}
            size={20}
            color={Colors.onSurfaceVariant}
          />
          <Text style={styles.categoryText}>{titleCase(pin.category)}</Text>
        </View>
      </View>

      {pin.availableCapacity != null && (
        <View style={[styles.scoreCard, { borderLeftColor: Colors.urgencySafe }]}>
          <Text style={styles.scoreLabel}>Available Capacity</Text>
          <Text style={[styles.scoreValue, { color: Colors.urgencySafe }]}>
            {pin.availableCapacity} slots
          </Text>
        </View>
      )}

      <Text style={styles.detailLine}>Status: {titleCase(pin.status)}</Text>
      <Text style={styles.detailLineMuted}>Resource ID: #{pin.id}</Text>

      <View style={styles.sheetActions}>
        <Pressable
          android_ripple={{ color: 'rgba(0,61,155,0.12)' }}
          style={({ pressed }) => [styles.outlineButtonFull, pressed && styles.pressedDim]}
          onPress={onClose}>
          <Text style={styles.outlineButtonText}>Close</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  webview: { flex: 1 },

  // header + tabs
  topSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandName: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.headlineMd.fontSize,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    marginHorizontal: Spacing.xl,
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.xs,
    gap: Spacing.xs,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  tabButtonActive: { backgroundColor: Colors.primary },
  tabLabel: { fontFamily: FONT_BOLD, fontSize: Typography.labelMd.fontSize },
  tabLabelActive: { color: Colors.onPrimary },
  tabLabelInactive: { color: Colors.onSurfaceVariant },

  // loading
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(252,248,249,0.85)',
  },
  loadingText: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurfaceVariant,
  },

  // empty state
  emptyWrap: { position: 'absolute', bottom: 160, left: 0, right: 0, alignItems: 'center' },
  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyTitle: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
    color: Colors.onSurface,
  },
  emptyText: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurfaceVariant,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
    color: Colors.onSecondary,
    letterSpacing: 0.5,
  },

  // bottom sheet
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 50,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '65%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    zIndex: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    marginBottom: Spacing.lg,
  },
  sheetBody: { gap: Spacing.md, paddingBottom: Spacing.xxxl },
  sheetTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  chipText: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelMd.fontSize,
    color: Colors.onSecondary,
    letterSpacing: 0.5,
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  categoryText: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
    color: Colors.onSurface,
  },
  scoreCard: {
    borderLeftWidth: 4,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  scoreLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: { fontFamily: FONT_BOLD, fontSize: 24 },
  detailLine: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.onSurface,
  },
  detailLineMuted: {
    fontFamily: FONT_REGULAR,
    fontSize: Typography.labelMd.fontSize,
    color: Colors.onSurfaceVariant,
  },
  sheetActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  primaryButtonText: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
    color: Colors.onPrimary,
  },
  outlineButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
  },
  outlineButtonFull: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
  },
  outlineButtonText: {
    fontFamily: FONT_BOLD,
    fontSize: Typography.labelLg.fontSize,
    color: Colors.primary,
  },

  pressedScale: { opacity: 0.95, transform: [{ scale: 0.97 }] },
  pressedDim: { opacity: 0.7 },
});
