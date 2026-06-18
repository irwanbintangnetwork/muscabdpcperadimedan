import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AttendanceRecord, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const METHOD_LABEL: Record<string, string> = {
  offline: "Lokal",
  webview: "Web",
  manual: "Manual",
};

const METHOD_COLOR: Record<string, string> = {
  offline: "#16A34A",
  webview: "#1B3A6B",
  manual: "#C9A84C",
};

function AttendanceItem({
  record,
  onRemove,
}: {
  record: AttendanceRecord;
  onRemove: (nia: string) => void;
}) {
  const colors = useColors();
  const time = new Date(record.timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = new Date(record.timestamp).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });

  return (
    <View
      style={[
        styles.item,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.secondary },
        ]}
      >
        <Feather name="user-check" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.itemName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {record.name || record.nia}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemNia, { color: colors.mutedForeground }]}>
            NIA {record.nia}
          </Text>
          <View
            style={[
              styles.methodBadge,
              { backgroundColor: METHOD_COLOR[record.method] + "22" },
            ]}
          >
            <Text
              style={[
                styles.methodText,
                { color: METHOD_COLOR[record.method] },
              ]}
            >
              {METHOD_LABEL[record.method]}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemTime, { color: colors.foreground }]}>
          {time}
        </Text>
        <Text style={[styles.itemDate, { color: colors.mutedForeground }]}>
          {date}
        </Text>
        <TouchableOpacity
          onPress={() => onRemove(record.nia)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LogScreen() {
  const { attendance, removeAttendance, clearAttendance, eventName } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filtered = attendance.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.nia.includes(search)
  );

  const handleRemove = (nia: string) => {
    Alert.alert("Hapus Presensi", "Yakin hapus data kehadiran ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          removeAttendance(nia);
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Hapus Semua Data",
      "Ini akan menghapus SELURUH data presensi. Pastikan sudah diekspor!",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus Semua",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearAttendance();
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    const rows = [
      "No,NIA,Nama,Waktu,Metode",
      ...attendance.map((r, i) => {
        const dt = new Date(r.timestamp).toLocaleString("id-ID");
        return `${i + 1},${r.nia},"${r.name}",${dt},${METHOD_LABEL[r.method]}`;
      }),
    ].join("\n");

    const summary = `REKAPITULASI PRESENSI\n${eventName}\nTotal Hadir: ${attendance.length} orang\n\n${rows}`;

    if (Platform.OS === "web") {
      alert(summary);
      return;
    }

    try {
      const { FileSystem } = await import("expo-file-system");
      const path = FileSystem.cacheDirectory + "presensi_peradi.csv";
      await FileSystem.writeAsStringAsync(path, summary, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const can = await Sharing.isAvailableAsync();
      if (can) await Sharing.shareAsync(path, { mimeType: "text/csv" });
    } catch {
      Alert.alert("Error", "Gagal mengekspor data");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Daftar Presensi
            </Text>
            <Text style={[styles.headerCount, { color: colors.mutedForeground }]}>
              {attendance.length} anggota hadir
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.headerBtn,
                { backgroundColor: colors.secondary },
              ]}
              onPress={handleExport}
            >
              <Feather name="download" size={16} color={colors.primary} />
            </TouchableOpacity>
            {attendance.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.headerBtn,
                  { backgroundColor: "#FEE2E2" },
                ]}
                onPress={handleClearAll}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.secondary, borderRadius: colors.radius },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Cari nama atau NIA..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <AttendanceItem record={item} onRemove={handleRemove} />
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          gap: 8,
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather
              name={search ? "search" : "clipboard"}
              size={44}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search ? "Tidak ditemukan" : "Belum ada presensi"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {search
                ? "Coba kata kunci lain"
                : "Scan KTA anggota untuk mencatat kehadiran"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  headerCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  itemNia: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  methodBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  itemTime: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  itemDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
