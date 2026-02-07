import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../constants/styles";
import { fetchStats } from "../services/api";

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ totalMedicines: 0, invoicesToday: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) {
          Alert.alert("Error", err.message || "Failed to load dashboard");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Top Stats Bar */}
      <View style={styles.statsBar}>
        {loading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color={Colors.textPrimary} />
            <Text style={styles.statsLoadingText}>Loading…</Text>
          </View>
        ) : (
          <>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalMedicines}</Text>
              <Text style={styles.statLabel}>Total Medicines</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.invoicesToday}</Text>
              <Text style={styles.statLabel}>Invoices Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, stats.lowStockCount > 0 && styles.statValueWarning]}>
                {stats.lowStockCount}
              </Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </View>
          </>
        )}
      </View>

      {/* Brand Section */}
      <View style={styles.brandSection}>
        <Text style={styles.brandTitle}>Bawaa Pharmacy</Text>
        <Text style={styles.brandSubtitle}>
          Medical Billing & Inventory
        </Text>
      </View>

      {/* Main Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.mainCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Medicines")}
        >
          <Text style={styles.cardIcon}>💊</Text>
          <Text style={styles.cardTitle}>Medicine Inventory</Text>
          <Text style={styles.cardDesc}>
            Monitor stock levels and pricing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Billing")}
        >
          <Text style={styles.cardIcon}>🧾</Text>
          <Text style={styles.cardTitle}>Create Invoice</Text>
          <Text style={styles.cardDesc}>
            GST billing with instant preview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("InvoiceHistory")}
        >
          <Text style={styles.cardIcon}>📋</Text>
          <Text style={styles.cardTitle}>Invoice History</Text>
          <Text style={styles.cardDesc}>
            View and reprint past invoices
          </Text>
        </TouchableOpacity>

        {/* ADC Feature Button */}
        <TouchableOpacity
          style={styles.adcButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("PdfToAdc")}
        >
          <Text style={styles.adcButtonText}>
            Generate ADC Sheet from PDF
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footerText}>
        Bawaa Pharmacy • Tirupur
      </Text>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },

  /* Stats Bar */
  statsBar: {
    marginTop: 50,
    flexDirection: "row",
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.accent,
  },

  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },

  statsLoading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statsLoadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  statValueWarning: {
    color: Colors.warning,
  },

  /* Branding */
  brandSection: {
    marginTop: 40,
  },

  brandTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 3,
  },

  brandSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    maxWidth: 260,
  },

  /* Actions */
  actionsContainer: {
    marginTop: 40,
  },

  mainCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  cardIcon: {
    fontSize: 32,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },

  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  adcButton: {
    marginTop: 10,
    backgroundColor: Colors.textPrimary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },

  adcButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },

  /* Footer */
  footerText: {
    marginTop: "auto",
    marginBottom: 28,
    textAlign: "center",
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
});
