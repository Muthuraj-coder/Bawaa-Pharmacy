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
} from "react-native";
import Colors from "../constants/styles";
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
  const [expiryDate, setExpiryDate] = useState(null); // JS Date
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minThreshold, setMinThreshold] = useState("10");

  // Medicine master search state
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = searchText.trim();

    // If user clears search, allow editing again
    if (!q) {
      setSearchResults([]);
      setSelectedMasterId(null);
      return;
    }

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
      !brandName.trim() ||
      !dosage.trim() ||
      !form.trim() ||
      !packing.trim() ||
      !hsnCode.trim() ||
      !batchNumber.trim() ||
      !expiryDate ||
      !purchasePrice.trim() ||
      !mrp.trim() ||
      !sellingPrice.trim() ||
      !quantity.trim()
    ) {
      return;
    }

    const parsedPurchase = Number(purchasePrice);
    const parsedMrp = Number(mrp);
    const parsedSelling = Number(sellingPrice);
    const parsedQuantity = Number(quantity);

    if (
      Number.isNaN(parsedPurchase) ||
      Number.isNaN(parsedMrp) ||
      Number.isNaN(parsedSelling) ||
      Number.isNaN(parsedQuantity) ||
      parsedPurchase < 0 ||
      parsedMrp < 0 ||
      parsedSelling < 0 ||
      parsedQuantity <= 0
    ) {
      alert("Please enter valid positive numbers for prices and quantity");
      return;
    }

    if (parsedSelling > parsedMrp) {
      alert(`Selling Price (${parsedSelling}) cannot determine MRP (${parsedMrp})`);
      return;
    }

    setSubmitting(true);
    try {
      await createMedicineStock({
        // For now we use the selected brandName as the generic name.
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

      // After successful save, go back to inventory screen.
      navigation.goBack();
    } catch (err) {
      console.log("Failed to add medicine stock:", err);
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
    // If master has HSN/GST, auto-fill them. For now, we keep defaults or manual entry if not in master.
    // In future, if master returns HSN/GST, set them here.
  };

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Medicine Stock</Text>
            <Text style={styles.subtitle}>
              Bawaa Pharmacy • Auto-fill from master, enter stock details
            </Text>
          </View>

          <View style={styles.addBox}>
            {/* Section 1: Medicine Details */}
            <Text style={styles.sectionTitle}>Medicine Details</Text>
            <Text style={styles.sectionSubtitle}>
              Search from master list or enter manually
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Search medicine by brand name"
              placeholderTextColor={Colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />

            {searchText.trim().length > 0 && searchResults.length > 0 && (
              <View style={styles.dropdown}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.dropdownItem}
                    onPress={() => onSelectMaster(item)}
                  >
                    <Text style={styles.dropdownText}>
                      {item.brandName} {item.dosage} {item.form}{" "}
                      {item.packing}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Brand Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Brand Name"
                  placeholderTextColor={Colors.textSecondary}
                  value={brandName}
                  onChangeText={setBrandName}
                  editable={!selectedMasterId}
                />
              </View>

              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Dosage</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500mg"
                  placeholderTextColor={Colors.textSecondary}
                  value={dosage}
                  onChangeText={setDosage}
                  editable={!selectedMasterId}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Form</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tablet / Capsule"
                  placeholderTextColor={Colors.textSecondary}
                  value={form}
                  onChangeText={setForm}
                  editable={!selectedMasterId}
                />
              </View>

              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Packing</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15's / Strip"
                  placeholderTextColor={Colors.textSecondary}
                  value={packing}
                  onChangeText={setPacking}
                  editable={!selectedMasterId}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>HSN Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3004"
                  placeholderTextColor={Colors.textSecondary}
                  value={hsnCode}
                  onChangeText={setHsnCode}
                  editable={!selectedMasterId} // Assuming HSN is tied to medicine master
                />
              </View>

              <View style={styles.half}>
                <Text style={styles.fieldLabel}>GST Rate (%)</Text>
                <View style={styles.gstRow}>
                  {[0, 5, 12, 18].map((rate) => (
                    <TouchableOpacity
                      key={rate}
                      style={[
                        styles.gstButton,
                        gstRate == rate && styles.gstButtonSelected,
                      ]}
                      onPress={() => !selectedMasterId && setGstRate(String(rate))}
                      disabled={!!selectedMasterId}
                    >
                      <Text
                        style={[
                          styles.gstButtonText,
                          gstRate == rate && styles.gstButtonTextSelected,
                        ]}
                      >
                        {rate}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Section 2: Stock Details */}
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Stock Details</Text>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Batch No.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Batch number"
                  placeholderTextColor={Colors.textSecondary}
                  value={batchNumber}
                  onChangeText={setBatchNumber}
                />
              </View>

              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                <TouchableOpacity
                  style={styles.input}
                  activeOpacity={0.8}
                  onPress={() => setShowExpiryPicker(true)}
                >
                  <Text
                    style={{
                      color: expiryDate
                        ? Colors.textPrimary
                        : Colors.textSecondary,
                      fontSize: 14,
                    }}
                  >
                    {expiryDate
                      ? expiryDate.toISOString().slice(0, 10)
                      : "Select date"}
                  </Text>
                </TouchableOpacity>

                {showExpiryPicker && (
                  <DateTimePicker
                    value={expiryDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowExpiryPicker(false);
                      if (selectedDate) {
                        setExpiryDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>MRP (Inc. GST)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={mrp}
                  onChangeText={(val) => {
                    setMrp(val);
                    if (!sellingPrice) setSellingPrice(val); // Auto-fill SP with MRP initially
                  }}
                />
              </View>

              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Purchase Rate (Ex. GST)</Text>
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

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Selling Price</Text>
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

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Total units"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>

              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Alert at (Min)</Text>
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

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={onAddStock}
            disabled={submitting || searching}
          >
            <Text style={styles.addButtonText}>
              {submitting ? "Saving..." : "Save Stock"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient >
  );
};

export default AddMedicineScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    marginTop: 60,
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },

  addBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 10,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },

  dropdown: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    maxHeight: 180,
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

  fieldLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  half: {
    width: "48%",
  },

  addButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },

  addButtonText: {
    textAlign: "center",
    fontWeight: "700",
    color: Colors.primary,
  },
  gstRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gstButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 35,
    alignItems: "center",
  },
  gstButtonSelected: {
    backgroundColor: Colors.highlight,
    borderColor: Colors.highlight,
  },
  gstButtonText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  gstButtonTextSelected: {
    color: "#000",
    fontWeight: "700",
  },
});

