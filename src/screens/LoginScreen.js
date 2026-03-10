import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../constants/styles";
import { Spacing, FontSize, FontWeight, Radius, Shadow, SAFE_TOP } from "../constants/theme";
import { login } from "../services/api";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const data = await login({ email, password });
      console.log("TOKEN:", data.access_token);
      Alert.alert("Success", "Login successful");
      navigation.replace("Home");
    } catch (error) {
      console.log("Login error (raw):", error);
      if (error?.message === "Network request failed" || error?.name === "TypeError") {
        Alert.alert("Network Error", "Unable to reach the server. Make sure the backend is running.");
      } else if (error?.status === 401 || error?.status === 403) {
        Alert.alert("Authentication Failed", error.message || "Invalid email or password");
      } else {
        Alert.alert("Login Failed", error.message || "Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => navigation.replace("Home")}
        id="skip-login-btn"
      >
        <Text style={styles.skipText}>Skip →</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Branding */}
          <View style={styles.brandSection}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Bawaa Pharmacy</Text>
            <Text style={styles.appTagline}>Medical Billing & Inventory Management</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                id="email-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  id="password-input"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
                >
                  <Text style={styles.passwordToggleText}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              id="login-btn"
            >
              <Text style={styles.loginBtnText}>
                {loading ? "Signing In…" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation.navigate("Signup")}
          >
            <Text style={styles.signupLinkText}>
              Don't have an account?{" "}
              <Text style={styles.signupLinkHighlight}>Create one →</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>Bawaa Pharmacy • Tirupur</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  skipBtn: {
    position: "absolute",
    top: SAFE_TOP,
    right: Spacing.lg,
    zIndex: 10,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },

  skipText: {
    color: Colors.highlight,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: SAFE_TOP + Spacing.xl,
    paddingBottom: Spacing.xl,
  },

  brandSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },

  logoWrapper: {
    width: 84,
    height: 84,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },

  logo: {
    width: 84,
    height: 84,
  },

  appName: {
    fontSize: 28,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },

  appTagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 18,
  },

  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
    ...Shadow.md,
  },

  cardTitle: {
    fontSize: FontSize.titleLg,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  cardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

  inputGroup: {
    marginBottom: Spacing.md,
  },

  inputLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: FontSize.body,
    minHeight: 48,
  },

  passwordWrapper: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: 50,
  },

  passwordToggle: {
    position: "absolute",
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  passwordToggleText: {
    fontSize: 17,
  },

  loginBtn: {
    backgroundColor: Colors.highlight,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },

  loginBtnDisabled: { opacity: 0.7 },

  loginBtnText: {
    color: "#0F172A",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.bodyLg,
    letterSpacing: 0.5,
  },

  signupLink: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },

  signupLinkText: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },

  signupLinkHighlight: {
    color: Colors.highlight,
    fontWeight: FontWeight.semibold,
  },

  footer: {
    textAlign: "center",
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    letterSpacing: 0.5,
  },
});
