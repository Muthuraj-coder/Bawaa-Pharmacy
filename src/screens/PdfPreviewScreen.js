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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Colors from "../constants/styles";
import { BASE_URL } from "../services/api";

const PdfPreviewScreen = ({ route, navigation }) => {
  const { items = [] } = route.params || {};
  const [editedItems, setEditedItems] = useState(items);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Initial sync
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
      
      console.log("Edited items:", editedItems);

      const response = await fetch(`${BASE_URL}/api/import/export-excel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: editedItems }),
      });

      if (!response.ok) {
        const text = await response.text();
        let message = "Failed to generate Excel Sheet";
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
        Alert.alert(
          "Error",
          "Unable to prepare Excel file on this device. Please try updating the app."
        );
        return;
      }

      const fileUri = `${FileSystem.cacheDirectory}ADC_Sheet_${Date.now()}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: "base64",
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Share ADC Sheet",
        });
      } else {
        Alert.alert("Success", `ADC Sheet saved to: ${fileUri}`);
      }
    } catch (err) {
      console.error("Export to Excel error:", err);
      Alert.alert(
        "Error",
        err.message || "Failed to export Excel. Please try again."
      );
    } finally {
      setExporting(false);
    }
  };

  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.card}>
        <View style={styles.slRow}>
          <Text style={styles.slText}>SL: {item.slNo}</Text>
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={String(item.description || "")}
          onChangeText={(val) => updateItem(index, "description", val)}
          multiline
        />

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={String(item.qty || "")}
              keyboardType="numeric"
              onChangeText={(val) => updateItem(index, "qty", val)}
            />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={String(item.amount || "")}
              keyboardType="numeric"
              onChangeText={(val) => updateItem(index, "amount", val)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Batch No</Text>
            <TextInput
              style={styles.input}
              value={String(item.batchNo || "")}
              onChangeText={(val) => updateItem(index, "batchNo", val)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Mfg Date</Text>
            <TextInput
              style={styles.input}
              value={String(item.mfdDate || "")}
              onChangeText={(val) => updateItem(index, "mfdDate", val)}
            />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Exp Date</Text>
            <TextInput
              style={styles.input}
              value={String(item.expDate || "")}
              onChangeText={(val) => updateItem(index, "expDate", val)}
            />
          </View>
        </View>
      </View>
    );
  };

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
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Invoice Preview</Text>
          <Text style={styles.subtitle}>
            Review and edit items before export
          </Text>
        </View>

        {/* List */}
        <FlatList
          data={editedItems}
          keyExtractor={(item, index) => String(item.slNo || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.exportButton}
            activeOpacity={0.85}
            onPress={exporting ? undefined : handleExportExcel}
          >
            {exporting ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.exportButtonText}>Export to Excel</Text>
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
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 8,
    paddingVertical: 5,
    paddingRight: 20,
  },
  backBtnText: {
    color: Colors.highlight,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slRow: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 6,
  },
  slText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.highlight,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  halfCol: {
    flex: 0.48,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primary,
  },
  exportButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
});
