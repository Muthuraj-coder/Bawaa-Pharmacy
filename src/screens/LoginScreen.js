import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import Colors from "../constants/styles";
import { login } from "../services/api";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

      // Distinguish between network / server reachability problems
      // and authentication failures (401/403).
      if (
        error?.message === "Network request failed" ||
        error?.name === "TypeError"
      ) {
        Alert.alert(
          "Network Error",
          "Unable to reach the server. Make sure the backend is running and your device/emulator is on the same network."
        );
      } else if (error?.status === 401 || error?.status === 403) {
        Alert.alert(
          "Authentication Failed",
          error.message || "Invalid email or password"
        );
      } else {
        Alert.alert("Login Failed", error.message || "Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* SKIP BUTTON */}
      <TouchableOpacity
        style={styles.skip}
        onPress={() => navigation.replace("Home")}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Bawaa Pharmacy</Text>
      <Text style={styles.subtitle}>
        Sign in to your account
      </Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.link}>
          Don’t have an account? Sign up
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  skip: {
    position: "absolute",
    top: 50,
    right: 24,
    zIndex: 10,
  },

  skipText: {
    color: Colors.highlight,
    fontSize: 14,
    fontWeight: "600",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },

  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },

  button: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
  },

  buttonText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },

  link: {
    color: Colors.highlight,
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
});


