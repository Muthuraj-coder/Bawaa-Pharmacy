import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import Colors from "../constants/styles";
import { Spacing, FontSize, FontWeight, Radius, Shadow, SAFE_TOP } from "../constants/theme";
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

  const filteredVariants = variants.filter((item) => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return true;
    const haystack = [item.genericName, item.brandName, item.dosage, item.form, item.packing]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  const renderItem = ({ item, index }) => {
    const isLowStock = item.quantity <= item.minThreshold;
    const isEven = index % 2 === 0;

    return (
      <TouchableOpacity
        style={[styles.card, isEven ? styles.cardEven : styles.cardOdd]}
        activeOpacity={0.82}
      >
        {/* Card Header */}
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.medicineName}>{item.genericName}</Text>
            <Text style={styles.brandName}>
              {item.brandName} • {item.dosage} • {item.form}
            </Text>
            <Text style={styles.packingText}>Batch: {item.batchNumber} • Pack: {item.packing}</Text>
          </View>
          <View style={styles.cardTopRight}>
            <Text style={styles.price}>₹{item.sellingPrice}</Text>
            <Text style={styles.priceLabel}>Selling Price</Text>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardBottom}>
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeLabel}>Stock: </Text>
            <Text style={[styles.stockBadgeValue, { color: isLowStock ? Colors.warning : Colors.accent }]}>
              {item.quantity} units
            </Text>
          </View>
          {isLowStock && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.alertText}>Low Stock</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>💊</Text>
        <Text style={styles.emptyTitle}>No Medicines Found</Text>
        <Text style={styles.emptySubtitle}>
          {inventorySearch ? "Try a different search term." : "Tap '+ Add Medicine Stock' to get started."}
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
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
          <View>
            <Text style={styles.title}>Medicine Inventory</Text>
            <Text style={styles.subtitle}>
              {variants.length} item{variants.length !== 1 ? "s" : ""} • Track stock & expiry
            </Text>
          </View>
        </View>
      </View>

      {/* Low Stock Alert Banner */}
      {lowStock.length > 0 && (
        <View style={styles.lowStockBanner}>
          <Text style={styles.lowStockBannerIcon}>⚠️</Text>
          <Text style={styles.lowStockBannerText}>
            {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} running low on stock
          </Text>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by brand, generic, dosage..."
          placeholderTextColor={Colors.textSecondary}
          value={inventorySearch}
          onChangeText={setInventorySearch}
        />
        {inventorySearch.length > 0 && (
          <TouchableOpacity onPress={() => setInventorySearch("")} hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Medicine List */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.highlight} />
          <Text style={styles.loadingText}>Loading medicines…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVariants}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadMedicines}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.fab}
        onPress={() => navigation.navigate("AddMedicine")}
        id="add-medicine-fab"
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
  },

  header: {
    paddingTop: SAFE_TOP,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  backBtn: {
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
    paddingRight: Spacing.base,
    paddingVertical: Spacing.xs,
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

  title: {
    fontSize: FontSize.titleLg,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
  },

  subtitle: {
    fontSize: FontSize.subtitle,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  lowStockBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    gap: Spacing.sm,
  },

  lowStockBannerIcon: {
    fontSize: 16,
  },

  lowStockBannerText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    minHeight: 46,
    gap: Spacing.sm,
  },

  searchIcon: {
    fontSize: 16,
  },

  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    paddingVertical: Spacing.sm,
  },

  clearSearch: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 90,
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

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },

  cardTopLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },

  medicineName: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },

  brandName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },

  packingText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  cardTopRight: {
    alignItems: "flex-end",
  },

  price: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: Colors.highlight,
  },

  priceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
  },

  stockBadgeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  stockBadgeValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    gap: 4,
  },

  alertIcon: {
    fontSize: 12,
  },

  alertText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: FontWeight.bold,
  },

  emptyState: {
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

  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },

  loadingText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },

  fab: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    backgroundColor: Colors.highlight,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadow.lg,
  },

  fabText: {
    color: "#0F172A",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.body,
    letterSpacing: 0.5,
  },
});
