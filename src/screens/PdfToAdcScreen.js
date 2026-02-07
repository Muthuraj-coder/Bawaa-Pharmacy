import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../constants/styles";

const PdfToAdcScreen = ({ navigation }) => {
  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Title Section */}
      <View style={styles.header}>
        {navigation?.goBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          PDF to ADC Sheet
        </Text>
        <Text style={styles.subtitle}>
          Bawaa Pharmacy • Convert invoices to ADC Excel
        </Text>
      </View>

      {/* Upload Card */}
      <View style={styles.uploadCard}>
        <Text style={styles.uploadIcon}>📄</Text>

        <Text style={styles.uploadText}>
          Upload your PDF here
        </Text>

        <TouchableOpacity
          style={styles.uploadButton}
          activeOpacity={0.85}
        >
          <Text style={styles.uploadButtonText}>
            Select PDF
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer Note */}
      <Text style={styles.footerText}>
        * Feature will be enabled in next phase
      </Text>
    </LinearGradient>
  );
};

export default PdfToAdcScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 40,
  },

  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  backBtnText: {
    color: Colors.highlight,
    fontSize: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
    maxWidth: 280,
  },

  uploadCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 22,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  uploadIcon: {
    fontSize: 46,
    marginBottom: 14,
  },

  uploadText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  uploadButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 18,
  },

  uploadButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },

  footerText: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
