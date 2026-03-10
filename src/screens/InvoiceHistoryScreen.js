import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../constants/styles";
import { Spacing, FontSize, FontWeight, Radius, Shadow, SAFE_TOP } from "../constants/theme";
import { fetchInvoices } from "../services/api";

const InvoiceHistoryScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("dateDesc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ sort: "dateDesc" });

  const loadInvoices = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const p = { sort: params.sort || "dateDesc" };
      if (params.fromDate) p.fromDate = params.fromDate;
      if (params.toDate) p.toDate = params.toDate;
      if (params.customerName?.trim()) p.customerName = params.customerName.trim();
      if (params.invoiceNumber?.trim()) p.invoiceNumber = params.invoiceNumber.trim();
      const data = await fetchInvoices(p);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ sort, fromDate, toDate, customerName, invoiceNumber });
  }, [sort, fromDate, toDate, customerName, invoiceNumber]);

  useEffect(() => {
    loadInvoices(appliedFilters);
  }, [appliedFilters, loadInvoices]);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item, index }) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        style={[styles.invoiceRow, isEven ? styles.rowEven : styles.rowOdd]}
        onPress={() => navigation.navigate("Invoice", { invoiceId: item._id })}
        activeOpacity={0.82}
      >
        <View style={styles.invoiceLeft}>
          <Text style={styles.invNumber}>{item.invoiceNumber || "—"}</Text>
          <Text style={styles.invCustomer}>{item.customerName || "Walk-in Customer"}</Text>
          <Text style={styles.invDate}>{formatDate(item.invoiceDate)}</Text>
        </View>
        <View style={styles.invoiceRight}>
          <Text style={styles.invAmount}>₹{Number(item.totalAmount || 0).toFixed(2)}</Text>
          <Text style={styles.invArrow}>›</Text>
        </View>
      </TouchableOpacity>
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
            <Text style={styles.title}>Invoice History</Text>
            <Text style={styles.subtitle}>Tap an invoice to view or reprint</Text>
          </View>
        </View>
      </View>

      {/* Filter Card */}
      <View style={styles.filterCard}>
        <Text style={styles.filterCardTitle}>🔍 Filter Invoices</Text>

        <View style={styles.filterRow}>
          <View style={styles.filterHalf}>
            <Text style={styles.filterLabel}>Customer Name</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Search..."
              placeholderTextColor={Colors.textSecondary}
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>
          <View style={styles.filterHalf}>
            <Text style={styles.filterLabel}>Invoice No.</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="INV-..."
              placeholderTextColor={Colors.textSecondary}
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
            />
          </View>
        </View>

        <Text style={styles.filterLabel}>Date Range</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.filterInput, styles.dateInput]}
            placeholder="From (YYYY-MM-DD)"
            placeholderTextColor={Colors.textSecondary}
            value={fromDate}
            onChangeText={setFromDate}
          />
          <TextInput
            style={[styles.filterInput, styles.dateInput]}
            placeholder="To (YYYY-MM-DD)"
            placeholderTextColor={Colors.textSecondary}
            value={toDate}
            onChangeText={setToDate}
          />
        </View>

        <Text style={styles.filterLabel}>Sort By</Text>
        <View style={styles.sortRow}>
          {[{ key: "dateDesc", label: "Newest First" }, { key: "dateAsc", label: "Oldest First" }].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortBtn, sort === opt.key && styles.sortBtnActive]}
              onPress={() => setSort(opt.key)}
            >
              <Text style={[styles.sortBtnText, sort === opt.key && styles.sortBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.applyBtn}
          onPress={applyFilters}
          disabled={loading}
          id="apply-filters-button"
        >
          <Text style={styles.applyBtnText}>{loading ? "Loading…" : "Apply Filters"}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.highlight} />
          <Text style={styles.stateText}>Loading invoices…</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadInvoices(appliedFilters)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.centeredState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Invoices Found</Text>
          <Text style={styles.stateText}>Try adjusting your filters or date range.</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </LinearGradient>
  );
};

export default InvoiceHistoryScreen;

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

  filterCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  filterCardTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },

  filterHalf: {
    flex: 1,
  },

  filterLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  filterInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
  },

  dateRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  dateInput: {
    flex: 1,
  },

  sortRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },

  sortBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },

  sortBtnActive: {
    borderColor: Colors.highlight,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },

  sortBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  sortBtnTextActive: {
    color: Colors.highlight,
  },

  applyBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.highlight,
    alignItems: "center",
  },

  applyBtnText: {
    color: "#0F172A",
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
  },

  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },

  invoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  rowEven: {
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  rowOdd: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  invoiceLeft: {
    flex: 1,
  },

  invNumber: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },

  invCustomer: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },

  invDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  invoiceRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },

  invAmount: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },

  invArrow: {
    fontSize: 22,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  emptyIcon: {
    fontSize: 48,
  },

  errorIcon: {
    fontSize: 36,
  },

  emptyTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },

  errorText: {
    color: Colors.warning,
    fontSize: FontSize.body,
    textAlign: "center",
  },

  stateText: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    textAlign: "center",
  },

  retryBtn: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.highlight,
    borderRadius: Radius.md,
  },

  retryBtnText: {
    color: "#0F172A",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.body,
  },
});
