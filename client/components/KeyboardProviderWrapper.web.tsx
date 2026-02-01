import React from "react";

interface Props {
  children: React.ReactNode;
}

function KeyboardProviderWrapper({ children }: Props) {
  return <>{children}</>;
}

export default KeyboardProviderWrapper;
