import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import Colors from "../constants/styles";
import { Spacing, FontSize, FontWeight, Radius, Shadow, SAFE_TOP } from "../constants/theme";
import {
  createInvoice,
  fetchMedicinesWithVariants,
  getInvoicePreview,
} from "../services/api";
import { generateAndShareInvoicePdf } from "../utils/invoicePdf";

const BillingScreen = ({ navigation }) => {
  const [customerName, setCustomerName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => { loadMedicines(); }, []);

  useEffect(() => {
    if (cart.length === 0) { setPreview(null); setPreviewError(null); return; }
    let cancelled = false;
    setPreviewError(null);
    (async () => {
      try {
        const payload = {
          items: cart.map((item) => ({ medicineVariantId: item.medicineVariantId, quantity: item.quantity })),
          discountAmount: Number(discountAmount) || 0,
        };
        const data = await getInvoicePreview(payload);
        if (!cancelled) setPreview(data);
      } catch (err) {
        if (!cancelled) { setPreviewError(err.message || "Preview failed"); setPreview(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [cart, discountAmount]);

  useEffect(() => {
    if (!searchText.trim()) { setFilteredMedicines([]); return; }
    const q = searchText.trim().toLowerCase();
    const filtered = medicines.filter(
      (med) =>
        med.genericName.toLowerCase().includes(q) ||
        med.variants.some((v) => v.brandName.toLowerCase().includes(q))
    );
    setFilteredMedicines(filtered);
  }, [searchText, medicines]);

  const loadMedicines = async () => {
    try {
      const data = await fetchMedicinesWithVariants();
      const flattened = [];
      data.forEach(({ medicine, variants }) => {
        if (variants.length > 0) {
          flattened.push({
            genericName: medicine.name,
            variants: variants.map((v) => ({
              id: v._id,
              brandName: v.brandName,
              dosage: v.dosage,
              form: v.form,
              packing: v.packing,
              batchNumber: v.batchNumber,
              expiryDate: v.expiryDate,
              sellingPrice: v.sellingPrice,
              quantity: v.quantity,
            })),
          });
        }
      });
      setMedicines(flattened);
    } catch (err) {
      console.error("Failed to load medicines:", err);
    }
  };

  const onSelectMedicine = (medicine) => {
    setSelectedMedicine(medicine); setSelectedVariant(null);
    setQuantity(""); setSearchText(""); setFilteredMedicines([]);
  };

  const onSelectVariant = (variant) => { setSelectedVariant(variant); setQuantity(""); };

  const onAddToCart = () => {
    if (!selectedVariant || !quantity || Number(quantity) <= 0) {
      Alert.alert("Error", "Please select a batch and enter valid quantity"); return;
    }
    const qty = Number(quantity);
    if (qty > selectedVariant.quantity) {
      Alert.alert("Insufficient Stock", `Available: ${selectedVariant.quantity}, Requested: ${qty}`); return;
    }
    const cartItem = {
      id: Date.now().toString(),
      medicineVariantId: selectedVariant.id,
      brandName: selectedVariant.brandName,
      dosage: selectedVariant.dosage,
      batchNumber: selectedVariant.batchNumber,
      expiryDate: selectedVariant.expiryDate,
      sellingPrice: selectedVariant.sellingPrice,
      quantity: qty,
      lineTotal: selectedVariant.sellingPrice * qty,
    };
    setCart([...cart, cartItem]);
    setSelectedMedicine(null); setSelectedVariant(null); setQuantity("");
  };

  const onRemoveFromCart = (itemId) => setCart(cart.filter((item) => item.id !== itemId));

  const gstLabel = (kind) => {
    if (!preview?.items?.length) return kind;
    const rates = [...new Set(preview.items.map((it) => it.gstRate))];
    if (rates.length !== 1) return kind;
    return `${kind} (${rates[0] / 2}%)`;
  };

  const onGenerateInvoice = async () => {
    if (cart.length === 0) { Alert.alert("Error", "Cart is empty"); return; }
    if (!customerName || !customerName.trim()) { Alert.alert("Error", "Customer name is required"); return; }
    if (!paymentMode) { Alert.alert("Error", "Please select payment mode"); return; }
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          medicineVariantId: item.medicineVariantId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
        })),
        discountAmount: Number(discountAmount) || 0,
        customerName: customerName.trim(),
        doctorName: doctorName.trim() || undefined,
        hospitalName: hospitalName.trim() || undefined,
        paymentMode,
      };
      const invoice = await createInvoice(payload);
      try { await generateAndShareInvoicePdf(invoice); } catch (pdfErr) {
        Alert.alert("PDF", pdfErr.message || "Could not generate PDF. Reprint from Invoice History.");
      }
      Alert.alert("Success", `Invoice ${invoice.invoiceNumber} created!`, [{
        text: "OK", onPress: () => {
          setCart([]); setCustomerName(""); setDoctorName(""); setHospitalName(""); setDiscountAmount("");
          if (navigation.goBack) navigation.goBack();
        },
      }]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const subTotalFromCart = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={styles.title}>Create Invoice</Text>
              <Text style={styles.subtitle}>GST billing with auto-calculated totals</Text>
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>Customer Details</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Customer Name *"
            placeholderTextColor={Colors.textSecondary}
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={styles.input}
            placeholder="Doctor Name (optional)"
            placeholderTextColor={Colors.textSecondary}
            value={doctorName}
            onChangeText={setDoctorName}
          />
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="Hospital Name (optional)"
            placeholderTextColor={Colors.textSecondary}
            value={hospitalName}
            onChangeText={setHospitalName}
          />
        </View>

        {/* Medicine Search */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>💊</Text>
            <Text style={styles.sectionTitle}>Add Medicine</Text>
          </View>
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search medicine by name..."
              placeholderTextColor={Colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {filteredMedicines.length > 0 && (
            <View style={styles.dropdown}>
              {filteredMedicines.map((med, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dropdownItem, idx === filteredMedicines.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => onSelectMedicine(med)}
                >
                  <Text style={styles.dropdownText}>
                    {med.genericName}
                    <Text style={styles.dropdownSub}> ({med.variants.length} batch{med.variants.length !== 1 ? "es" : ""})</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedMedicine && (
            <View style={styles.batchSection}>
              <Text style={styles.fieldLabel}>Select Batch</Text>
              {selectedMedicine.variants.map((variant) => (
                <TouchableOpacity
                  key={variant.id}
                  style={[styles.batchItem, selectedVariant?.id === variant.id && styles.batchItemActive]}
                  onPress={() => onSelectVariant(variant)}
                >
                  <View style={styles.batchRow}>
                    <Text style={styles.batchText}>Batch: {variant.batchNumber}</Text>
                    <Text style={[styles.batchText, { color: Colors.highlight }]}>₹{variant.sellingPrice}</Text>
                  </View>
                  <Text style={styles.batchSubtext}>
                    Exp: {new Date(variant.expiryDate).toISOString().slice(0, 10)} • In stock: {variant.quantity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedVariant && (
            <View style={styles.quantityRow}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                placeholder="Quantity"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              <TouchableOpacity style={styles.addToCartBtn} onPress={onAddToCart} id="add-to-cart-btn">
                <Text style={styles.addToCartText}>+ Add to Cart</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Cart */}
        {cart.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionIcon}>🛒</Text>
              <Text style={styles.sectionTitle}>Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})</Text>
            </View>
            {cart.map((item, i) => (
              <View key={item.id} style={[styles.cartRow, i === cart.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.cartRowLeft}>
                  <Text style={styles.cartItemName}>{item.brandName} {item.dosage}</Text>
                  <Text style={styles.cartItemSub}>
                    Batch: {item.batchNumber} • Qty: {item.quantity} • ₹{item.lineTotal.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => onRemoveFromCart(item.id)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        {cart.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionIcon}>📊</Text>
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal (Inc. GST)</Text>
              <Text style={styles.summaryValue}>₹{(preview?.subTotal ?? subTotalFromCart).toFixed(2)}</Text>
            </View>

            {/* Discount Row */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount (₹)</Text>
              <TextInput
                style={styles.discountInput}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={discountAmount}
                onChangeText={setDiscountAmount}
              />
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxable Amount</Text>
              <Text style={styles.summaryValue}>{preview != null ? `₹${preview.taxableAmount.toFixed(2)}` : "—"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{gstLabel("CGST")}</Text>
              <Text style={styles.summaryValue}>{preview != null ? `₹${preview.cgst.toFixed(2)}` : "—"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{gstLabel("SGST")}</Text>
              <Text style={styles.summaryValue}>{preview != null ? `₹${preview.sgst.toFixed(2)}` : "—"}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.totalValue}>
                {preview != null ? `₹${preview.totalAmount.toFixed(2)}` : "—"}
              </Text>
            </View>

            {/* Payment Mode */}
            <View style={styles.paymentSection}>
              <Text style={styles.fieldLabel}>Payment Mode</Text>
              <View style={styles.paymentBtns}>
                {["Cash", "Card", "UPI"].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.paymentBtn, paymentMode === mode && styles.paymentBtnActive]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text style={[styles.paymentBtnText, paymentMode === mode && styles.paymentBtnTextActive]}>
                      {mode === "Cash" ? "💵" : mode === "Card" ? "💳" : "📱"} {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {previewError && (
              <Text style={styles.previewError}>⚠️ {previewError}</Text>
            )}

            <TouchableOpacity
              style={[styles.generateBtn, submitting && styles.generateBtnDisabled]}
              onPress={onGenerateInvoice}
              disabled={submitting}
              id="generate-invoice-btn"
            >
              {submitting ? (
                <View style={styles.generateBtnContent}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.generateBtnText}>Generating Invoice…</Text>
                </View>
              ) : (
                <Text style={styles.generateBtnText}>🧾  Generate Invoice</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Empty Cart State */}
        {cart.length === 0 && !selectedMedicine && !searchText && (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartIcon}>🛒</Text>
            <Text style={styles.emptyCartTitle}>Cart is Empty</Text>
            <Text style={styles.emptyCartSubtitle}>Search for a medicine above to add it to the cart.</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default BillingScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },

  header: {
    paddingTop: SAFE_TOP,
    paddingHorizontal: Spacing.sm,
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

  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  sectionIcon: {
    fontSize: 18,
  },

  sectionTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    fontSize: FontSize.body,
    minHeight: 46,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 46,
  },

  searchIcon: { fontSize: 15 },

  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    paddingVertical: Spacing.sm,
  },

  dropdown: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    maxHeight: 160,
    overflow: "hidden",
  },

  dropdownItem: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  dropdownText: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },

  dropdownSub: {
    color: Colors.textSecondary,
    fontWeight: FontWeight.regular,
    fontSize: FontSize.sm,
  },

  batchSection: { marginTop: Spacing.sm },

  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  batchItem: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  batchItemActive: {
    borderColor: Colors.highlight,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },

  batchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },

  batchText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  batchSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },

  quantityInput: {
    flex: 1,
    marginBottom: 0,
  },

  addToCartBtn: {
    backgroundColor: Colors.highlight,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    minHeight: 46,
    justifyContent: "center",
  },

  addToCartText: {
    color: "#0F172A",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },

  cartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  cartRowLeft: { flex: 1 },

  cartItemName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  cartItemSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },

  removeBtnText: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },

  summaryLabel: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },

  summaryValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  discountInput: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 90,
    textAlign: "right",
    fontSize: FontSize.body,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.base,
  },

  totalLabel: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  totalValue: {
    fontSize: 22,
    fontWeight: FontWeight.black,
    color: Colors.accent,
  },

  paymentSection: { marginBottom: Spacing.base },

  paymentBtns: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },

  paymentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },

  paymentBtnActive: {
    borderColor: Colors.highlight,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },

  paymentBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },

  paymentBtnTextActive: {
    color: Colors.highlight,
  },

  previewError: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    marginBottom: Spacing.md,
    textAlign: "center",
  },

  generateBtn: {
    backgroundColor: Colors.highlight,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
    ...Shadow.sm,
  },

  generateBtnDisabled: { opacity: 0.7 },

  generateBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  generateBtnText: {
    fontSize: FontSize.bodyLg,
    fontWeight: FontWeight.bold,
    color: "#0F172A",
    letterSpacing: 0.5,
  },

  emptyCart: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },

  emptyCartIcon: { fontSize: 52, marginBottom: Spacing.base },

  emptyCartTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  emptyCartSubtitle: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
