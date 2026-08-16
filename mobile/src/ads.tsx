import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useEntitlement } from "@/entitlements";
import { useColors } from "@/theme";

const LAST_INTERSTITIAL_KEY = "lid.ads.lastInterstitial";
const INTERSTITIAL_COOLDOWN_MS = 10 * 60 * 1000;

export type AdConsentStatus = "unknown" | "required" | "obtained" | "not_required";

type AdContextValue = {
  consentStatus: AdConsentStatus;
  canRequestAds: boolean;
  showInterstitial: () => Promise<boolean>;
  openPrivacyChoices: () => Promise<void>;
};

const AdContext = createContext<AdContextValue | null>(null);

export function AdProvider({ children }: { children: React.ReactNode }) {
  const { isPremium } = useEntitlement();
  const [consentStatus] = useState<AdConsentStatus>("unknown");
  const [interstitialOpen, setInterstitialOpen] = useState(false);
  const resolver = useRef<((shown: boolean) => void) | null>(null);
  const canRequestAds = consentStatus === "obtained" || consentStatus === "not_required";

  const closeInterstitial = useCallback(() => {
    setInterstitialOpen(false);
    resolver.current?.(true);
    resolver.current = null;
  }, []);

  const showInterstitial = useCallback(async () => {
    if (isPremium || interstitialOpen) return false;
    const lastShown = Number((await AsyncStorage.getItem(LAST_INTERSTITIAL_KEY)) ?? 0);
    if (!__DEV__ && Date.now() - lastShown < INTERSTITIAL_COOLDOWN_MS) return false;
    // Production ads remain off until consent and an ad-network SDK are connected.
    if (!__DEV__ && !canRequestAds) return false;
    await AsyncStorage.setItem(LAST_INTERSTITIAL_KEY, String(Date.now()));
    setInterstitialOpen(true);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, [canRequestAds, interstitialOpen, isPremium]);

  const openPrivacyChoices = useCallback(async () => {
    // This becomes the ad network's privacy-options form when its SDK is connected.
  }, []);

  return (
    <AdContext.Provider value={{ consentStatus, canRequestAds, showInterstitial, openPrivacyChoices }}>
      {children}
      <DevelopmentInterstitial visible={interstitialOpen} onClose={closeInterstitial} />
    </AdContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdContext);
  if (!context) throw new Error("useAds must be used inside AdProvider");
  return context;
}

export function AdBanner() {
  const { isPremium } = useEntitlement();
  const { canRequestAds } = useAds();
  const colors = useColors();
  if (isPremium || (!__DEV__ && !canRequestAds)) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.adLabel, { color: colors.textMuted }]}>ADVERTISEMENT</Text>
      <Text style={[styles.bannerText, { color: colors.text }]}>Test banner placement</Text>
    </View>
  );
}

function DevelopmentInterstitial({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.interstitial, { backgroundColor: colors.bg }]}>
        <Text style={[styles.adLabel, { color: colors.textMuted }]}>ADVERTISEMENT</Text>
        <View style={[styles.interstitialCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.interstitialTitle, { color: colors.text }]}>Full-screen ad test</Text>
          <Text style={[styles.interstitialCopy, { color: colors.textMuted }]}>This placeholder will be replaced by a real interstitial ad.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.accent }]}>
          <Text style={styles.closeText}>Close and continue</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  banner: { marginTop: 18, minHeight: 72, borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center", padding: 12 },
  adLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  bannerText: { marginTop: 5, fontSize: 14, fontWeight: "600" },
  interstitial: { flex: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 36, alignItems: "center" },
  interstitialCard: { flex: 1, width: "100%", marginVertical: 28, borderWidth: 1, borderRadius: 24, alignItems: "center", justifyContent: "center", padding: 28 },
  interstitialTitle: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  interstitialCopy: { marginTop: 12, fontSize: 16, lineHeight: 23, textAlign: "center" },
  closeButton: { width: "100%", minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  closeText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
