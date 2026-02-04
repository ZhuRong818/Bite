import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./screens/HomeScreen";
import ScannerScreen from "./screens/ScannerScreen";
import LabelScannerScreen from "./screens/LabelScannerScreen";
import ResultScreen from "./screens/ResultScreen";
import { Colors, Fonts } from "./src/theme";

export type RootStackParamList = {
  Home: undefined;
  Scanner: undefined;
  LabelScanner: undefined;
  Result: { title?: string; payload: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.ink,
          headerTitleStyle: {
            fontFamily: Fonts.display,
            fontSize: 18,
            letterSpacing: 0.4,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Bite" }} />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: "Scan Barcode" }} />
        <Stack.Screen name="LabelScanner" component={LabelScannerScreen} options={{ title: "Scan Label" }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: "Result" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
