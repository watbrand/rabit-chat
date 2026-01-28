export { TERMS_OF_SERVICE, TERMS_VERSION, TERMS_EFFECTIVE_DATE } from "./terms-of-service";
export { PRIVACY_POLICY, PRIVACY_VERSION, PRIVACY_EFFECTIVE_DATE } from "./privacy-policy";
export { COMMUNITY_GUIDELINES, GUIDELINES_VERSION, GUIDELINES_EFFECTIVE_DATE } from "./community-guidelines";

export const CURRENT_LEGAL_VERSION = "1.0";

export interface LegalDocument {
  title: string;
  version: string;
  effectiveDate: string;
  content: string;
  type: "terms" | "privacy" | "guidelines";
}

export interface LegalAgreementStatus {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  guidelinesAccepted: boolean;
  currentVersion: string;
  userVersion: string | null;
  needsUpdate: boolean;
}
