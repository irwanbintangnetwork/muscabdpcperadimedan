import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AgendaItem, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

type StatusKey = AgendaItem["status"];

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bg: string; icon: string }> = {
  menunggu:    { label: "Menunggu",    color: "#6B7280", bg: "#F3F4F6", icon: "clock" },
  berlangsung: { label: "Berlangsung", color: "#1D4ED8", bg: "#DBEAFE", icon: "play-circle" },
  selesai:     { label: "Selesai",     color: "#15803D", bg: "#DCFCE7", icon: "check-circle" },
};

const NEXT_STATUS: Record<StatusKey, StatusKey> = {
  menunggu:    "berlangsung",
  berlangsung: "selesai",
  selesai:     "menunggu",
};

function AgendaRow({
  item,
  index,
  total,
  onPress,
  onLongPress,
}: {
  item: AgendaItem;
  index: number;
  total: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colors = useColors();
  const cfg = STATUS_CONFIG[item.status];
  const isLast = index === total - 1;

  return (
    <View style={styles.rowWrapper}>
      {/* Timeline line + dot */}
      <View style={styles.timeline}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: item.status === "menunggu" ? "#D1D5DB" : cfg.color,
              borderColor: item.status === "berlangsung" ? cfg.color : "transparent",
              borderWidth: item.status === "berlangsung" ? 2 : 0,
            },
          ]}
        />
        {!isLast && (
          <View
            style={[
              styles.line,
              { backgroundColor: item.status === "selesai" ? "#15803D" : "#E5E7EB" },
            ]}
          />
        )}
      </View>

      {/* Content card */}
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor:
              item.status === "berlangsung" ? cfg.color : colors.border,
            borderWidth: item.status === "berlangsung" ? 1.5 : 1,
            marginBottom: isLast ? 0 : 12,
          },
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {item.time} WIB
          </Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

export default function AgendaScreen() {
  const { agendaItems, updateAgendaStatus, addAgendaItem, removeAgendaItem, resetAgenda, eventName } =
    useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [showAdd, setShowAdd] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const sorted = [...agendaItems].sort((a, b) => a.order - b.order);
  const done = sorted.filter((i) => i.status === "selesai").length;
  const active = sorted.filter((i) => i.status === "berlangsung").length;

  const handlePress = (item: AgendaItem) => {
    const next = NEXT_STATUS[item.status];
    const labels: Record<StatusKey, string> = {
      menunggu:    "tandai Menunggu",
      berlangsung: "mulai (Berlangsung)",
      selesai:     "tandai Selesai",
    };
    Alert.alert(
      item.title,
      `Ubah status menjadi "${STATUS_CONFIG[next].label}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: STATUS_CONFIG[next].label,
          onPress: () => {
            updateAgendaStatus(item.id, next);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ]
    );
  };

  const handleLongPress = (item: AgendaItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(item.title, "Pilih tindakan:", [
      { text: "Batal", style: "cancel" },
      {
        text: "▶  Berlangsung",
        onPress: () => updateAgendaStatus(item.id, "berlangsung"),
      },
      {
        text: "✓  Selesai",
        onPress: () => updateAgendaStatus(item.id, "selesai"),
      },
      {
        text: "○  Menunggu",
        onPress: () => updateAgendaStatus(item.id, "menunggu"),
      },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () =>
          Alert.alert("Hapus Agenda", `Hapus "${item.title}"?`, [
            { text: "Batal", style: "cancel" },
            { text: "Hapus", style: "destructive", onPress: () => removeAgendaItem(item.id) },
          ]),
      },
    ]);
  };

  const handleAddItem = () => {
    if (!newTime.trim() || !newTitle.trim()) {
      Alert.alert("Error", "Waktu dan judul agenda wajib diisi.");
      return;
    }
    addAgendaItem({
      time: newTime.trim(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: "menunggu",
      order: (agendaItems[agendaItems.length - 1]?.order ?? 0) + 1,
    });
    setNewTime("");
    setNewTitle("");
    setNewDesc("");
    setShowAdd(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16, backgroundColor: "#1B3A6B" },
        ]}
      >
        <Text style={styles.headerTitle}>Agenda Sidang</Text>
        <Text style={styles.headerSub} numberOfLines={1}>
          {eventName}
        </Text>

        {/* Progress strip */}
        <View style={styles.progressRow}>
          <View style={styles.progressChip}>
            <View style={[styles.progressDot, { backgroundColor: "#DCFCE7" }]} />
            <Text style={styles.progressText}>{done} Selesai</Text>
          </View>
          {active > 0 && (
            <View style={styles.progressChip}>
              <View style={[styles.progressDot, { backgroundColor: "#BFDBFE" }]} />
              <Text style={styles.progressText}>{active} Berlangsung</Text>
            </View>
          )}
          <View style={styles.progressChip}>
            <View style={[styles.progressDot, { backgroundColor: "#E5E7EB" }]} />
            <Text style={styles.progressText}>
              {sorted.length - done - active} Menunggu
            </Text>
          </View>
        </View>
      </View>

      {/* Tip */}
      <View style={[styles.tip, { backgroundColor: "#EFF6FF", borderLeftColor: "#1B3A6B" }]}>
        <Feather name="info" size={13} color="#1B3A6B" />
        <Text style={[styles.tipText, { color: "#1E40AF" }]}>
          Tap item untuk ubah status · Tahan lama untuk opsi lengkap
        </Text>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {sorted.map((item, idx) => (
          <AgendaRow
            key={item.id}
            item={item}
            index={idx}
            total={sorted.length}
            onPress={() => handlePress(item)}
            onLongPress={() => handleLongPress(item)}
          />
        ))}
      </ScrollView>

      {/* FAB buttons */}
      <View style={[styles.fabRow, { bottom: insets.bottom + 88 }]}>
        <TouchableOpacity
          style={[styles.fabSecondary, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() =>
            Alert.alert("Reset Agenda", "Kembalikan semua status ke Menunggu?", [
              { text: "Batal", style: "cancel" },
              { text: "Reset", style: "destructive", onPress: () => { resetAgenda(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
            ])
          }
          activeOpacity={0.8}
        >
          <Feather name="refresh-ccw" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: "#1B3A6B" }]}
          onPress={() => setShowAdd(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.fabText}>Tambah Agenda</Text>
        </TouchableOpacity>
      </View>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Tambah Agenda Baru
            </Text>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Waktu (mis. 16.00)
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="08.00"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Judul Agenda
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Contoh: Sidang Pleno V"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Deskripsi (opsional)
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, minHeight: 60 }]}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Keterangan singkat agenda"
              placeholderTextColor={colors.mutedForeground}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btnCancel, { borderColor: colors.border }]}
                onPress={() => setShowAdd(false)}
              >
                <Text style={[styles.btnCancelText, { color: colors.mutedForeground }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSave, { backgroundColor: "#1B3A6B" }]}
                onPress={handleAddItem}
              >
                <Text style={styles.btnSaveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  progressChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  progressText: {
    fontSize: 11,
    color: "#fff",
    fontFamily: "Inter_500Medium",
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  tipText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  rowWrapper: {
    flexDirection: "row",
    gap: 12,
  },
  timeline: {
    width: 20,
    alignItems: "center",
    paddingTop: 14,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -4,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  time: { fontSize: 11, fontFamily: "Inter_500Medium" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  desc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 17 },
  fabRow: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  fabSecondary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  fabText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  btnCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  btnCancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  btnSave: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnSaveText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
