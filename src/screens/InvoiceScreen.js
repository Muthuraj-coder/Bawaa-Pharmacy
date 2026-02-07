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
} from "react-native";
import Colors from "../constants/styles";
import { getInvoice } from "../services/api";
import { generateAndShareInvoicePdf } from "../utils/invoicePdf";

const InvoiceScreen = ({ route }) => {
  const invoiceId = route?.params?.invoiceId;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!!invoiceId);
  const [error, setError] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setInvoice(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getInvoice(invoiceId)
      .then((data) => {
        if (!cancelled) {
          setInvoice(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load invoice");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [invoiceId]);

  const customerName =
    invoice?.customerName ?? route?.params?.customerName ?? "Walk-in Customer";

  const gstLabel = (kind) => {
    if (!invoice?.items?.length) return kind;
    const rates = [...new Set(invoice.items.map((it) => it.gstRate))];
    if (rates.length !== 1) return kind;
    const pct = rates[0] / 2;
    return `${kind} (${pct}%)`;
  };

  const handleDownloadSharePdf = async () => {
    if (!invoice) {
      Alert.alert("Error", "No invoice data to generate PDF");
      return;
    }
    setPdfBusy(true);
    try {
      await generateAndShareInvoicePdf(invoice);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to generate PDF");
    } finally {
      setPdfBusy(false);
    }
  };

  if (invoiceId && loading) {
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={[styles.container, styles.centered]}
      >
        <ActivityIndicator size="large" color={Colors.textPrimary} />
      </LinearGradient>
    );
  }

  if (invoiceId && error) {
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={[styles.container, styles.centered]}
      >
        <Text style={styles.errorText}>{error}</Text>
      </LinearGradient>
    );
  }

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
        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.subtitle}>
          {invoice?.invoiceNumber ? `Bill ${invoice.invoiceNumber}` : "Bawaa Pharmacy invoice"}
        </Text>
      </View>

      <View style={styles.invoiceCard}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>LOGO</Text>
        </View>

        <Text style={styles.shopName}>Bawaa Pharmacy</Text>
        <Text style={styles.shopSub}>
          Tirupur
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{customerName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Invoice No</Text>
          <Text style={styles.value}>{invoice?.invoiceNumber ?? "—"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {invoice?.invoiceDate
              ? new Date(invoice.invoiceDate).toLocaleDateString()
              : "—"}
          </Text>
        </View>

        <View style={styles.divider} />

        {(invoice?.items?.length ?? 0) > 0 ? (
          invoice.items.map((it, idx) => {
            const totalItemTax = (it.cgstAmount || 0) + (it.sgstAmount || 0);
            return (
              <View key={idx} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.item}>
                    {it.brandName} {it.dosage}
                  </Text>
                  <Text style={styles.itemSub}>
                    HSN:{it.hsnCode || "3004"} | GST:{it.gstRate}% | Qty:{it.quantity}
                  </Text>
                  <Text style={styles.itemSub}>
                    Taxable: ₹{it.taxableValue?.toFixed(2)} | Tax: ₹{totalItemTax.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  ₹{(it.lineTotal - (it.discountAmount || 0)).toFixed(2)}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={styles.itemRow}>
            <Text style={styles.item}>No items</Text>
            <Text style={styles.itemPrice}>—</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Subtotal (Inc. GST)</Text>
          <Text style={styles.value}>
            ₹{invoice?.subTotal?.toFixed(2) ?? "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Taxable Amount</Text>
          <Text style={styles.value}>
            ₹{invoice?.taxableAmount?.toFixed(2) ?? "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{gstLabel("CGST")}</Text>
          <Text style={styles.value}>
            ₹{invoice?.cgst?.toFixed(2) ?? "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{gstLabel("SGST")}</Text>
          <Text style={styles.value}>
            ₹{invoice?.sgst?.toFixed(2) ?? "—"}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>
            ₹{invoice?.totalAmount?.toFixed(2) ?? "—"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={handleDownloadSharePdf}
        disabled={!invoice || pdfBusy}
      >
        <Text style={styles.buttonText}>
          {pdfBusy ? "Generating…" : "Reprint / Share PDF"}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default InvoiceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "space-between",
  },

  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    color: Colors.textPrimary,
    fontSize: 14,
  },

  header: {
    marginTop: 56,
    paddingBottom: 8,
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
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },

  invoiceCard: {
    marginTop: 30,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  logoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  logoText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  shopName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
  },

  shopSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },

  label: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  value: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },

  item: {
    fontSize: 13,
    color: Colors.textPrimary,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  itemSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.accent,
  },

  button: {
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: Colors.textPrimary,
  },

  buttonText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
});
