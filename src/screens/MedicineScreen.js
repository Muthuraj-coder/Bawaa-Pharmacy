import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import Colors from "../constants/styles";
import {
  fetchMedicinesWithVariants,
  fetchLowStockMedicines,
} from "../services/api";

const MedicineScreen = ({ navigation }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [lowStock, setLowStock] = useState([]);

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const [data, lowStockData] = await Promise.all([
        fetchMedicinesWithVariants(),
        fetchLowStockMedicines().catch((err) => {
          console.error("Failed to load low stock medicines:", err);
          return [];
        }),
      ]);

      // Flatten to variant-level list
      const flattened = [];
      data.forEach(({ medicine, variants }) => {
        variants.forEach((v) => {
          flattened.push({
            id: v._id,
            genericName: medicine.name,
            category: medicine.category,
            brandName: v.brandName,
            dosage: v.dosage,
            form: v.form,
            packing: v.packing,
            batchNumber: v.batchNumber,
            expiryDate: v.expiryDate,
            sellingPrice: v.sellingPrice,
            quantity: v.quantity,
            minThreshold: v.minThreshold,
          });
        });
      });

      setVariants(flattened);
      setLowStock(lowStockData || []);
    } catch (err) {
      console.error("Failed to load medicines:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [loadMedicines])
  );

  const renderItem = ({ item }) => {
    const isLowStock = item.quantity <= item.minThreshold;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.medicineName}>{item.genericName}</Text>
            <Text style={styles.brandName}>
              {item.brandName} • {item.dosage} • {item.form} • {item.packing}
            </Text>
          </View>
          <Text style={styles.price}>₹ {item.sellingPrice}</Text>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Stock</Text>
            <Text
              style={[
                styles.stockValue,
                { color: isLowStock ? Colors.warning : Colors.accent },
              ]}
            >
              {item.quantity}
            </Text>
          </View>

          {isLowStock && (
            <View style={styles.alertRow}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.alertText}>Low Stock</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredVariants = variants.filter((item) => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      item.genericName,
      item.brandName,
      item.dosage,
      item.form,
      item.packing,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Medicine Inventory</Text>
        <Text style={styles.subtitle}>
          Bawaa Pharmacy • Track stock levels and expiry
        </Text>
      </View>

      {/* Low Stock Warnings */}
      {lowStock.length > 0 && (
        <View style={styles.lowStockBox}>
          <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
          {lowStock.map((item) => (
            <Text key={item._id} style={styles.lowStockText}>
              Low Stock: {item.brandName} {item.dosage} ({item.quantity} left)
            </Text>
          ))}
        </View>
      )}

      {/* Inventory Search */}
      <TextInput
        style={styles.input}
        placeholder="Search inventory (brand / generic / dosage)"
        placeholderTextColor={Colors.textSecondary}
        value={inventorySearch}
        onChangeText={setInventorySearch}
      />

      {/* Medicine List */}
      <FlatList
        data={filteredVariants}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshing={loading}
        onRefresh={loadMedicines}
      />

      {/* Add Stock FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.fab}
        onPress={() => navigation.navigate("AddMedicine")}
      >
        <Text style={styles.fabText}>+ Add Medicine Stock</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default MedicineScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },

  header: {
    marginTop: 60,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },

  addBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 10,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },

  dropdown: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    maxHeight: 180,
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  dropdownText: {
    color: Colors.textPrimary,
    fontSize: 13,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },

  fieldLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  half: {
    width: "48%",
  },

  addButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },

  addButtonText: {
    textAlign: "center",
    fontWeight: "700",
    color: Colors.primary,
  },

  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  medicineName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  price: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.highlight,
  },

  brandName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  stockRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  stockLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 6,
  },

  stockValue: {
    fontSize: 16,
    fontWeight: "800",
  },

  alertRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  alertIcon: {
    fontSize: 14,
    marginRight: 4,
  },

  alertText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: "600",
  },

  lowStockBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },

  lowStockText: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 4,
  },

  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    backgroundColor: Colors.textPrimary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  fabText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});

