import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../constants/styles";
import { Spacing, FontSize, FontWeight, Radius, Shadow, SAFE_TOP } from "../constants/theme";
import { fetchStats } from "../services/api";

const NAV_CARDS = [
  {
    id: "medicines",
    icon: "💊",
    title: "Medicine Inventory",
    desc: "Monitor stock levels, expiry & pricing",
    screen: "Medicines",
    accent: "#22C55E",
  },
  {
    id: "billing",
    icon: "🧾",
    title: "Create Invoice",
    desc: "GST billing with auto-calculated totals",
    screen: "Billing",
    accent: "#38BDF8",
  },
  {
    id: "history",
    icon: "📋",
    title: "Invoice History",
    desc: "View, search & reprint past invoices",
    screen: "InvoiceHistory",
    accent: "#F59E0B",
  },
];

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ totalMedicines: 0, invoicesToday: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => { if (!cancelled) Alert.alert("Error", err.message || "Failed to load dashboard"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const statItems = [
    { label: "Medicines", value: stats.totalMedicines, color: Colors.accent },
    { label: "Today", value: stats.invoicesToday, color: Colors.highlight },
    { label: "Low Stock", value: stats.lowStockCount, color: stats.lowStockCount > 0 ? Colors.warning : Colors.textSecondary },
  ];

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderLeft}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.appName}>Bawaa Pharmacy</Text>
              <Text style={styles.appTagline}>Medical Billing & Inventory</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          {loading ? (
            <View style={styles.statsLoading}>
              <ActivityIndicator size="small" color={Colors.highlight} />
              <Text style={styles.statsLoadingText}>Loading stats…</Text>
            </View>
          ) : (
            statItems.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {i < statItems.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))
          )}
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Welcome Back 👋</Text>
          <Text style={styles.heroSubtitle}>
            What would you like to manage today?
          </Text>
        </View>

        {/* Navigation Cards */}
        <View style={styles.cardsContainer}>
          {NAV_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.navCard}
              activeOpacity={0.82}
              onPress={() => navigation.navigate(card.screen)}
              id={`nav-card-${card.id}`}
            >
              <View style={[styles.navCardIconWrapper, { backgroundColor: `${card.accent}18` }]}>
                <Text style={styles.navCardIcon}>{card.icon}</Text>
              </View>
              <View style={styles.navCardText}>
                <Text style={styles.navCardTitle}>{card.title}</Text>
                <Text style={styles.navCardDesc}>{card.desc}</Text>
              </View>
              <Text style={[styles.navCardArrow, { color: card.accent }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ADC Feature Card */}
        <TouchableOpacity
          style={styles.adcCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("PdfToAdc")}
          id="nav-card-adc"
        >
          <View style={styles.adcCardLeft}>
            <Text style={styles.adcIcon}>📄</Text>
            <View>
              <Text style={styles.adcTitle}>Generate ADC Sheet</Text>
              <Text style={styles.adcDesc}>Convert PDF invoices → Excel</Text>
            </View>
          </View>
          <View style={styles.adcBadge}>
            <Text style={styles.adcBadgeText}>EXPORT</Text>
          </View>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>Bawaa Pharmacy • Tirupur • v1.0</Text>
      </ScrollView>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  /* Top Header */
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SAFE_TOP,
    marginBottom: Spacing.lg,
  },

  topHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  logo: {
    width: 50,
    height: 50,
    borderRadius: Radius.sm,
  },

  appName: {
    fontSize: FontSize.sectionTitle,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },

  appTagline: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  /* Stats */
  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 26,
    fontWeight: FontWeight.black,
  },

  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 3,
    letterSpacing: 0.3,
  },

  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },

  statsLoading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },

  statsLoadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },

  /* Hero */
  heroSection: {
    marginBottom: Spacing.lg,
  },

  heroTitle: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },

  heroSubtitle: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  /* Nav Cards */
  cardsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  navCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },

  navCardIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  navCardIcon: {
    fontSize: 26,
  },

  navCardText: {
    flex: 1,
  },

  navCardTitle: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },

  navCardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  navCardArrow: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    marginRight: Spacing.xs,
  },

  /* ADC Card */
  adcCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },

  adcCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },

  adcIcon: {
    fontSize: 28,
  },

  adcTitle: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  adcDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  adcBadge: {
    backgroundColor: Colors.highlight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },

  adcBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.black,
    color: "#0F172A",
    letterSpacing: 1,
  },

  /* Footer */
  footerText: {
    textAlign: "center",
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});
