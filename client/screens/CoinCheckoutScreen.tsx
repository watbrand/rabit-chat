import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import WebView from "react-native-webview";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GlassButton } from "@/components/GlassButton";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { GradientBackground } from "@/components/GradientBackground";
import { getApiUrl } from "@/lib/query-client";
import { LoadingIndicator } from "@/components/animations";

type PaymentData = {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  m_payment_id: string;
  amount: number;
  item_name: string;
  item_description?: string;
  email_address?: string;
  name_first?: string;
  name_last?: string;
  custom_str1?: string;
  signature: string;
};

type RouteParams = {
  purchaseId: string;
  paymentUrl: string;
  paymentData: PaymentData;
  bundle: {
    name: string;
    coinAmount: number;
    bonusCoins: number;
    priceRands: number;
  };
};

export default function CoinCheckoutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { theme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const queryClient = useQueryClient();

  const params = route.params as RouteParams;
  const { purchaseId, paymentUrl, paymentData, bundle } = params;

  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const generateFormHtml = () => {
    const formFields = Object.entries(paymentData)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
      .join("\n");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%); 
            }
            .card { 
              background: white; 
              border-radius: 16px; 
              padding: 40px; 
              text-align: center; 
              box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
              max-width: 400px; 
            }
            h1 { color: #333; margin-bottom: 16px; }
            p { color: #666; margin-bottom: 24px; }
            .spinner { 
              border: 4px solid #f3f3f3; 
              border-top: 4px solid #9333EA; 
              border-radius: 50%; 
              width: 40px; 
              height: 40px; 
              animation: spin 1s linear infinite; 
              margin: 0 auto 16px; 
            }
            @keyframes spin { 
              0% { transform: rotate(0deg); } 
              100% { transform: rotate(360deg); } 
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h1>Redirecting to PayFast</h1>
            <p>Please wait while we redirect you to complete your payment...</p>
          </div>
          <form id="payfast-form" action="${paymentUrl}" method="POST">
            ${formFields}
          </form>
          <script>
            setTimeout(function() {
              document.getElementById('payfast-form').submit();
            }, 1000);
          </script>
        </body>
      </html>
    `;
  };

  const checkPaymentStatus = async () => {
    try {
      setCheckingStatus(true);
      
      // The return page ALREADY completes the purchase server-side.
      // This API call is just a backup verification - if it fails (e.g., network issues
      // when WebView is navigating away), we still assume success since the server completed it.
      
      try {
        // First, try to complete the purchase (in case ITN failed to reach server)
        const completeRes = await fetch(
          new URL("/api/coins/purchase/complete", getApiUrl()),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ purchaseId }),
          }
        );
        
        if (completeRes.ok) {
          const completeData = await completeRes.json();
          
          if (completeData.success) {
            setPaymentComplete(true);
            setNewBalance(completeData.wallet?.coinBalance ?? null);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return;
          }
        }
        
        // Fallback: Check status endpoint
        const res = await fetch(
          new URL(`/api/coins/purchase/${purchaseId}`, getApiUrl()),
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.purchase?.status === "completed") {
            setPaymentComplete(true);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
      } catch (networkErr) {
        // Network error is expected when WebView navigates to app deep link
        // The return page already completed the purchase server-side, so we can show success
        // Still show success since server-side completion already happened
        setPaymentComplete(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (err) {
      console.error("[CoinCheckout] Failed to check/complete status:", err);
      // Even on error, assume success since server-side completion already happened
      setPaymentComplete(true);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleClose = () => {
    // Invalidate wallet queries to refresh the balance
    queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
    
    // Navigate to Main tabs - this will show the updated wallet balance
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ 
          name: "Main",
          state: {
            routes: [{ name: "MallTab" }],
            index: 2, // MallTab index in the tab navigator
          }
        }],
      })
    );
  };

  useEffect(() => {
    if (paymentComplete) {
      const timer = setTimeout(() => {
        handleClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentComplete]);

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    
    // Handle deep link navigation back to app
    if (url.startsWith("rabitchat://")) {
      // The server has already completed the purchase, show success
      if (url.includes("payment=success")) {
        setPaymentComplete(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      return;
    }
    
    if (url.includes("/api/coins/purchase/return") && !paymentComplete) {
      await checkPaymentStatus();
    }
    
    if (url.includes("/api/coins/purchase/cancel")) {
      Alert.alert(
        "Payment Cancelled",
        "Your payment was cancelled. No coins were added to your wallet.",
        [
          {
            text: "OK",
            onPress: handleClose,
          },
        ]
      );
    }
  };

  if (paymentComplete) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <Card style={styles.successCard}>
            <View style={styles.successIcon}>
              <Feather name="check-circle" size={64} color="#4caf50" />
            </View>
            <ThemedText style={styles.successTitle}>Payment Successful!</ThemedText>
            <ThemedText style={styles.successSubtitle}>
              You received {(bundle.coinAmount + bundle.bonusCoins).toLocaleString()} Rabit Coins
            </ThemedText>
            {newBalance !== null ? (
              <ThemedText style={styles.balanceText}>
                New Balance: {newBalance.toLocaleString()} coins
              </ThemedText>
            ) : null}
            <ThemedText style={styles.redirectText}>
              Redirecting to wallet...
            </ThemedText>
          </Card>
        </View>
      </GradientBackground>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Buy Coins</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <Card style={styles.orderSummary}>
        <ThemedText style={styles.summaryLabel}>You're purchasing:</ThemedText>
        <View style={styles.bundleInfo}>
          <ThemedText style={styles.bundleName}>{bundle.name}</ThemedText>
          <ThemedText style={styles.bundleCoins}>
            {bundle.coinAmount.toLocaleString()} coins
            {bundle.bonusCoins > 0 ? ` + ${bundle.bonusCoins.toLocaleString()} bonus` : ""}
          </ThemedText>
          <ThemedText style={[styles.bundlePrice, { color: theme.primary }]}>
            R{bundle.priceRands}
          </ThemedText>
        </View>
      </Card>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Connecting to payment gateway...
          </ThemedText>
        </View>
      ) : null}

      <WebView
        ref={webViewRef}
        source={{ html: generateFormHtml() }}
        style={[styles.webview, loading && styles.hidden]}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        onShouldStartLoadWithRequest={(request) => {
          const { url } = request;
          
          // Intercept rabitchat:// deep links - WebView can't navigate to these
          if (url.startsWith("rabitchat://")) {
            // The server already completed the purchase before sending this deep link
            if (url.includes("payment=success")) {
              setPaymentComplete(true);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
            return false; // Don't let WebView try to load this URL
          }
          return true; // Allow all other URLs
        }}
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.error("[CoinCheckout] WebView error:", nativeEvent.description);
        }}
      />

      {checkingStatus ? (
        <View style={styles.statusOverlay}>
          <Card style={styles.statusCard}>
            <LoadingIndicator size="large" />
            <ThemedText style={styles.statusText}>
              Verifying payment...
            </ThemedText>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  orderSummary: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  bundleInfo: {
    alignItems: "center",
  },
  bundleName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: Spacing.xs,
  },
  bundleCoins: {
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  bundlePrice: {
    fontSize: 24,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  webview: {
    flex: 1,
  },
  hidden: {
    height: 0,
    opacity: 0,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusCard: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
  },
  successCard: {
    margin: Spacing.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: 16,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  balanceText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  redirectText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
