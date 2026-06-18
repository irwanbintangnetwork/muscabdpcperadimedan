import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Papa from "papaparse";

import { Member, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

interface RowData {
  NIA?: string;
  nia?: string;
  NAMA?: string;
  Nama?: string;
  nama?: string;
  NAME?: string;
  FOTO_URL?: string;
  foto_url?: string;
  FOTO?: string;
  foto?: string;
  URL_ID?: string;
  url_id?: string;
  ID?: string;
  id?: string;
  [key: string]: string | undefined;
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
      {title}
    </Text>
  );
}

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
  badge,
}: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.row, { borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: danger ? "#FEE2E2" : colors.secondary,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={18}
          color={danger ? colors.destructive : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.rowLabel,
            { color: danger ? colors.destructive : colors.foreground },
          ]}
        >
          {label}
        </Text>
        {value ? (
          <Text
            style={[styles.rowValue, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : null}
      </View>
      {badge ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : (
        <Feather
          name="chevron-right"
          size={18}
          color={colors.mutedForeground}
        />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const {
    importMembers,
    members,
    attendance,
    clearAttendance,
    updateEventName,
    updateTotalSeats,
    updateCredentials,
    eventName,
    totalSeats,
    logout,
  } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [editingEvent, setEditingEvent] = useState(false);
  const [eventInput, setEventInput] = useState(eventName);
  const [editingSeats, setEditingSeats] = useState(false);
  const [seatsInput, setSeatsInput] = useState(
    totalSeats > 0 ? totalSeats.toString() : ""
  );
  const [editingCred, setEditingCred] = useState(false);
  const [credUser, setCredUser] = useState("");
  const [credPass, setCredPass] = useState("");
  const [importing, setImporting] = useState(false);

  const handleImportCSV = async () => {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/plain", "application/csv", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImporting(false);
        return;
      }

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const parsed = Papa.parse<RowData>(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });

      const newMembers: Member[] = parsed.data
        .map((row): Member => {
          const nia = (
            row.NIA ||
            row.nia ||
            row["Nomor Induk Advokat"] ||
            ""
          ).trim();
          const name = (
            row.NAMA ||
            row.Nama ||
            row.nama ||
            row.NAME ||
            row.name ||
            ""
          ).trim();
          const photoUrl = (
            row.FOTO_URL ||
            row.foto_url ||
            row.FOTO ||
            row.foto ||
            row.photo ||
            ""
          ).trim();
          const urlId = (
            row.URL_ID ||
            row.url_id ||
            row.ID ||
            row.id ||
            nia
          ).trim();
          return { nia, name, photoUrl, urlId };
        })
        .filter((m) => m.nia && m.name);

      if (newMembers.length === 0) {
        Alert.alert(
          "Gagal Impor",
          "Tidak ada data valid ditemukan. Pastikan CSV memiliki kolom NIA dan NAMA."
        );
        setImporting(false);
        return;
      }

      await importMembers(newMembers);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Berhasil",
        `${newMembers.length} anggota berhasil diimpor`
      );
    } catch (e) {
      Alert.alert("Error", "Gagal membaca file. Pastikan format CSV benar.");
    } finally {
      setImporting(false);
    }
  };

  const handleSaveEvent = () => {
    updateEventName(eventInput.trim() || eventName);
    setEditingEvent(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveSeats = () => {
    const n = parseInt(seatsInput, 10);
    updateTotalSeats(isNaN(n) ? 0 : n);
    setEditingSeats(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveCred = () => {
    if (!credUser.trim() || !credPass.trim()) {
      Alert.alert("Error", "Username dan password tidak boleh kosong");
      return;
    }
    Alert.alert(
      "Konfirmasi",
      "Yakin ubah credentials? Anda akan keluar dan harus login ulang.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ubah",
          onPress: async () => {
            await updateCredentials(credUser.trim(), credPass.trim());
            setEditingCred(false);
            setCredUser("");
            setCredPass("");
            logout();
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Hapus Data Presensi",
      `Ini akan menghapus ${attendance.length} data kehadiran. Lanjutkan?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearAttendance();
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Keluar dari aplikasi?", [
      { text: "Batal", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
        paddingHorizontal: 16,
        gap: 4,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>
        Pengaturan
      </Text>

      {/* Acara */}
      <SectionHeader title="INFORMASI ACARA" />
      <View
        style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}
      >
        {editingEvent ? (
          <View style={styles.editRow}>
            <TextInput
              style={[
                styles.editInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              value={eventInput}
              onChangeText={setEventInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveEvent}
            />
            <View style={styles.editBtns}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setEditingEvent(false)}
              >
                <Text style={[styles.editBtnText, { color: colors.foreground }]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveEvent}
              >
                <Text style={[styles.editBtnText, { color: "#fff" }]}>
                  Simpan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <SettingRow
            icon="calendar"
            label="Nama Acara"
            value={eventName}
            onPress={() => {
              setEventInput(eventName);
              setEditingEvent(true);
            }}
          />
        )}

        {editingSeats ? (
          <View style={[styles.editRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <TextInput
              style={[
                styles.editInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              value={seatsInput}
              onChangeText={setSeatsInput}
              keyboardType="number-pad"
              autoFocus
              placeholder="Jumlah anggota terdaftar"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="done"
              onSubmitEditing={handleSaveSeats}
            />
            <View style={styles.editBtns}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setEditingSeats(false)}
              >
                <Text style={[styles.editBtnText, { color: colors.foreground }]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveSeats}
              >
                <Text style={[styles.editBtnText, { color: "#fff" }]}>
                  Simpan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
            <SettingRow
              icon="users"
              label="Total Anggota Terdaftar"
              value={
                members.length > 0
                  ? `${members.length} (dari CSV)`
                  : totalSeats > 0
                  ? `${totalSeats} (manual)`
                  : "Belum diatur"
              }
              onPress={() => {
                setSeatsInput(totalSeats > 0 ? totalSeats.toString() : "");
                setEditingSeats(true);
              }}
            />
          </View>
        )}
      </View>

      {/* Data Anggota */}
      <SectionHeader title="DATA ANGGOTA" />
      <View
        style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}
      >
        <SettingRow
          icon="upload"
          label={importing ? "Mengimpor..." : "Impor Data CSV"}
          value={
            members.length > 0
              ? `${members.length} anggota dimuat`
              : "Belum ada data • Format: NIA, NAMA, FOTO_URL, URL_ID"
          }
          onPress={handleImportCSV}
          badge={members.length > 0 ? members.length.toString() : undefined}
        />
      </View>

      {/* Template CSV */}
      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: "#EFF6FF",
            borderRadius: colors.radius,
            borderLeftColor: "#1B3A6B",
          },
        ]}
      >
        <Feather name="info" size={16} color="#1B3A6B" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { color: "#1B3A6B" }]}>
            Format CSV yang diterima:
          </Text>
          <Text style={[styles.infoText, { color: "#1E40AF" }]}>
            {"NIA,NAMA,FOTO_URL,URL_ID\n24.10136,Irwan SH,https://...,12345"}
          </Text>
          <Text style={[styles.infoNote, { color: "#3B82F6" }]}>
            FOTO_URL dan URL_ID bersifat opsional. Jika URL_ID kosong, NIA digunakan sebagai pencocokan.
          </Text>
        </View>
      </View>

      {/* Keamanan */}
      <SectionHeader title="KEAMANAN" />
      <View
        style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}
      >
        {editingCred ? (
          <View style={styles.editRow}>
            <TextInput
              style={[
                styles.editInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              value={credUser}
              onChangeText={setCredUser}
              placeholder="Username baru"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoFocus
            />
            <TextInput
              style={[
                styles.editInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              value={credPass}
              onChangeText={setCredPass}
              placeholder="Password baru"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
            />
            <View style={styles.editBtns}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.secondary }]}
                onPress={() => {
                  setEditingCred(false);
                  setCredUser("");
                  setCredPass("");
                }}
              >
                <Text style={[styles.editBtnText, { color: colors.foreground }]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveCred}
              >
                <Text style={[styles.editBtnText, { color: "#fff" }]}>
                  Simpan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <SettingRow
            icon="lock"
            label="Ubah Password Panitia"
            value="Klik untuk mengubah username & password"
            onPress={() => setEditingCred(true)}
          />
        )}
      </View>

      {/* Data berbahaya */}
      <SectionHeader title="DATA" />
      <View
        style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}
      >
        <SettingRow
          icon="trash-2"
          label="Hapus Semua Data Presensi"
          value={
            attendance.length > 0
              ? `${attendance.length} data akan dihapus`
              : "Tidak ada data"
          }
          onPress={handleClearData}
          danger
        />
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[
          styles.logoutBtn,
          {
            borderColor: colors.destructive,
            borderRadius: colors.radius,
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>
          Logout
        </Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        Peradi Hadir v1.0 • DPC Peradi SAI
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 6,
    paddingLeft: 2,
  },
  card: {
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  editRow: {
    padding: 14,
    gap: 10,
  },
  editInput: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  editBtns: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  editBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderLeftWidth: 3,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontVariant: ["tabular-nums"],
  },
  infoNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    marginTop: 16,
  },
  logoutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    marginBottom: 8,
  },
});
