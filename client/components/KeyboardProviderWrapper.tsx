import React from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

interface Props {
  children: React.ReactNode;
}

function KeyboardProviderWrapper({ children }: Props) {
  return <KeyboardProvider>{children}</KeyboardProvider>;
}

export default KeyboardProviderWrapper;
