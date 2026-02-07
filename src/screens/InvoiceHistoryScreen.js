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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../constants/styles";
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
    setAppliedFilters({
      sort,
      fromDate,
      toDate,
      customerName,
      invoiceNumber,
    });
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

  const onInvoicePress = (inv) => {
    navigation.navigate("Invoice", { invoiceId: inv._id });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onInvoicePress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.invNumber}>{item.invoiceNumber || "—"}</Text>
        <Text style={styles.customer}>
          {item.customerName || "Walk-in Customer"}
        </Text>
        <Text style={styles.date}>{formatDate(item.invoiceDate)}</Text>
      </View>
      <Text style={styles.amount}>₹{Number(item.totalAmount || 0).toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Invoice History</Text>
        <Text style={styles.subtitle}>Bawaa Pharmacy • Tap to view or reprint</Text>
      </View>

      <View style={styles.filterCard}>
        <Text style={styles.filterCardTitle}>Filters</Text>

        <Text style={styles.filterLabel}>Customer name</Text>
        <TextInput
          style={styles.filterInput}
          placeholder="Search by customer name"
          placeholderTextColor={Colors.textSecondary}
          value={customerName}
          onChangeText={setCustomerName}
        />

        <Text style={styles.filterLabel}>Invoice number</Text>
        <TextInput
          style={styles.filterInput}
          placeholder="e.g. INV-20250205-0001"
          placeholderTextColor={Colors.textSecondary}
          value={invoiceNumber}
          onChangeText={setInvoiceNumber}
        />

        <Text style={styles.filterLabel}>Date range</Text>
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

        <Text style={styles.filterLabel}>Sort</Text>
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.filterBtn, sort === "dateDesc" && styles.filterBtnActive]}
            onPress={() => setSort("dateDesc")}
          >
            <Text style={[styles.filterBtnText, sort === "dateDesc" && styles.filterBtnTextActive]}>
              Newest first
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, sort === "dateAsc" && styles.filterBtnActive]}
            onPress={() => setSort("dateAsc")}
          >
            <Text style={[styles.filterBtnText, sort === "dateAsc" && styles.filterBtnTextActive]}>
              Oldest first
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={applyFilters} disabled={loading}>
          <Text style={styles.applyBtnText}>{loading ? "Loading…" : "Apply filters"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.textPrimary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadInvoices(appliedFilters)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No invoices found</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 12,
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
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  filterCard: {
    marginHorizontal: 22,
    marginBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 10,
    marginBottom: 4,
  },
  filterInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInput: {
    flex: 1,
  },
  sortRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  filterBtnActive: {
    borderColor: Colors.highlight,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  filterBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  filterBtnTextActive: {
    color: Colors.highlight,
  },
  applyBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.highlight,
    alignItems: "center",
  },
  applyBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowLeft: {
    flex: 1,
  },
  invNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  customer: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.accent,
  },
  errorText: {
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.highlight,
    borderRadius: 10,
  },
  retryBtnText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
