import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MallScreen from "@/screens/MallScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import PayFastCheckoutScreen from "@/screens/PayFastCheckoutScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

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

export type MallStackParamList = {
  Mall: undefined;
  UserProfile: { userId: string };
  PayFastCheckout: {
    orderId: string;
    paymentUrl: string;
    paymentData: PaymentData;
    item: {
      id: string;
      name: string;
      value: number;
      quantity: number;
      totalValue: number;
    };
  };
};

const Stack = createNativeStackNavigator<MallStackParamList>();

export default function MallStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Mall"
        component={MallScreen}
        options={{
          title: "Mall",
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="PayFastCheckout"
        component={PayFastCheckoutScreen}
        options={{
          title: "Checkout",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
