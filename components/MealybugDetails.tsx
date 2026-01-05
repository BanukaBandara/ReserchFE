import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Share, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const MealybugDetails: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const shareInfo = async () => {
    const message =
      "Mealybug (Pineapple)\n\n" +
      "How to stop/control:\n" +
      "1) Remove heavily infested parts and destroy safely.\n" +
      "2) Control ants (ants protect mealybugs).\n" +
      "3) Keep field clean, reduce weeds, improve spacing/airflow.\n" +
      "4) Use strong water spray on early infestations.\n" +
      "5) Use IPM: encourage beneficial insects, apply soft options like insecticidal soap/horticultural oils as per label.\n" +
      "6) For severe outbreaks, consult an agriculture officer for approved treatments.\n\n" +
      "Prevention: inspect new planting material, avoid moving infested suckers, sanitize tools, monitor regularly.";

    await Share.share({ message });
  };

  const Section = ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    children: React.ReactNode;
  }) => (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginTop: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Ionicons name={icon} size={20} color="#059669" />
        <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: "700", color: "#111827" }}>
          {title}
        </Text>
      </View>
      <View>{children}</View>
    </View>
  );

  const Bullet = ({ text }: { text: string }) => (
    <View style={{ flexDirection: "row", marginBottom: 8 }}>
      <Text style={{ color: "#059669", fontWeight: "900", marginRight: 8 }}>•</Text>
      <Text style={{ flex: 1, color: "#374151", lineHeight: 20 }}>{text}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View style={{ paddingTop: insets.top }}>
        <LinearGradient
          colors={["#064e3b", "#047857", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 18,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                padding: 10,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.18)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
                Mealybug Details
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 13 }}>
                Identification • Control • Prevention
              </Text>
            </View>

            <TouchableOpacity
              onPress={shareInfo}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.18)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 8, fontWeight: "700" }}>Share</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Summary Card */}
          <View
            style={{
              backgroundColor: "#ecfdf5",
              borderColor: "#6ee7b7",
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
              marginTop: 12,
            }}
          >
            <Text style={{ color: "#065f46", fontWeight: "900", fontSize: 16 }}>
              Quick Summary
            </Text>
            <Text style={{ color: "#065f46", marginTop: 8, lineHeight: 20 }}>
              Mealybugs are sap-sucking insects. They often look like small white cottony clusters.
              They weaken pineapple plants and may spread diseases. Ant control is very important
              because ants protect mealybugs.
            </Text>
          </View>

          <Section title="How to identify" icon="search-outline">
            <Bullet text="White cotton-like clusters on leaf bases, joints, or roots." />
            <Bullet text="Sticky honeydew on leaves; black sooty mold may grow." />
            <Bullet text="Yellowing, stunted growth, weak plant vigor." />
            <Bullet text="Many ants walking on plants (ants farm mealybugs)." />
          </Section>

          <Section title="Why it’s harmful" icon="warning-outline">
            <Bullet text="Sucks plant sap → reduces growth and fruit quality." />
            <Bullet text="Honeydew attracts mold → blocks sunlight on leaves." />
            <Bullet text="Can spread plant diseases (risk increases if infestations are ignored)." />
          </Section>

          <Section title="How to stop/control (IPM steps)" icon="shield-checkmark-outline">
            <Text style={{ fontWeight: "800", color: "#111827", marginBottom: 10 }}>
              Step 1 — Reduce infestation (physical/mechanical)
            </Text>
            <Bullet text="Remove heavily infested leaves/parts and dispose safely (don’t leave them in the field)." />
            <Bullet text="For light infestations, use a strong water spray to knock insects off." />

            <Text style={{ fontWeight: "800", color: "#111827", marginTop: 12, marginBottom: 10 }}>
              Step 2 — Control ants (very important)
            </Text>
            <Bullet text="Remove ant nests around the plot and reduce food sources." />
            <Bullet text="Use approved ant control methods suitable for your area (follow local guidance/labels)." />

            <Text style={{ fontWeight: "800", color: "#111827", marginTop: 12, marginBottom: 10 }}>
              Step 3 — Field hygiene (cultural control)
            </Text>
            <Bullet text="Remove weeds and plant debris where pests hide." />
            <Bullet text="Improve spacing and airflow; avoid excessive nitrogen fertilizer." />
            <Bullet text="Avoid moving infested suckers/planting material to new fields." />

            <Text style={{ fontWeight: "800", color: "#111827", marginTop: 12, marginBottom: 10 }}>
              Step 4 — Safer treatment options (use carefully)
            </Text>
            <Bullet text="Insecticidal soaps or horticultural oils can help in early stages (use exactly as label says)." />
            <Bullet text="Test a small area first to avoid leaf burn; avoid spraying in strong sun/heat." />
            <Bullet text="If infestation is severe, consult an agriculture officer for locally approved pesticide guidance." />
          </Section>

          <Section title="Prevention tips" icon="leaf-outline">
            <Bullet text="Inspect plants weekly (especially leaf bases and crowns)." />
            <Bullet text="Quarantine/inspect new planting material before introducing." />
            <Bullet text="Clean tools/equipment when moving between plots." />
            <Bullet text="Keep edges/ditches clean to reduce ant movement." />
          </Section>

          <Section title="When to get help" icon="call-outline">
            <Bullet text="If many plants are infested across the field." />
            <Bullet text="If plants show heavy stunting or repeated re-infestation." />
            <Bullet text="If you suspect disease spread or the pest keeps coming back even after cleanup." />
            <TouchableOpacity
              onPress={() => Alert.alert("Tip", "Contact your local Agriculture Instructor/Extension Officer for an approved control plan.")}
              style={{
                marginTop: 10,
                backgroundColor: "#111827",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Show Advice</Text>
            </TouchableOpacity>
          </Section>

          {/* Bottom actions */}
          <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flex: 1,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: "#111827", fontWeight: "800" }}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareInfo}
              style={{
                flex: 1,
                backgroundColor: "#059669",
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Share</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default MealybugDetails;
