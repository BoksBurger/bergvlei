require('dotenv').config();

module.exports = {
  expo: {
    name: "Bergvlei",
    slug: "bergvlei",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "bergvlei",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.bergvlei.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.bergvlei.app",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router"
      // Note: react-native-purchases plugin removed temporarily
      // Will be configured programmatically in the app or via development build
      // See: https://www.revenuecat.com/docs/getting-started/installation/reactnative
    ],
    extra: {
      API_URL: process.env.API_URL,
      revenueCatAppleKey: process.env.REVENUECAT_APPLE_API_KEY,
      revenueCatGoogleKey: process.env.REVENUECAT_GOOGLE_API_KEY,
    }
  }
};
