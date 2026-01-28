import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export function useSafeBottomTabBarHeight(): number {
  try {
    return useBottomTabBarHeight();
  } catch {
    return 0;
  }
}
