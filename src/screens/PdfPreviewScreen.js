import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Colors from "../constants/styles";
import { Spacing, FontSize, FontWeight, Radius, Shadow, SAFE_TOP } from "../constants/theme";
import { BASE_URL } from "../services/api";

const FIELD_CONFIGS = [
  { key: "description", label: "Medicine Name", type: "text", span: "full", multiline: true },
  { key: "qty", label: "Qty", type: "numeric", span: "half" },
  { key: "amount", label: "Amount (₹)", type: "numeric", span: "half" },
  { key: "batchNo", label: "Batch No", type: "text", span: "half" },
  { key: "mfdDate", label: "MFG Date", type: "text", span: "half" },
  { key: "expDate", label: "Expiry Date", type: "text", span: "half" },
];

const PdfPreviewScreen = ({ route, navigation }) => {
  const { items = [] } = route.params || {};
  const [editedItems, setEditedItems] = useState(items);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setEditedItems(items);
  }, [items]);

  const updateItem = (index, field, value) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);

      const response = await fetch(`${BASE_URL}/api/import/export-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: editedItems }),
      });

      if (!response.ok) {
        const text = await response.text();
        let message = "Failed to generate Excel Sheet";
        try {
          const parsed = JSON.parse(text);
          if (parsed && parsed.detail) message = parsed.detail;
        } catch (e) {
          if (text) message = text;
        }
        throw new Error(message);
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      let binary = "";
      for (let i = 0; i < uint8.byteLength; i += 1) {
        binary += String.fromCharCode(uint8[i]);
      }

      const base64 =
        typeof global.btoa === "function"
          ? global.btoa(binary)
          : typeof Buffer !== "undefined"
          ? Buffer.from(binary, "binary").toString("base64")
          : null;

      if (!base64) {
        Alert.alert("Error", "Unable to prepare Excel file on this device.");
        return;
      }

      const fileUri = `${FileSystem.cacheDirectory}ADC_Sheet_${Date.now()}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: "base64" });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Share ADC Sheet",
        });
      } else {
        Alert.alert("Success", `ADC Sheet saved to: ${fileUri}`);
      }
    } catch (err) {
      console.error("Export to Excel error:", err);
      Alert.alert("Error", err.message || "Failed to export Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isEven = index % 2 === 0;
    return (
      <View style={[styles.card, isEven ? styles.cardEven : styles.cardOdd]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.slBadge}>
            <Text style={styles.slBadgeText}>#{item.slNo ?? index + 1}</Text>
          </View>
          <Text style={styles.cardHeaderLabel}>Medicine Entry</Text>
        </View>

        {/* Full-width: Medicine Name */}
        <Text style={styles.fieldLabel}>Medicine Name</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={String(item.description || "")}
          onChangeText={(val) => updateItem(index, "description", val)}
          multiline
          textAlignVertical="top"
          placeholder="Enter medicine name..."
          placeholderTextColor={Colors.textSecondary}
        />

        {/* Row: Qty + Amount */}
        <View style={styles.fieldRow}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Qty</Text>
            <TextInput
              style={styles.input}
              value={String(item.qty || "")}
              keyboardType="numeric"
              onChangeText={(val) => updateItem(index, "qty", val)}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={String(item.amount || "")}
              keyboardType="numeric"
              onChangeText={(val) => updateItem(index, "amount", val)}
              placeholder="0.00"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Row: Batch + MFG Date */}
        <View style={styles.fieldRow}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Batch No</Text>
            <TextInput
              style={styles.input}
              value={String(item.batchNo || "")}
              onChangeText={(val) => updateItem(index, "batchNo", val)}
              placeholder="e.g. BN2024"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>MFG Date</Text>
            <TextInput
              style={styles.input}
              value={String(item.mfdDate || "")}
              onChangeText={(val) => updateItem(index, "mfdDate", val)}
              placeholder="e.g. Jan-24"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Row: Expiry Date */}
        <View style={styles.fieldRow}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Expiry Date</Text>
            <TextInput
              style={styles.input}
              value={String(item.expDate || "")}
              onChangeText={(val) => updateItem(index, "expDate", val)}
              placeholder="e.g. Dec-26"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Items Found</Text>
      <Text style={styles.emptySubtitle}>
        The PDF did not produce any parseable medicine entries. Try a different invoice.
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
              <Text style={styles.screenTitle}>Invoice Preview</Text>
              <Text style={styles.screenSubtitle}>
                {editedItems.length} item{editedItems.length !== 1 ? "s" : ""} • Review before export
              </Text>
            </View>
          </View>
        </View>

        {/* List */}
        <FlatList
          data={editedItems}
          keyExtractor={(item, index) => String(item.slNo || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        />

        {/* Footer Export Button */}
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerSummaryText}>
              {editedItems.length} items ready to export
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            activeOpacity={0.85}
            onPress={exporting ? undefined : handleExportExcel}
            id="export-excel-button"
          >
            {exporting ? (
              <View style={styles.exportButtonContent}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.exportButtonText}>Generating Excel…</Text>
              </View>
            ) : (
              <Text style={styles.exportButtonText}>📊  Export to Excel</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default PdfPreviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: SAFE_TOP,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
  },

  headerTextGroup: {
    flex: 1,
  },

  screenTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
  },

  screenSubtitle: {
    fontSize: FontSize.subtitle,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
  },

  itemSeparator: {
    height: Spacing.md,
  },

  card: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  cardEven: {
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  cardOdd: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },

  slBadge: {
    backgroundColor: Colors.highlight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },

  slBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: "#0F172A",
  },

  cardHeaderLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },

  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },

  halfField: {
    flex: 0.48,
  },

  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.body,
    minHeight: 44,
  },

  textArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },

  emptyIcon: {
    fontSize: 52,
    marginBottom: Spacing.base,
  },

  emptyTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  footer: {
    padding: Spacing.base,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },

  footerSummary: {
    alignItems: "center",
  },

  footerSummaryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  exportButton: {
    backgroundColor: Colors.highlight,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },

  exportButtonDisabled: {
    opacity: 0.7,
  },

  exportButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  exportButtonText: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: "#0F172A",
    letterSpacing: 0.5,
  },
});
