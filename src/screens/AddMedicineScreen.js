import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from "react-native";
import Colors from "../constants/styles";
import { Spacing, FontSize, FontWeight, Radius, Shadow, SAFE_TOP } from "../constants/theme";
import { createMedicineStock, searchMedicineMaster } from "../services/api";

const AddMedicineScreen = ({ navigation }) => {
  const [category, setCategory] = useState("");
  const [brandName, setBrandName] = useState("");
  const [dosage, setDosage] = useState("");
  const [form, setForm] = useState("Tablet");
  const [packing, setPacking] = useState("Strip");
  const [hsnCode, setHsnCode] = useState("3004");
  const [gstRate, setGstRate] = useState("5");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState(null);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minThreshold, setMinThreshold] = useState("10");

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = searchText.trim();
    if (!q) { setSearchResults([]); setSelectedMasterId(null); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchMedicineMaster(q);
        setSearchResults(results);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  const onAddStock = async () => {
    if (
      !brandName.trim() || !dosage.trim() || !form.trim() || !packing.trim() ||
      !hsnCode.trim() || !batchNumber.trim() || !expiryDate ||
      !purchasePrice.trim() || !mrp.trim() || !sellingPrice.trim() || !quantity.trim()
    ) {
      Alert.alert("Missing Fields", "Please fill in all required fields before saving.");
      return;
    }

    const parsedPurchase = Number(purchasePrice);
    const parsedMrp = Number(mrp);
    const parsedSelling = Number(sellingPrice);
    const parsedQuantity = Number(quantity);

    if (
      Number.isNaN(parsedPurchase) || Number.isNaN(parsedMrp) ||
      Number.isNaN(parsedSelling) || Number.isNaN(parsedQuantity) ||
      parsedPurchase < 0 || parsedMrp < 0 || parsedSelling < 0 || parsedQuantity <= 0
    ) {
      Alert.alert("Invalid Values", "Please enter valid positive numbers for prices and quantity.");
      return;
    }

    if (parsedSelling > parsedMrp) {
      Alert.alert("Price Error", `Selling Price (${parsedSelling}) cannot exceed MRP (${parsedMrp}).`);
      return;
    }

    setSubmitting(true);
    try {
      await createMedicineStock({
        name: brandName.trim(),
        category: category.trim() || undefined,
        hsnCode: hsnCode.trim(),
        gstRate: Number(gstRate),
        brandName: brandName.trim(),
        dosage: dosage.trim(),
        form,
        packing: packing.trim(),
        batchNumber: batchNumber.trim(),
        expiryDate: expiryDate.toISOString(),
        purchasePrice: parsedPurchase,
        mrp: parsedMrp,
        sellingPrice: parsedSelling,
        quantity: parsedQuantity,
        minThreshold: Number(minThreshold) || 0,
      });
      navigation.goBack();
    } catch (err) {
      console.log("Failed to add medicine stock:", err);
      Alert.alert("Error", err.message || "Failed to save stock. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSelectMaster = (item) => {
    setSelectedMasterId(item._id);
    setSearchText(item.brandName);
    setSearchResults([]);
    setBrandName(item.brandName || "");
    setDosage(item.dosage || "");
    setForm(item.form || "Tablet");
    setPacking(item.packing || "Strip");
  };

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
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
                <Text style={styles.title}>Add Medicine Stock</Text>
                <Text style={styles.subtitle}>Auto-fill from master or enter manually</Text>
              </View>
            </View>
          </View>

          {/* Section 1: Medicine Search & Details */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💊</Text>
              <View>
                <Text style={styles.sectionTitle}>Medicine Details</Text>
                <Text style={styles.sectionSubtitle}>Search from master or enter manually</Text>
              </View>
            </View>

            {/* Master Search */}
            <View style={styles.searchWrapper}>
              <Text style={styles.searchIconText}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search medicine by brand name..."
                placeholderTextColor={Colors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
              {selectedMasterId && (
                <TouchableOpacity
                  onPress={() => { setSelectedMasterId(null); setSearchText(""); }}
                  hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
                >
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {searchText.trim().length > 0 && searchResults.length > 0 && (
              <View style={styles.dropdown}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.dropdownItem}
                    onPress={() => onSelectMaster(item)}
                  >
                    <Text style={styles.dropdownText}>
                      {item.brandName} {item.dosage} {item.form} {item.packing}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedMasterId && (
              <View style={styles.masterSelectedBadge}>
                <Text style={styles.masterSelectedText}>✓ Auto-filled from master. Fields locked.</Text>
              </View>
            )}

            {/* Brand & Dosage */}
            <View style={styles.fieldRow}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Brand Name *</Text>
                <TextInput
                  style={[styles.input, selectedMasterId && styles.inputLocked]}
                  placeholder="Brand Name"
                  placeholderTextColor={Colors.textSecondary}
                  value={brandName}
                  onChangeText={setBrandName}
                  editable={!selectedMasterId}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Dosage *</Text>
                <TextInput
                  style={[styles.input, selectedMasterId && styles.inputLocked]}
                  placeholder="e.g. 500mg"
                  placeholderTextColor={Colors.textSecondary}
                  value={dosage}
                  onChangeText={setDosage}
                  editable={!selectedMasterId}
                />
              </View>
            </View>

            {/* Form & Packing */}
            <View style={styles.fieldRow}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Form *</Text>
                <TextInput
                  style={[styles.input, selectedMasterId && styles.inputLocked]}
                  placeholder="Tablet / Capsule"
                  placeholderTextColor={Colors.textSecondary}
                  value={form}
                  onChangeText={setForm}
                  editable={!selectedMasterId}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Packing *</Text>
                <TextInput
                  style={[styles.input, selectedMasterId && styles.inputLocked]}
                  placeholder="e.g. Strip / 15's"
                  placeholderTextColor={Colors.textSecondary}
                  value={packing}
                  onChangeText={setPacking}
                  editable={!selectedMasterId}
                />
              </View>
            </View>

            {/* HSN & GST */}
            <View style={styles.fieldRow}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>HSN Code</Text>
                <TextInput
                  style={[styles.input, selectedMasterId && styles.inputLocked]}
                  placeholder="3004"
                  placeholderTextColor={Colors.textSecondary}
                  value={hsnCode}
                  onChangeText={setHsnCode}
                  editable={!selectedMasterId}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>GST Rate (%)</Text>
                <View style={styles.gstRow}>
                  {[0, 5, 12, 18].map((rate) => (
                    <TouchableOpacity
                      key={rate}
                      style={[styles.gstBtn, gstRate == rate && styles.gstBtnActive]}
                      onPress={() => !selectedMasterId && setGstRate(String(rate))}
                      disabled={!!selectedMasterId}
                    >
                      <Text style={[styles.gstBtnText, gstRate == rate && styles.gstBtnTextActive]}>
                        {rate}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Category (optional) */}
            <Text style={styles.fieldLabel}>Category (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Antibiotic, Vitamin..."
              placeholderTextColor={Colors.textSecondary}
              value={category}
              onChangeText={setCategory}
            />
          </View>

          {/* Section 2: Stock Details */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📦</Text>
              <View>
                <Text style={styles.sectionTitle}>Stock Details</Text>
                <Text style={styles.sectionSubtitle}>Batch, pricing & inventory info</Text>
              </View>
            </View>

            {/* Batch & Expiry */}
            <View style={styles.fieldRow}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Batch No. *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Batch number"
                  placeholderTextColor={Colors.textSecondary}
                  value={batchNumber}
                  onChangeText={setBatchNumber}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Expiry Date *</Text>
                <TouchableOpacity
                  style={styles.input}
                  activeOpacity={0.8}
                  onPress={() => setShowExpiryPicker(true)}
                >
                  <Text style={{ color: expiryDate ? Colors.textPrimary : Colors.textSecondary, fontSize: FontSize.body, lineHeight: 24 }}>
                    {expiryDate ? expiryDate.toISOString().slice(0, 10) : "Select date"}
                  </Text>
                </TouchableOpacity>
                {showExpiryPicker && (
                  <DateTimePicker
                    value={expiryDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowExpiryPicker(false);
                      if (selectedDate) setExpiryDate(selectedDate);
                    }}
                  />
                )}
              </View>
            </View>

            {/* MRP & Purchase Price */}
            <View style={styles.fieldRow}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>MRP (Inc. GST) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={mrp}
                  onChangeText={(val) => { setMrp(val); if (!sellingPrice) setSellingPrice(val); }}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Purchase Rate *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                />
              </View>
            </View>

            {/* Selling Price */}
            <View style={styles.fieldRow}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Selling Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                />
              </View>
            </View>

            {/* Quantity & Min Threshold */}
            <View style={styles.fieldRow}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Total units"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Low Stock Alert (Min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={minThreshold}
                  onChangeText={setMinThreshold}
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, (submitting || searching) && styles.saveBtnDisabled]}
            activeOpacity={0.85}
            onPress={onAddStock}
            disabled={submitting || searching}
            id="save-stock-btn"
          >
            <Text style={styles.saveBtnText}>
              {submitting ? "Saving Stock…" : "💾  Save Medicine Stock"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.requiredNote}>* Required fields</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default AddMedicineScreen;

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

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  sectionIcon: {
    fontSize: 20,
    lineHeight: 24,
  },

  sectionTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  sectionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
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

  searchIconText: { fontSize: 15 },

  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    paddingVertical: Spacing.sm,
  },

  clearBtn: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  dropdown: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    maxHeight: 200,
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
  },

  masterSelectedBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.25)",
  },

  masterSelectedText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },

  fieldRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  halfField: {
    flex: 1,
  },

  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: FontSize.body,
    minHeight: 46,
    marginBottom: Spacing.xs,
  },

  inputLocked: {
    backgroundColor: "rgba(255,255,255,0.03)",
    opacity: 0.6,
  },

  gstRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },

  gstBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },

  gstBtnActive: {
    backgroundColor: Colors.highlight,
    borderColor: Colors.highlight,
  },

  gstBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },

  gstBtnTextActive: {
    color: "#0F172A",
    fontWeight: FontWeight.bold,
  },

  saveBtn: {
    backgroundColor: Colors.highlight,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },

  saveBtnDisabled: { opacity: 0.6 },

  saveBtnText: {
    color: "#0F172A",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.bodyLg,
    letterSpacing: 0.5,
  },

  requiredNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
});
