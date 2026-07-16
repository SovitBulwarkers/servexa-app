import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  shadow,
} from "../../../src/theme";
import {
  CatalogAPI,
  BookingAPI,
  UserAPI,
  CouponAPI,
  PaymentAPI,
  Service,
  Address,
} from "../../../src/api/endpoints";
import RazorpayCheckout from "react-native-razorpay";
import Button from "../../../src/components/Button";
import { Card, Input } from "../../../src/components/ui";
import { useLocation } from "../../../src/hooks/useLocation";
import { useAuth } from "../../../src/store/auth-context";

const STEPS = ["Date & Time", "Address", "Summary", "Payment"];

const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI", icon: "phone-portrait-outline" as const },
  { id: "CARD", label: "Debit / Credit Card", icon: "card-outline" as const },
  { id: "WALLET", label: "Wallet Balance", icon: "wallet-outline" as const },
  { id: "CASH", label: "Cash on Service", icon: "cash-outline" as const },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <View style={styles.stepRow}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                i <= current && styles.stepCircleActive,
                i < current && styles.stepCircleDone,
              ]}
            >
              {i < current ? (
                <Ionicons name="checkmark" size={14} color={colors.white} />
              ) : (
                <Text
                  style={[styles.stepNum, i <= current && styles.stepNumActive]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                i === current && styles.stepLabelActive,
              ]}
            >
              {s}
            </Text>
          </View>
          {i < STEPS.length - 1 && (
            <View
              style={[styles.stepLine, i < current && styles.stepLineDone]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function genDates() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function BookingFlow() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  // Step 0
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Step 1
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    fullAddress: "",
    city: "",
  });

  // Step 2
  const [description, setDescription] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  // Step 3
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const {
    loading: locating,
    error: locError,
    detectCurrentLocation,
  } = useLocation();

  const init = async () => {
    setLoading(true);
    setInitError(null);
    try {
      const [svcRes, addrRes] = await Promise.all([
        CatalogAPI.getService(serviceId!),
        UserAPI.getAddresses(),
      ]);
      setService(svcRes.data?.data);
      setAddresses(addrRes.data?.data ?? []);
      const def = addrRes.data?.data?.find((a) => a.isDefault);
      if (def) setSelectedAddressId(def.id);
      if (def) setSelectedAddressId(def.id);
    } catch {
      setInitError(
        "Could not load booking details. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceId) init();
  }, [serviceId]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data }: any = await CouponAPI.validate(
        couponCode.trim(),
        service!.price,
      );
      setCouponDiscount(data.discount ?? 0);
    } catch {
      Alert.alert("Invalid Coupon", "This coupon is not valid or has expired.");
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    setBooking(true);
    try {
      const bookingPayload = {
        items: [{ serviceId: serviceId!, quantity: 1 }],
        scheduledDate: selectedDate.toISOString(),
        scheduledTime: selectedTime,
        addressId: selectedAddressId ?? undefined,
        description: description || undefined,
      };

      let bookingId: string;

      if (paymentMethod === "CASH") {
        // Cash on Service is the one exception: there's no online payment
        // to wait on, so the booking is created immediately as before.
        const { data: created } = await BookingAPI.create(bookingPayload);
        bookingId = created.data.id;
        await PaymentAPI.payCash(bookingId);
      } else if (paymentMethod === "WALLET") {
        const { data: created } = await BookingAPI.create(bookingPayload);
        bookingId = created.data.id;
        await PaymentAPI.payFromWallet(bookingId);
      } else {
        // UPI / CARD -> no booking is created yet. We only ask the
        // backend to price it and open a Razorpay order; the booking
        // itself is created server-side only once payment is verified,
        // so a cancelled/failed payment never leaves a booking behind.
        if (!RazorpayCheckout || typeof RazorpayCheckout.open !== "function") {
          throw new Error(
            "Online payment isn't available in this build. Please install the latest app build, or choose Cash on Service.",
          );
        }

        const { data: orderRes }: any =
          await PaymentAPI.createOrderForNewBooking(bookingPayload);
        const order = orderRes.data ?? orderRes;

        if (!order?.orderId || !order?.keyId) {
          throw new Error(
            "Payment could not be initiated. Please try again in a moment.",
          );
        }

        const checkoutResult = await RazorpayCheckout.open({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: "HomeServe",
          description: "Service booking payment",
          prefill: {
            email: user?.email || undefined,
            contact: user?.phone || undefined,
            name: user?.name || undefined,
          },
          theme: { color: colors.primary },
        });

        // The booking is created here, on the backend, only now that
        // Razorpay confirms payment succeeded.
        const { data: verifyRes }: any = await PaymentAPI.verify({
          razorpayOrderId: checkoutResult.razorpay_order_id,
          razorpayPaymentId: checkoutResult.razorpay_payment_id,
          razorpaySignature: checkoutResult.razorpay_signature,
          method: paymentMethod,
        });
        bookingId = (verifyRes.data ?? verifyRes).id;
      }

      router.replace({ pathname: "/booking/success", params: { bookingId } });
    } catch (e: any) {
      // Razorpay's own SDK rejects with { code, description } on cancel/failure
      // instead of an axios error, so handle both shapes.
      console.log("Payment/booking error:", JSON.stringify(e, null, 2));
      const cancelledByUser = e?.code === 0 || /cancel/i.test(e?.description ?? "");
      if (cancelledByUser) {
        setBooking(false);
        return; // user closed the payment sheet — no booking was ever created
      }
      const message =
        e?.response?.data?.message ||
        e?.description ||
        e?.message ||
        "Could not complete booking. Please try again.";
      Alert.alert("Booking Failed", message);
    } finally {
      setBooking(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!selectedDate && !!selectedTime;
    if (step === 1) return !!selectedAddressId;
    return true;
  };

  const dates = genDates();
  const total = Math.round((((service?.price ?? 0) - couponDiscount) + Number.EPSILON) * 100) / 100;

  if (loading)
    return (
      <ActivityIndicator
        color={colors.primary}
        style={{ flex: 1, marginTop: 80 }}
      />
    );

  if (initError || !service) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xl,
            gap: spacing.md,
          }}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.bold,
              color: colors.textPrimary,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            {initError ?? "Service not found"}
          </Text>
          <Button
            title="Retry"
            onPress={init}
            fullWidth={false}
            style={{ paddingHorizontal: spacing.xxxl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (step === 0 ? router.back() : setStep(step - 1))}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Book Service</Text>
        <Text style={styles.stepCounter}>
          {step + 1}/{STEPS.length}
        </Text>
      </View>

      <StepIndicator current={step} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Step 0: Date & Time ─── */}
          {step === 0 && (
            <>
              <Text style={styles.sectionTitle}>Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateRow}
              >
                {dates.map((d, i) => {
                  const sel = selectedDate?.toDateString() === d.toDateString();
                  return (
                    <Pressable
                      key={i}
                      style={[styles.dateChip, sel && styles.dateChipSel]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text style={[styles.dateDay, sel && styles.dateSel]}>
                        {d.toLocaleDateString("en-IN", { weekday: "short" })}
                      </Text>
                      <Text style={[styles.dateNum, sel && styles.dateSel]}>
                        {d.getDate()}
                      </Text>
                      <Text style={[styles.dateMon, sel && styles.dateSel]}>
                        {d.toLocaleDateString("en-IN", { month: "short" })}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>
                Select Time Slot
              </Text>
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((t) => {
                  const sel = selectedTime === t;
                  return (
                    <Pressable
                      key={t}
                      style={[styles.timeChip, sel && styles.timeChipSel]}
                      onPress={() => setSelectedTime(t)}
                    >
                      <Text
                        style={[styles.timeText, sel && styles.timeTextSel]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* ─── Step 1: Address ─── */}
          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Saved Addresses</Text>
              {addresses.map((addr) => (
                <Pressable
                  key={addr.id}
                  style={[
                    styles.addressCard,
                    selectedAddressId === addr.id && styles.addressCardSel,
                  ]}
                  onPress={() => setSelectedAddressId(addr.id)}
                >
                  <View
                    style={[
                      styles.addrRadio,
                      selectedAddressId === addr.id && styles.addrRadioSel,
                    ]}
                  >
                    {selectedAddressId === addr.id && (
                      <View style={styles.addrRadioInner} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.addrLabelRow}>
                      <Text style={styles.addrLabel}>{addr.label}</Text>
                      {addr.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addrLine}>{addr.line1}</Text>
                    {addr.line2 ? (
                      <Text style={styles.addrLine}>{addr.line2}</Text>
                    ) : null}
                    {addr.city ? (
                      <Text style={styles.addrLine}>{addr.city}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}

              {addingAddress ? (
                <Card style={{ marginTop: spacing.lg }}>
                  <Text style={styles.sectionTitle}>New Address</Text>
                  <Pressable
                    onPress={async () => {
                      const loc = await detectCurrentLocation();
                      if (loc) {
                        setNewAddress((prev) => ({
                          ...prev,
                          fullAddress: loc.line1,
                          city: loc.city ?? prev.city,
                        }));
                      }
                    }}
                    style={styles.gpsBtn}
                    disabled={locating}
                  >
                    {locating ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons
                        name="navigate-outline"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                    <Text style={styles.gpsBtnText}>
                      {locating
                        ? "Detecting your location…"
                        : "Use current location"}
                    </Text>
                  </Pressable>
                  {locError ? (
                    <Text
                      style={{
                        color: colors.danger,
                        fontSize: fontSize.xs,
                        marginBottom: spacing.md,
                      }}
                    >
                      {locError}
                    </Text>
                  ) : null}
                  <View style={styles.addrTypeRow}>
                    {["Home", "Work", "Other"].map((l) => (
                      <Pressable
                        key={l}
                        style={[
                          styles.addrTypeChip,
                          newAddress.label === l && styles.addrTypeChipSel,
                        ]}
                        onPress={() =>
                          setNewAddress({ ...newAddress, label: l })
                        }
                      >
                        <Text
                          style={[
                            styles.addrTypeText,
                            newAddress.label === l && styles.addrTypeTextSel,
                          ]}
                        >
                          {l}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Input
                    label="Street address"
                    leftIcon="location-outline"
                    placeholder="House no., street, area"
                    value={newAddress.fullAddress}
                    onChangeText={(t) =>
                      setNewAddress({ ...newAddress, fullAddress: t })
                    }
                  />
                  <Input
                    label="City"
                    leftIcon="business-outline"
                    placeholder="City"
                    value={newAddress.city}
                    onChangeText={(t) =>
                      setNewAddress({ ...newAddress, city: t })
                    }
                  />
                  <Button
                    title="Save Address"
                    size="sm"
                    onPress={async () => {
                      if (!newAddress.fullAddress) return;
                      try {
                        const { data } = await UserAPI.addAddress(
                          newAddress as any,
                        );
                        setAddresses([...addresses, data.data]);
                        setSelectedAddressId(data.data.id);
                        setAddingAddress(false);
                      } catch {
                        Alert.alert(
                          "Could not save address",
                          "Please check your connection and try again.",
                        );
                      }
                    }}
                  />
                </Card>
              ) : (
                <Pressable
                  style={styles.addAddressBtn}
                  onPress={() => setAddingAddress(true)}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.addAddressText}>Add New Address</Text>
                </Pressable>
              )}
            </>
          )}

          {/* ─── Step 2: Summary ─── */}
          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <Card style={{ marginBottom: spacing.lg }}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{service?.name}</Text>
                  <Text style={styles.summaryVal}>₹{service?.price}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryVal}>
                    {selectedDate ? formatDate(selectedDate) : "—"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryVal}>{selectedTime ?? "—"}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Address</Text>
                  <Text style={styles.summaryVal} numberOfLines={2}>
                    {addresses.find((a) => a.id === selectedAddressId)?.line1 ??
                      "—"}
                  </Text>
                </View>
                {couponDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, { color: colors.success }]}
                    >
                      Coupon ({couponCode})
                    </Text>
                    <Text
                      style={[styles.summaryVal, { color: colors.success }]}
                    >
                      −₹{couponDiscount}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalVal}>₹{total}</Text>
                </View>
              </Card>

              <Text style={styles.sectionTitle}>Coupon</Text>
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter coupon code"
                  placeholderTextColor={colors.textMuted}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <Pressable
                  style={styles.applyBtn}
                  onPress={applyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.applyBtnText}>Apply</Text>
                  )}
                </Pressable>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>
                Add Notes
              </Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any specific instructions for the professional..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </>
          )}

          {/* ─── Step 3: Payment ─── */}
          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>Choose Payment Method</Text>
              {PAYMENT_METHODS.map((pm) => (
                <Pressable
                  key={pm.id}
                  style={[
                    styles.paymentCard,
                    paymentMethod === pm.id && styles.paymentCardSel,
                  ]}
                  onPress={() => setPaymentMethod(pm.id)}
                >
                  <View
                    style={[
                      styles.payIcon,
                      paymentMethod === pm.id && styles.payIconSel,
                    ]}
                  >
                    <Ionicons
                      name={pm.icon}
                      size={20}
                      color={
                        paymentMethod === pm.id ? colors.white : colors.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.payLabel,
                      paymentMethod === pm.id && styles.payLabelSel,
                    ]}
                  >
                    {pm.label}
                  </Text>
                  <View
                    style={[
                      styles.payRadio,
                      paymentMethod === pm.id && styles.payRadioSel,
                    ]}
                  >
                    {paymentMethod === pm.id && (
                      <View style={styles.payRadioInner} />
                    )}
                  </View>
                </Pressable>
              ))}

              <Card style={styles.amountSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service</Text>
                  <Text style={styles.summaryVal}>₹{service?.price}</Text>
                </View>
                {couponDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, { color: colors.success }]}
                    >
                      Discount
                    </Text>
                    <Text
                      style={[styles.summaryVal, { color: colors.success }]}
                    >
                      −₹{couponDiscount}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Pay Now</Text>
                  <Text style={styles.totalVal}>₹{total}</Text>
                </View>
              </Card>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {step < STEPS.length - 1 ? (
          <Button
            title={`Continue to ${STEPS[step + 1]}`}
            onPress={() => setStep(step + 1)}
            disabled={!canNext()}
          />
        ) : (
          <Button
            title={`Pay ₹${total} & Confirm`}
            onPress={handleBook}
            loading={booking}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  gpsBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  stepCounter: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepItem: { flex: 1, alignItems: "center", gap: spacing.xs },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 15,
  },
  stepLineDone: { backgroundColor: colors.primary },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  stepCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNum: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },
  stepNumActive: { color: colors.primary },
  stepLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
    fontWeight: fontWeight.medium,
  },
  stepLabelActive: { color: colors.primary, fontWeight: fontWeight.bold },

  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  dateRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  dateChip: {
    width: 70,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 2,
  },
  dateChipSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateDay: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  dateNum: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  dateMon: { fontSize: 11, color: colors.textMuted },
  dateSel: { color: colors.white },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  timeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  timeChipSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  timeTextSel: { color: colors.white },

  addressCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadow.subtle,
  },
  addressCardSel: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  addrRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  addrRadioSel: { borderColor: colors.primary },
  addrRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  addrLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  addrLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  addrLine: { fontSize: fontSize.xs, color: colors.textSecondary },
  defaultBadge: {
    backgroundColor: colors.successLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: fontWeight.bold,
  },
  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    marginTop: spacing.sm,
  },
  addAddressText: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  addrTypeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  addrTypeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addrTypeChipSel: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  addrTypeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  addrTypeTextSel: { color: colors.primary },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  summaryVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.lg,
  },
  totalRow: { borderBottomWidth: 0, marginTop: spacing.sm },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  totalVal: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.primary,
  },
  couponRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  couponInput: {
    flex: 1,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    minHeight: 100,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  paymentCardSel: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  payIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  payIconSel: { backgroundColor: colors.primary },
  payLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  payLabelSel: { color: colors.primary },
  payRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  payRadioSel: { borderColor: colors.primary },
  payRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  amountSummary: { marginTop: spacing.xxl },

  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});