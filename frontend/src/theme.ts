import { Platform } from "react-native";

export const Colors = {
  cream: "#F6F1EA",
  mist: "#EEF2EE",
  card: "#FFFFFF",
  ink: "#1B1D1B",
  muted: "#6B6F6C",
  moss: "#2E6D4B",
  coral: "#F26A5A",
  sun: "#FFC857",
  border: "#E3DCD1",
  night: "#0B0D0C",
};

export const Fonts = {
  display: Platform.select({
    ios: "AvenirNext-Heavy",
    android: "serif",
    default: "serif",
  }),
  body: Platform.select({
    ios: "AvenirNext-Regular",
    android: "serif",
    default: "serif",
  }),
  bodyBold: Platform.select({
    ios: "AvenirNext-DemiBold",
    android: "serif",
    default: "serif",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
};

export const Shadows = {
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
};
