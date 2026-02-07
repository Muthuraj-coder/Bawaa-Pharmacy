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
} from "react-native";
import Colors from "../constants/styles";
import {
  createInvoice,
  fetchMedicinesWithVariants,
  getInvoicePreview,
} from "../services/api";
import { generateAndShareInvoicePdf } from "../utils/invoicePdf";

const BillingScreen = ({ navigation }) => {
  const [customerName, setCustomerName] = useState("");
  const [doctorName, setDoctorName] = useState("");
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

  useEffect(() => {
    loadMedicines();
  }, []);

  // Fetch backend-calculated totals when cart or discount changes (no GST math on frontend)
  useEffect(() => {
    if (cart.length === 0) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    setPreviewError(null);
    (async () => {
      try {
        const payload = {
          items: cart.map((item) => ({
            medicineVariantId: item.medicineVariantId,
            quantity: item.quantity,
          })),
          discountAmount: Number(discountAmount) || 0,
        };
        const data = await getInvoicePreview(payload);
        if (!cancelled) setPreview(data);
      } catch (err) {
        if (!cancelled) {
          setPreviewError(err.message || "Preview failed");
          setPreview(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [cart, discountAmount]);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredMedicines([]);
      return;
    }

    const q = searchText.trim().toLowerCase();
    const filtered = medicines.filter((med) =>
      med.genericName.toLowerCase().includes(q) ||
      med.variants.some((v) =>
        v.brandName.toLowerCase().includes(q)
      )
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
    setSelectedMedicine(medicine);
    setSelectedVariant(null);
    setQuantity("");
    setSearchText("");
    setFilteredMedicines([]);
  };

  const onSelectVariant = (variant) => {
    setSelectedVariant(variant);
    setQuantity("");
  };

  const onAddToCart = () => {
    if (!selectedVariant || !quantity || Number(quantity) <= 0) {
      Alert.alert("Error", "Please select a batch and enter valid quantity");
      return;
    }

    const qty = Number(quantity);
    if (qty > selectedVariant.quantity) {
      Alert.alert(
        "Insufficient Stock",
        `Available: ${selectedVariant.quantity}, Requested: ${qty}`
      );
      return;
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
    setSelectedMedicine(null);
    setSelectedVariant(null);
    setQuantity("");
  };

  const onRemoveFromCart = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  // CGST/SGST label: show percentage only if all items share the same gstRate
  const gstLabel = (kind) => {
    if (!preview?.items?.length) return kind;
    const rates = [...new Set(preview.items.map((it) => it.gstRate))];
    if (rates.length !== 1) return kind;
    const pct = rates[0] / 2;
    return `${kind} (${pct}%)`;
  };

  const onGenerateInvoice = async () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Cart is empty");
      return;
    }

    if (!paymentMode) {
      Alert.alert("Error", "Please select payment mode");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          medicineVariantId: item.medicineVariantId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
        })),
        discountAmount: Number(discountAmount) || 0,
        customerName: customerName.trim() || undefined,
        doctorName: doctorName.trim() || undefined,
        paymentMode,
      };

      const invoice = await createInvoice(payload);

      try {
        await generateAndShareInvoicePdf(invoice);
      } catch (pdfErr) {
        Alert.alert("PDF", pdfErr.message || "Could not generate PDF. You can reprint from Invoice History.");
      }

      Alert.alert(
        "Success",
        `Invoice generated successfully. Invoice number: ${invoice.invoiceNumber}`,
        [
          {
            text: "OK",
            onPress: () => {
              setCart([]);
              setCustomerName("");
              setDoctorName("");
              setDiscountAmount("");
              if (navigation.goBack) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const subTotalFromCart = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bawaa Pharmacy</Text>
          <Text style={styles.subtitle}>
            Create invoice with GST calculation
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Customer Name (optional)"
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
        </View>

        {/* Medicine Search */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add Medicine</Text>
          <TextInput
            style={styles.input}
            placeholder="Search medicine by name"
            placeholderTextColor={Colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />

          {filteredMedicines.length > 0 && (
            <View style={styles.dropdown}>
              {filteredMedicines.map((med, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.dropdownItem}
                  onPress={() => onSelectMedicine(med)}
                >
                  <Text style={styles.dropdownText}>
                    {med.genericName} ({med.variants.length} batches)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Selected Medicine Batches */}
          {selectedMedicine && (
            <View style={styles.batchSection}>
              <Text style={styles.fieldLabel}>Available Batches:</Text>
              {selectedMedicine.variants.map((variant) => (
                <TouchableOpacity
                  key={variant.id}
                  style={[
                    styles.batchItem,
                    selectedVariant?.id === variant.id && styles.batchItemSelected,
                  ]}
                  onPress={() => onSelectVariant(variant)}
                >
                  <View style={styles.batchRow}>
                    <Text style={styles.batchText}>
                      Batch: {variant.batchNumber}
                    </Text>
                    <Text style={styles.batchText}>
                      ₹{variant.sellingPrice}
                    </Text>
                  </View>
                  <Text style={styles.batchSubtext}>
                    Exp: {new Date(variant.expiryDate).toISOString().slice(0, 10)} • Qty: {variant.quantity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quantity Input */}
          {selectedVariant && (
            <View style={styles.quantitySection}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <View style={styles.quantityRow}>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  placeholder="Enter quantity"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={onAddToCart}
                >
                  <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Cart */}
        {cart.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cart ({cart.length})</Text>
            {cart.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemLeft}>
                  <Text style={styles.cartItemName}>
                    {item.brandName} {item.dosage}
                  </Text>
                  <Text style={styles.cartItemSub}>
                    Batch: {item.batchNumber} • Qty: {item.quantity} • ₹
                    {item.lineTotal}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemoveFromCart(item.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        {cart.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal (Inc. GST)</Text>
              <Text style={styles.summaryValue}>
                ₹{(preview?.subTotal ?? subTotalFromCart).toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
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
              <Text style={styles.summaryValue}>
                {preview != null
                  ? `₹${preview.taxableAmount.toFixed(2)}`
                  : "—"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{gstLabel("CGST")}</Text>
              <Text style={styles.summaryValue}>
                {preview != null
                  ? `₹${preview.cgst.toFixed(2)}`
                  : "—"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{gstLabel("SGST")}</Text>
              <Text style={styles.summaryValue}>
                {preview != null
                  ? `₹${preview.sgst.toFixed(2)}`
                  : "—"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {preview != null
                  ? `₹${preview.totalAmount.toFixed(2)}`
                  : "—"}
              </Text>
            </View>

            {/* Payment Mode */}
            <View style={styles.paymentRow}>
              <Text style={styles.fieldLabel}>Payment Mode</Text>
              <View style={styles.paymentButtons}>
                {["Cash", "Card", "UPI"].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.paymentButton,
                      paymentMode === mode && styles.paymentButtonSelected,
                    ]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text
                      style={[
                        styles.paymentButtonText,
                        paymentMode === mode &&
                        styles.paymentButtonTextSelected,
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={onGenerateInvoice}
              disabled={submitting}
            >
              {submitting ? (
                <View style={styles.generateButtonContent}>
                  <ActivityIndicator
                    size="small"
                    color={Colors.primary}
                    style={styles.generateButtonSpinner}
                  />
                  <Text style={styles.generateButtonText}>Generating...</Text>
                </View>
              ) : (
                <Text style={styles.generateButtonText}>Generate Invoice</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default BillingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
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
  dropdown: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    maxHeight: 150,
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
  batchSection: {
    marginTop: 10,
  },
  fieldLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  batchItem: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  batchItemSelected: {
    borderColor: Colors.highlight,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
  },
  batchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  batchText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  batchSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  quantitySection: {
    marginTop: 10,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityInput: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
  },
  addButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cartItemLeft: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  cartItemSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  discountInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 100,
    textAlign: "right",
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.accent,
  },
  paymentRow: {
    marginTop: 12,
  },
  paymentButtons: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  paymentButtonSelected: {
    borderColor: Colors.highlight,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  paymentButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  paymentButtonTextSelected: {
    color: Colors.highlight,
  },
  generateButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  generateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonSpinner: {
    marginRight: 8,
  },
  generateButtonText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
});
