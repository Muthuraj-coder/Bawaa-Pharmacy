import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../constants/styles";
import { BASE_URL } from "../services/api";

const PdfToAdcScreen = ({ navigation }) => {
  const [uploading, setUploading] = useState(false);

  const handleSelectPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets && result.assets[0];
      if (!asset) {
        Alert.alert("Error", "No file selected");
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.name || "invoice.pdf",
        type: asset.mimeType || "application/pdf",
      });

      const response = await fetch(`${BASE_URL}/api/import/parse-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        let message = "Failed to parse PDF";
        try {
          const parsed = JSON.parse(text);
          if (parsed && parsed.detail) {
            message = parsed.detail;
          }
        } catch (e) {
          if (text) message = text;
        }
        throw new Error(message);
      }

      const responseData = await response.json();
      console.log("Parsed items:", responseData.items);

      if (!responseData.items || responseData.items.length === 0) {
        Alert.alert("Notice", "No items found in PDF to convert.");
        return;
      }

      // Navigate to the preview screen
      navigation.navigate("PdfPreview", { items: responseData.items });

    } catch (err) {
      console.error("PDF to ADC error:", err);
      Alert.alert(
        "Error",
        err.message || "Failed to process PDF. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

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
          onPress={uploading ? undefined : handleSelectPdf}
        >
          {uploading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.uploadButtonText}>
              Select PDF
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
