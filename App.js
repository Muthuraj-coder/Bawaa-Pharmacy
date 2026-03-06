import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Auth Screens
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";

// Main App Screens
import AddMedicineScreen from "./src/screens/AddMedicineScreen";
import BillingScreen from "./src/screens/BillingScreen";
import HomeScreen from "./src/screens/HomeScreen";
import InvoiceHistoryScreen from "./src/screens/InvoiceHistoryScreen";
import InvoiceScreen from "./src/screens/InvoiceScreen";
import MedicineScreen from "./src/screens/MedicineScreen";
import PdfPreviewScreen from "./src/screens/PdfPreviewScreen";
import PdfToAdcScreen from "./src/screens/PdfToAdcScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,

          // ✅ Prevents white/black flash on back navigation
          contentStyle: {
            backgroundColor: "#0F172A", // must match global dark theme
          },

          // Smooth, premium transition
          animation: "fade",
        }}
      >
        {/* 🔐 Authentication Flow */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        {/* 🏠 Main Application Flow */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Medicines" component={MedicineScreen} />
        <Stack.Screen name="AddMedicine" component={AddMedicineScreen} />
        <Stack.Screen name="Billing" component={BillingScreen} />
        <Stack.Screen name="Invoice" component={InvoiceScreen} />
        <Stack.Screen name="InvoiceHistory" component={InvoiceHistoryScreen} />

        {/* 📄 PDF → ADC Feature */}
        <Stack.Screen name="PdfToAdc" component={PdfToAdcScreen} />
        <Stack.Screen name="PdfPreview" component={PdfPreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

