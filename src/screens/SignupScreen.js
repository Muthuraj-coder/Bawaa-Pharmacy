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
import { signup } from "../services/api";

const SignupScreen = ({ navigation }) => {
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("Small");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!companyName || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    setLoading(true);
    try {
      await signup({ company_name: companyName, company_type: companyType, email, password });
      Alert.alert("Success", "Account created successfully");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Signup Failed", error.message);
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
        id="skip-signup-btn"
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
            <Text style={styles.appTagline}>Create your pharmacy account</Text>
          </View>

          {/* Signup Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>Fill in your pharmacy details to get started</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company / Pharmacy Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bawaa Pharmacy"
                placeholderTextColor={Colors.textSecondary}
                value={companyName}
                onChangeText={setCompanyName}
                id="company-name-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company Type</Text>
              <View style={styles.companyTypeRow}>
                {["Small", "Medium", "Large"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeBtn, companyType === type && styles.typeBtnActive]}
                    onPress={() => setCompanyType(type)}
                  >
                    <Text style={[styles.typeBtnText, companyType === type && styles.typeBtnTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

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
                id="signup-email-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  id="signup-password-input"
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
              style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
              onPress={handleSignup}
              disabled={loading}
              id="create-account-btn"
            >
              <Text style={styles.signupBtnText}>
                {loading ? "Creating Account…" : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{" "}
              <Text style={styles.loginLinkHighlight}>Sign In →</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>Bawaa Pharmacy • Tirupur</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default SignupScreen;

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
    marginBottom: Spacing.lg,
  },

  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },

  logo: {
    width: 72,
    height: 72,
  },

  appName: {
    fontSize: 26,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },

  appTagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
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

  companyTypeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  typeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },

  typeBtnActive: {
    borderColor: Colors.highlight,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },

  typeBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },

  typeBtnTextActive: {
    color: Colors.highlight,
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

  passwordToggleText: { fontSize: 17 },

  signupBtn: {
    backgroundColor: Colors.highlight,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },

  signupBtnDisabled: { opacity: 0.7 },

  signupBtnText: {
    color: "#0F172A",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.bodyLg,
    letterSpacing: 0.5,
  },

  loginLink: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },

  loginLinkText: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },

  loginLinkHighlight: {
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
