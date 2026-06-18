import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MemberCard } from "@/components/MemberCard";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

/**
 * Extract NIA/ID from the barcode URL.
 * Supports:
 *   - https://www.peradi.org/ktpa?nia=24.10136  → "24.10136"
 *   - https://peradisai.org/member/12345         → "12345"
 *   - Raw NIA string                             → as-is
 */
function extractIdFromUrl(raw: string): string {
  try {
    const trimmed = raw.trim();
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    // Peradi.org format: ?nia=...
    const niaParam = url.searchParams.get("nia");
    if (niaParam) return niaParam.trim();
    // Fallback: last non-empty path segment
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
    return raw;
  } catch {
    return raw;
  }
}

interface ModalState {
  visible: boolean;
  name: string;
  nia: string;
  photoUrl: string;
  isDuplicate: boolean;
  isUnknown: boolean;
  isInactive: boolean;
  scannedUrl: string;
  method: "offline" | "webview" | "manual";
}

const INITIAL_MODAL: ModalState = {
  visible: false,
  name: "",
  nia: "",
  photoUrl: "",
  isDuplicate: false,
  isUnknown: false,
  isInactive: false,
  scannedUrl: "",
  method: "offline",
};

export default function ScannerScreen() {
  const { findMemberByUrlId, markAttendance, attendance, eventName } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL);
  const [manualNia, setManualNia] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [lastScanned, setLastScanned] = useState("");
  const cooldown = useRef(false);

  const presentCount = attendance.length;

  const processId = useCallback(
    (rawId: string, rawUrl: string) => {
      const extracted = extractIdFromUrl(rawId);
      const member = findMemberByUrlId(extracted);

      if (member) {
        // Check inactive status
        const isInactive =
          member.status &&
          member.status.trim().toLowerCase() !== "aktif" &&
          member.status.trim() !== "";

        const isDuplicate =
          !isInactive &&
          attendance.some(
            (r) =>
              r.nia.replace(/[.\-\s]/g, "") ===
              member.nia.replace(/[.\-\s]/g, "")
          );

        setModal({
          visible: true,
          name: member.name,
          nia: member.nia,
          photoUrl: member.photoUrl,
          isDuplicate,
          isUnknown: false,
          isInactive: !!isInactive,
          scannedUrl: rawUrl,
          method: "offline",
        });
      } else {
        setModal({
          visible: true,
          name: "",
          nia: extracted,
          photoUrl: "",
          isDuplicate: false,
          isUnknown: true,
          isInactive: false,
          scannedUrl: rawUrl || extracted,
          method: "webview",
        });
      }
    },
    [findMemberByUrlId, attendance]
  );

  const handleBarcodeScan = useCallback(
    ({ data }: { data: string }) => {
      if (cooldown.current || modal.visible) return;
      if (data === lastScanned) return;
      cooldown.current = true;
      setLastScanned(data);
      setTimeout(() => { cooldown.current = false; }, 2000);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      processId(data, data);
    },
    [modal.visible, lastScanned, processId]
  );

  const handleConfirm = () => {
    const member = findMemberByUrlId(modal.nia);
    const status = member?.status ?? "";
    const result = markAttendance(
      { nia: modal.nia, name: modal.name, photoUrl: modal.photoUrl },
      modal.method,
      status
    );
    Haptics.notificationAsync(
      result === "success"
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
    setModal(INITIAL_MODAL);
    setLastScanned("");
  };

  const handleCancel = () => {
    setModal(INITIAL_MODAL);
    setLastScanned("");
    cooldown.current = false;
  };

  const handleOpenWebView = async () => {
    const url = modal.scannedUrl;
    setModal(INITIAL_MODAL);
    setLastScanned("");
    cooldown.current = false;
    if (url) {
      const fullUrl = url.includes("://") ? url : `https://${url}`;
      await WebBrowser.openBrowserAsync(fullUrl);
    }
  };

  const handleManualSubmit = () => {
    const nia = manualNia.trim();
    if (!nia) return;
    processId(nia, "");
    setManualNia("");
    setShowManual(false);
  };

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.permissionContainer,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 67,
          },
        ]}
      >
        <Feather name="camera-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
          Scanner Kamera
        </Text>
        <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>
          Fitur scan QR hanya tersedia di perangkat Android/iOS.
        </Text>
        <TouchableOpacity
          style={[
            styles.manualButton,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          onPress={() => setShowManual((v) => !v)}
        >
          <Feather name="edit-3" size={16} color="#fff" />
          <Text style={styles.manualButtonText}>Input NIA Manual</Text>
        </TouchableOpacity>

        {showManual && (
          <View
            style={[
              styles.manualInputBox,
              { borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <TextInput
              style={[styles.manualField, { color: colors.foreground }]}
              placeholder="Ketik NIA, contoh: 24.10136"
              placeholderTextColor={colors.mutedForeground}
              value={manualNia}
              onChangeText={setManualNia}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
            />
            <TouchableOpacity
              style={[styles.manualGo, { backgroundColor: colors.primary }]}
              onPress={handleManualSubmit}
            >
              <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.urlHint, { color: colors.mutedForeground }]}>
          Format URL barcode:{"\n"}https://www.peradi.org/ktpa?nia=24.10136
        </Text>

        <MemberCard
          visible={modal.visible}
          name={modal.name}
          nia={modal.nia}
          photoUrl={modal.photoUrl}
          isDuplicate={modal.isDuplicate}
          isInactive={modal.isInactive}
          isUnknown={modal.isUnknown}
          scannedUrl={modal.scannedUrl}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onOpenWebView={modal.isUnknown ? handleOpenWebView : undefined}
        />
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: "#000" }]} />
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.permissionContainer,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 80,
          },
        ]}
      >
        <Feather name="camera" size={56} color={colors.primary} />
        <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
          Izin Kamera Diperlukan
        </Text>
        <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>
          Aplikasi memerlukan akses kamera untuk memindai barcode KTA
        </Text>
        <TouchableOpacity
          style={[
            styles.permissionBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scanContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417", "code128", "code39", "ean13"],
        }}
        onBarcodeScanned={handleBarcodeScan}
      />

      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.scanHeader}>
          <Text style={styles.scanHeaderTitle} numberOfLines={1}>
            {eventName}
          </Text>
          <View style={styles.scanCountBadge}>
            <Feather name="users" size={13} color="#fff" />
            <Text style={styles.scanCountText}>{presentCount} Hadir</Text>
          </View>
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinderArea}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.viewfinderHint}>
            Arahkan ke QR barcode KTA Peradi
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.scanFooter}>
          <TouchableOpacity
            style={styles.manualTrigger}
            onPress={() => setShowManual((v) => !v)}
            activeOpacity={0.8}
          >
            <Feather name="edit-3" size={16} color="#fff" />
            <Text style={styles.manualTriggerText}>Input Manual NIA</Text>
          </TouchableOpacity>

          {showManual && (
            <View style={styles.manualRow}>
              <TextInput
                style={styles.manualInputField}
                placeholder="Ketik NIA, contoh: 24.10136"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={manualNia}
                onChangeText={setManualNia}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleManualSubmit}
                keyboardAppearance="dark"
              />
              <TouchableOpacity style={styles.manualGoBtn} onPress={handleManualSubmit}>
                <Feather name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <MemberCard
        visible={modal.visible}
        name={modal.name}
        nia={modal.nia}
        photoUrl={modal.photoUrl}
        isDuplicate={modal.isDuplicate}
        isInactive={modal.isInactive}
        isUnknown={modal.isUnknown}
        scannedUrl={modal.scannedUrl}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onOpenWebView={modal.isUnknown ? handleOpenWebView : undefined}
      />
    </View>
  );
}

const CORNER = 28;
const CORNER_THICK = 4;
const CORNER_COLOR = "#C9A84C";

const styles = StyleSheet.create({
  scanContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  scanHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  scanHeaderTitle: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  scanCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(22,163,74,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  scanCountText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  viewfinderArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  viewfinder: {
    width: 260,
    height: 260,
    position: "relative",
  },
  corner: { position: "absolute", width: CORNER, height: CORNER },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK,
    borderColor: CORNER_COLOR, borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK,
    borderColor: CORNER_COLOR, borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK,
    borderColor: CORNER_COLOR, borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK,
    borderColor: CORNER_COLOR, borderBottomRightRadius: 6,
  },
  viewfinderHint: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  scanFooter: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 14,
    alignItems: "center",
  },
  manualTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  manualTriggerText: {
    color: "#fff",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  manualRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  manualInputField: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  manualGoBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#C9A84C",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  permissionText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  permissionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  permissionBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  manualButtonText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  manualInputBox: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  manualField: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  manualGo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  urlHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
});
