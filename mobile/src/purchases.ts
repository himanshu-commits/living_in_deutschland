import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, PACKAGE_TYPE, type CustomerInfo, type PurchasesPackage } from "react-native-purchases";

export const REVENUECAT_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "premium";

let configuredUserId: string | null = null;

function platformApiKey(): string | undefined {
  if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android") return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  return undefined;
}

export function purchasesConfigured(): boolean {
  return Boolean(platformApiKey());
}

async function ensureConfigured(userId: string): Promise<void> {
  const apiKey = platformApiKey();
  if (!apiKey) throw new Error("Purchases are not configured for this build yet.");

  if (!configuredUserId) {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey, appUserID: userId });
    configuredUserId = userId;
  } else if (configuredUserId !== userId) {
    await Purchases.logIn(userId);
    configuredUserId = userId;
  }
}

export function hasPremium(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]?.isActive === true;
}

export async function loadLifetimePackage(userId: string): Promise<PurchasesPackage | null> {
  await ensureConfigured(userId);
  const current = (await Purchases.getOfferings()).current;
  if (!current) return null;
  return current.availablePackages.find((item) => item.packageType === PACKAGE_TYPE.LIFETIME)
    ?? current.lifetime
    ?? null;
}

export async function buyLifetime(item: PurchasesPackage): Promise<CustomerInfo> {
  return (await Purchases.purchasePackage(item)).customerInfo;
}

export async function restorePremium(userId: string): Promise<CustomerInfo> {
  await ensureConfigured(userId);
  return Purchases.restorePurchases();
}
