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
import WebView, { WebViewNavigation } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";

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
  transactionId: string;
  paymentUrl: string;
  paymentData: PaymentData;
  topup: {
    amount: number;
    amountRands: number;
  };
};

export default function AdWalletCheckoutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { theme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const queryClient = useQueryClient();

  const params = route.params as RouteParams;
  const { transactionId, paymentUrl, paymentData, topup } = params;

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
              margin: 0 auto 20px; 
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
            <p style="font-size: 14px; color: #999;">R${topup.amountRands.toLocaleString()}</p>
          </div>
          <form id="payfast-form" action="${paymentUrl}" method="POST">
            ${formFields}
          </form>
          <script>
            setTimeout(function() {
              document.getElementById('payfast-form').submit();
            }, 1500);
          </script>
        </body>
      </html>
    `;
  };

  const checkPaymentStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await fetch(
        new URL(`/api/ads/wallet/payfast/status/${transactionId}`, getApiUrl()),
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "COMPLETED") {
          setPaymentComplete(true);
          setNewBalance(data.balanceAfter);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      }
    } catch (err) {
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!paymentComplete) {
        checkPaymentStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentComplete]);

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
    
    if (url.includes("/api/ads/wallet/payfast/return") && !paymentComplete) {
      try {
        const completeUrl = new URL("/api/ads/wallet/payfast/complete-topup", getApiUrl());
        
        const response = await fetch(completeUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ transactionId }),
        });
        
        const data = await response.json();
        
        if (data.success || data.status === "COMPLETED") {
          setNewBalance(data.newBalance);
          
          await Promise.all([
            queryClient.invalidateQueries({ 
              queryKey: ["/api/ads/wallet"],
              refetchType: 'all'
            }),
          ]);
          
          Alert.alert(
            "Top-Up Successful!",
            `R${topup.amountRands.toLocaleString()} has been added to your wallet.`
          );
        } else if (data.status === "PENDING") {
          Alert.alert(
            "Processing",
            "Your payment is being processed. Your balance will update shortly."
          );
        }
        
        setPaymentComplete(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        Alert.alert("Processing", "Your payment is being processed. Please check your balance in a moment.");
        setPaymentComplete(true);
      }
    } else if (url.includes("/api/ads/wallet/payfast/cancel")) {
      navigation.goBack();
    }
  };

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/ads/wallet"] });
    
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.dispatch(CommonActions.goBack());
      }
    } catch (error) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' as never }],
        })
      );
    }
  };

  if (paymentComplete) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <GradientBackground />
        <View style={[
          styles.successContainer, 
          { 
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + 100,
          }
        ]}>
          <Card style={styles.successCard}>
            <View style={[styles.successIcon, { backgroundColor: theme.success + "20" }]}>
              <ThemedText style={[styles.successIconText, { color: theme.success }]}>
                ✓
              </ThemedText>
            </View>
            <ThemedText type="title1" style={styles.successTitle}>
              Top-Up Successful
            </ThemedText>
            <ThemedText style={[styles.successMessage, { color: theme.textSecondary }]}>
              Your advertising wallet has been topped up!
            </ThemedText>
            <ThemedText style={[styles.successAmount, { color: theme.primary }]}>
              +R{topup.amountRands.toLocaleString()}
            </ThemedText>
            {newBalance !== null && (
              <ThemedText style={[styles.newBalanceText, { color: theme.textSecondary }]}>
                New Balance: R{(newBalance / 100).toLocaleString()}
              </ThemedText>
            )}
            <Pressable
              onPress={handleClose}
              testID="button-return-to-wallet"
              style={({ pressed }) => [
                styles.returnButton,
                { 
                  backgroundColor: pressed ? theme.primary + "DD" : theme.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText style={styles.returnButtonText}>
                Return to Wallet
              </ThemedText>
            </Pressable>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <GlassButton
          title="Cancel"
          variant="outline"
          size="sm"
          onPress={() => navigation.goBack()}
        />
        <ThemedText type="headline" style={styles.headerTitle}>
          Secure Checkout
        </ThemedText>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.itemInfo}>
        <Card style={styles.itemCard}>
          <ThemedText type="title2" numberOfLines={1}>
            Wallet Top-Up
          </ThemedText>
          <ThemedText style={[styles.itemPrice, { color: theme.primary }]}>
            R{topup.amountRands.toLocaleString()}
          </ThemedText>
        </Card>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <LoadingIndicator size="large" />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Preparing secure checkout...
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
        onError={(syntheticEvent: any) => {
        }}
      />

      {checkingStatus ? (
        <View style={[styles.statusOverlay, { bottom: insets.bottom + Spacing.xl }]}>
          <LoadingIndicator size="small" />
          <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>
            Verifying payment...
          </ThemedText>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 80,
  },
  itemInfo: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemCard: {
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "600",
  },
  webview: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  statusOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  successCard: {
    padding: Spacing.xl,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  successIconText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  successTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  successMessage: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  successAmount: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: Spacing.sm,
  },
  newBalanceText: {
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  returnButton: {
    minWidth: 200,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  returnButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
