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
import { signup } from "../services/api";

const SignupScreen = ({ navigation }) => {
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("Small");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!companyName || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);
    try {
      await signup({
        company_name: companyName,
        company_type: companyType,
        email,
        password,
      });

      Alert.alert("Success", "Account created successfully");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Signup Failed", error.message);
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
        Create your account
      </Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Company Name"
          placeholderTextColor={Colors.textSecondary}
          value={companyName}
          onChangeText={setCompanyName}
        />

        <TextInput
          style={styles.input}
          placeholder="Company Type (Small / Medium / Large)"
          placeholderTextColor={Colors.textSecondary}
          value={companyType}
          onChangeText={setCompanyType}
        />

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
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating..." : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default SignupScreen;

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
