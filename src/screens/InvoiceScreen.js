import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from "react-native";
import Colors from "../constants/styles";
import { Spacing, FontSize, FontWeight, Radius, Shadow, SAFE_TOP } from "../constants/theme";
import { getInvoice } from "../services/api";
import { generateAndShareInvoicePdf } from "../utils/invoicePdf";

const InvoiceScreen = ({ route, navigation }) => {
  const invoiceId = route?.params?.invoiceId;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!!invoiceId);
  const [error, setError] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!invoiceId) { setInvoice(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    getInvoice(invoiceId)
      .then((data) => { if (!cancelled) { setInvoice(data); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message || "Failed to load invoice"); setLoading(false); } });
    return () => { cancelled = true; };
  }, [invoiceId]);

  const customerName = invoice?.customerName ?? route?.params?.customerName ?? "Walk-in Customer";

  const gstLabel = (kind) => {
    if (!invoice?.items?.length) return kind;
    const rates = [...new Set(invoice.items.map((it) => it.gstRate))];
    if (rates.length !== 1) return kind;
    return `${kind} (${rates[0] / 2}%)`;
  };

  const handleDownloadSharePdf = async () => {
    if (!invoice) { Alert.alert("Error", "No invoice data to generate PDF"); return; }
    setPdfBusy(true);
    try { await generateAndShareInvoicePdf(invoice); }
    catch (err) { Alert.alert("Error", err.message || "Failed to generate PDF"); }
    finally { setPdfBusy(false); }
  };

  if (invoiceId && loading) {
    return (
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors.highlight} />
        <Text style={styles.loadingText}>Loading invoice…</Text>
      </LinearGradient>
    );
  }

  if (invoiceId && error) {
    return (
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.centeredContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </LinearGradient>
    );
  }

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
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.subtitle}>
              {invoice?.invoiceNumber ? `Bill ${invoice.invoiceNumber}` : "Bawaa Pharmacy invoice"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Invoice Card */}
        <View style={styles.invoiceCard}>
          {/* Shop Header */}
          <View style={styles.shopHeader}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.shopLogo}
              resizeMode="contain"
            />
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>BAWAA PHARMACY</Text>
              <Text style={styles.shopDetail}>346, Avinashi Road, Pushpa Theatre Bus Stop</Text>
              <Text style={styles.shopDetail}>Tirupur 641604</Text>
              <Text style={styles.shopDetail}>Ph: 0421 2200313, 9442160313</Text>
              <Text style={styles.shopDetail}>GST: 33AAKFB1720E1Z3</Text>
              <Text style={styles.shopDetail}>DL. Nos.: CBE/8587 20&21, CBE/5522 20B</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Customer Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{customerName}</Text>
            </View>
            {invoice?.doctorName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Doctor</Text>
                <Text style={styles.infoValue}>{invoice.doctorName}</Text>
              </View>
            )}
            {invoice?.hospitalName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hospital</Text>
                <Text style={styles.infoValue}>{invoice.hospitalName}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice No.</Text>
              <Text style={styles.infoValue}>{invoice?.invoiceNumber ?? "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {invoice?.invoiceDate
                  ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })
                  : "—"}
              </Text>
            </View>
            {invoice?.paymentMode && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment</Text>
                <View style={styles.paymentModeBadge}>
                  <Text style={styles.paymentModeText}>{invoice.paymentMode}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Line Items */}
          <Text style={styles.itemsHeader}>Items</Text>
          {(invoice?.items?.length ?? 0) > 0 ? (
            invoice.items.map((it, idx) => {
              const totalItemTax = (it.cgstAmount || 0) + (it.sgstAmount || 0);
              const isEven = idx % 2 === 0;
              return (
                <View key={idx} style={[styles.itemRow, isEven ? styles.itemRowEven : styles.itemRowOdd]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{it.brandName} {it.dosage}</Text>
                    <Text style={styles.itemSub}>
                      HSN: {it.hsnCode || "3004"} • GST: {it.gstRate}% • Qty: {it.quantity}
                    </Text>
                    <Text style={styles.itemSub}>
                      Taxable: ₹{it.taxableValue?.toFixed(2)} • Tax: ₹{totalItemTax.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    ₹{(it.lineTotal - (it.discountAmount || 0)).toFixed(2)}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.noItemsRow}>
              <Text style={styles.noItemsText}>No items in this invoice.</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{invoice?.items?.length ?? 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{gstLabel("SGST")}</Text>
              <Text style={styles.summaryValue}>₹{invoice?.sgst?.toFixed(2) ?? "0.00"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{gstLabel("CGST")}</Text>
              <Text style={styles.summaryValue}>₹{invoice?.cgst?.toFixed(2) ?? "0.00"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>₹{invoice?.discountAmount?.toFixed(2) ?? "0.00"}</Text>
            </View>
          </View>

          {/* Total Banner */}
          <View style={styles.totalBanner}>
            <Text style={styles.totalBannerLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalBannerValue}>₹{invoice?.totalAmount?.toFixed(2) ?? "0.00"}</Text>
          </View>
        </View>

        {/* PDF Button */}
        <TouchableOpacity
          style={[styles.pdfButton, (!invoice || pdfBusy) && styles.pdfButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleDownloadSharePdf}
          disabled={!invoice || pdfBusy}
          id="share-pdf-button"
        >
          {pdfBusy ? (
            <View style={styles.pdfBtnContent}>
              <ActivityIndicator size="small" color="#0F172A" />
              <Text style={styles.pdfButtonText}>Generating PDF…</Text>
            </View>
          ) : (
            <Text style={styles.pdfButtonText}>📤  Reprint / Share PDF</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

export default InvoiceScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },

  errorIcon: { fontSize: 36 },

  errorText: {
    color: Colors.warning,
    fontSize: FontSize.body,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
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

  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },

  invoiceCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
  },

  shopHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },

  shopLogo: {
    width: 58,
    height: 58,
    borderRadius: Radius.sm,
    flexShrink: 0,
  },

  shopInfo: {
    flex: 1,
  },

  shopName: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },

  shopDetail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  infoGrid: {
    gap: Spacing.sm,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: "right",
    flex: 1,
    paddingLeft: Spacing.md,
  },

  paymentModeBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
  },

  paymentModeText: {
    fontSize: FontSize.xs,
    color: Colors.highlight,
    fontWeight: FontWeight.bold,
  },

  itemsHeader: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },

  itemRowEven: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  itemRowOdd: {
    backgroundColor: "transparent",
  },

  itemName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },

  itemSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  itemPrice: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },

  noItemsRow: {
    paddingVertical: Spacing.base,
    alignItems: "center",
  },

  noItemsText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },

  summarySection: {
    gap: Spacing.sm,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  totalBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.25)",
  },

  totalBannerLabel: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    letterSpacing: 0.5,
  },

  totalBannerValue: {
    fontSize: 22,
    fontWeight: FontWeight.black,
    color: Colors.accent,
  },

  pdfButton: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.highlight,
    alignItems: "center",
    ...Shadow.sm,
  },

  pdfButtonDisabled: { opacity: 0.6 },

  pdfBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  pdfButtonText: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: "#0F172A",
    letterSpacing: 0.5,
  },
});
