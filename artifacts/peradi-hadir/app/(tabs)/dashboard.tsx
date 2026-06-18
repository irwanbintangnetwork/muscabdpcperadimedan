import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QuorumBar } from "@/components/QuorumBar";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color: string;
  bg: string;
}

function StatCard({ icon, value, label, color, bg }: StatCardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderRadius: colors.radius },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { attendance, members, totalSeats, eventName } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const total = members.length > 0 ? members.length : totalSeats;
  const present = attendance.length;
  const pct = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
  const quorumReached = total > 0 && present / total >= 0.5;

  const recentAttendees = attendance.slice(0, 5);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
        paddingHorizontal: 16,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header banner */}
      <LinearGradient
        colors={["#1B3A6B", "#0D2147"]}
        style={[styles.headerBanner, { borderRadius: colors.radius * 1.5 }]}
      >
        <View style={styles.bannerContent}>
          <Feather name="shield" size={24} color="#C9A84C" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{eventName}</Text>
            <Text style={styles.bannerSub}>Dashboard Kuorum Real-Time</Text>
          </View>
          <View
            style={[
              styles.quorumBadge,
              { backgroundColor: quorumReached ? "#16A34A" : "#C9A84C" },
            ]}
          >
            <Text style={styles.quorumBadgeText}>
              {quorumReached ? "KUORUM" : "BELUM"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stat cards */}
      <View style={styles.statsRow}>
        <StatCard
          icon="users"
          value={total || "-"}
          label="Total Terdaftar"
          color="#1B3A6B"
          bg="#E3E9F5"
        />
        <StatCard
          icon="user-check"
          value={present}
          label="Sudah Hadir"
          color="#16A34A"
          bg="#DCFCE7"
        />
        <StatCard
          icon="percent"
          value={`${pct}%`}
          label="Kehadiran"
          color="#C9A84C"
          bg="#FEF3C7"
        />
      </View>

      {/* Quorum bar */}
      <View
        style={[
          styles.quorumSection,
          { backgroundColor: colors.card, borderRadius: colors.radius },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Status Kuorum
        </Text>
        <QuorumBar present={present} total={total} threshold={50} />
      </View>

      {/* Keputusan status */}
      <View
        style={[
          styles.statusSection,
          {
            backgroundColor: quorumReached ? "#DCFCE7" : "#FEF3C7",
            borderRadius: colors.radius,
            borderLeftWidth: 4,
            borderLeftColor: quorumReached ? "#16A34A" : "#C9A84C",
          },
        ]}
      >
        <Feather
          name={quorumReached ? "check-circle" : "clock"}
          size={22}
          color={quorumReached ? "#16A34A" : "#C9A84C"}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.statusTitle,
              { color: quorumReached ? "#166534" : "#92400E" },
            ]}
          >
            {quorumReached
              ? "Rapat Dapat Dimulai"
              : "Menunggu Peserta"}
          </Text>
          <Text
            style={[
              styles.statusSub,
              { color: quorumReached ? "#166534" : "#92400E" },
            ]}
          >
            {quorumReached
              ? `Kuorum 50% tercapai dengan ${present} peserta hadir`
              : total > 0
              ? `Masih perlu ${Math.ceil(total * 0.5) - present} peserta lagi untuk kuorum`
              : "Impor data anggota di Pengaturan untuk hitung kuorum"}
          </Text>
        </View>
      </View>

      {/* Recent attendees */}
      {recentAttendees.length > 0 && (
        <View
          style={[
            styles.recentSection,
            { backgroundColor: colors.card, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Peserta Terakhir Hadir
          </Text>
          {recentAttendees.map((r) => (
            <View
              key={r.id}
              style={[styles.recentItem, { borderColor: colors.border }]}
            >
              <View
                style={[
                  styles.recentAvatar,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Feather name="user" size={16} color={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.recentName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {r.name || r.nia}
                </Text>
                <Text style={[styles.recentNia, { color: colors.mutedForeground }]}>
                  NIA {r.nia}
                </Text>
              </View>
              <Text style={[styles.recentTime, { color: colors.mutedForeground }]}>
                {formatTime(r.timestamp)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerBanner: {
    padding: 18,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerTitle: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  quorumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  quorumBadgeText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  quorumSection: {
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
  },
  statusTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  statusSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    lineHeight: 18,
  },
  recentSection: {
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  recentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  recentName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  recentNia: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  recentTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
