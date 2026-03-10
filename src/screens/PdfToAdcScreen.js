import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "../constants/styles";
import { Spacing, FontSize, FontWeight, Radius, Shadow, SAFE_TOP } from "../constants/theme";
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

      if (!responseData.items || responseData.items.length === 0) {
        Alert.alert("Notice", "No items found in PDF to convert.");
        return;
      }

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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerTextGroup}>
            <Text style={styles.screenTitle}>PDF to ADC Sheet</Text>
            <Text style={styles.screenSubtitle}>Bawaa Pharmacy • Import Invoice</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>ℹ️</Text>
          <Text style={styles.infoBannerText}>
            Upload a supplier invoice PDF to extract medicine details and generate an ADC Excel sheet.
          </Text>
        </View>

        {/* Upload Card */}
        <View style={styles.uploadCard}>
          {uploading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.highlight} />
              <Text style={styles.loadingTitle}>Processing Invoice…</Text>
              <Text style={styles.loadingSubtitle}>
                Extracting medicine data from PDF. This may take a moment.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.uploadIconWrapper}>
                <Text style={styles.uploadIcon}>📄</Text>
              </View>

              <Text style={styles.uploadTitle}>Select PDF Invoice</Text>
              <Text style={styles.uploadSubtext}>
                Supported: Supplier export invoices in PDF format
              </Text>

              <TouchableOpacity
                style={styles.uploadButton}
                activeOpacity={0.85}
                onPress={handleSelectPdf}
                id="select-pdf-button"
              >
                <Text style={styles.uploadButtonText}>📂  Browse & Upload PDF</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Steps Guide */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>How it works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
            <Text style={styles.stepText}>Select a supplier PDF invoice</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
            <Text style={styles.stepText}>Review & edit parsed data</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
            <Text style={styles.stepText}>Export clean ADC Excel sheet</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

export default PdfToAdcScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: SAFE_TOP,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
  },

  backBtn: {
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.base,
  },

  backBtnText: {
    color: Colors.highlight,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },

  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: Radius.sm,
  },

  headerTextGroup: {
    flex: 1,
  },

  screenTitle: {
    fontSize: FontSize.titleLg,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
  },

  screenSubtitle: {
    fontSize: FontSize.subtitle,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    justifyContent: "center",
    gap: Spacing.base,
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  infoBannerIcon: {
    fontSize: 16,
    lineHeight: 20,
  },

  infoBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.highlight,
    lineHeight: 18,
  },

  uploadCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },

  loadingState: {
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },

  loadingTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },

  loadingSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },

  uploadIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.base,
  },

  uploadIcon: {
    fontSize: 36,
  },

  uploadTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },

  uploadSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },

  uploadButton: {
    backgroundColor: Colors.highlight,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: "center",
    minWidth: 220,
    ...Shadow.sm,
  },

  uploadButtonText: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: "#0F172A",
    letterSpacing: 0.5,
  },

  stepsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },

  stepsTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    backgroundColor: Colors.highlight,
    alignItems: "center",
    justifyContent: "center",
  },

  stepNum: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: "#0F172A",
  },

  stepText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
});
