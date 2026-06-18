import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface MemberCardProps {
  visible: boolean;
  name: string;
  nia: string;
  photoUrl?: string;
  isDuplicate?: boolean;
  isInactive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenWebView?: () => void;
  isUnknown?: boolean;
  scannedUrl?: string;
}

export function MemberCard({
  visible,
  name,
  nia,
  photoUrl,
  isDuplicate,
  isInactive,
  onConfirm,
  onCancel,
  onOpenWebView,
  isUnknown,
  scannedUrl,
}: MemberCardProps) {
  const colors = useColors();
  const [imgError, setImgError] = React.useState(false);
  const [imgLoading, setImgLoading] = React.useState(true);

  React.useEffect(() => {
    setImgError(false);
    setImgLoading(true);
  }, [photoUrl, visible]);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderRadius: colors.radius * 2 },
          ]}
        >
          {/* INACTIVE BANNER */}
          {isInactive && (
            <View style={[styles.banner, { backgroundColor: "#DC2626" }]}>
              <Feather name="x-circle" size={15} color="#fff" />
              <Text style={styles.bannerText}>
                Keanggotaan TIDAK AKTIF — Akses Ditolak
              </Text>
            </View>
          )}

          {/* DUPLICATE BANNER */}
          {!isInactive && isDuplicate && (
            <View style={[styles.banner, { backgroundColor: "#F59E0B" }]}>
              <Feather name="alert-triangle" size={14} color="#fff" />
              <Text style={styles.bannerText}>Anggota ini sudah tercatat hadir</Text>
            </View>
          )}

          {/* INACTIVE STATE */}
          {isInactive ? (
            <View style={styles.inactiveContainer}>
              <View style={[styles.inactiveIcon, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="user-x" size={44} color="#DC2626" />
              </View>
              <Text style={[styles.memberName, { color: colors.foreground }]}>
                {name}
              </Text>
              <View style={[styles.niaBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.niaLabel, { color: colors.mutedForeground }]}>NIA</Text>
                <Text style={[styles.niaValue, { color: colors.primary }]}>{nia}</Text>
              </View>
              <View style={[styles.inactiveBadge]}>
                <Feather name="shield-off" size={14} color="#DC2626" />
                <Text style={styles.inactiveBadgeText}>Status: TIDAK AKTIF</Text>
              </View>
              <Text style={styles.inactiveDesc}>
                Anggota ini tidak memenuhi syarat kehadiran Muscab karena status keanggotaannya tidak aktif.
              </Text>
            </View>
          ) : isUnknown ? (
            /* UNKNOWN STATE */
            <View style={styles.unknownContainer}>
              <View style={[styles.unknownIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="help-circle" size={40} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.unknownTitle, { color: colors.foreground }]}>
                Data Tidak Ditemukan
              </Text>
              <Text style={[styles.unknownSub, { color: colors.mutedForeground }]}>
                Anggota tidak ada di database lokal
              </Text>
              {scannedUrl ? (
                <Text style={[styles.urlText, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {scannedUrl}
                </Text>
              ) : null}
            </View>
          ) : (
            /* FOUND / KNOWN STATE */
            <View style={styles.memberInfo}>
              <View style={[styles.photoContainer, { backgroundColor: colors.secondary }]}>
                {photoUrl && !imgError ? (
                  <>
                    {imgLoading && (
                      <ActivityIndicator color={colors.primary} style={StyleSheet.absoluteFill} />
                    )}
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.photo}
                      onLoad={() => setImgLoading(false)}
                      onError={() => { setImgError(true); setImgLoading(false); }}
                    />
                  </>
                ) : (
                  <Feather name="user" size={52} color={colors.mutedForeground} />
                )}
              </View>
              <Text style={[styles.memberName, { color: colors.foreground }]}>
                {name}
              </Text>
              <View style={[styles.niaBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.niaLabel, { color: colors.mutedForeground }]}>NIA</Text>
                <Text style={[styles.niaValue, { color: colors.primary }]}>{nia}</Text>
              </View>
              <View style={styles.activeBadge}>
                <Feather name="shield" size={13} color="#16A34A" />
                <Text style={styles.activeBadgeText}>Keanggotaan Aktif</Text>
              </View>
            </View>
          )}

          {/* ACTION BUTTONS */}
          <View style={styles.actions}>
            {isInactive ? (
              /* Inactive: only close */
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#DC2626", flex: 1 }]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Feather name="x" size={18} color="#fff" />
                <Text style={[styles.actionBtnText, { color: "#fff" }]}>Tutup</Text>
              </TouchableOpacity>
            ) : isUnknown && onOpenWebView ? (
              /* Unknown: open website or cancel */
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary, flex: 1.5 }]}
                  onPress={onOpenWebView}
                  activeOpacity={0.7}
                >
                  <Feather name="external-link" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>Buka Website</Text>
                </TouchableOpacity>
              </>
            ) : isDuplicate ? (
              /* Duplicate: close or re-confirm */
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Tutup</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#F59E0B", flex: 1.2 }]}
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                >
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>Konfirmasi Ulang</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Normal: cancel or confirm */
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.success, flex: 1.5 }]}
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                >
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>Konfirmasi Hadir</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "web" ? 34 : 0,
  },
  card: {
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  bannerText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  memberInfo: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  photoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  memberName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  niaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  niaLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  niaValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: "#16A34A",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  inactiveContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  inactiveIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  inactiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  inactiveBadgeText: {
    color: "#DC2626",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  inactiveDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  unknownContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  unknownIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  unknownTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  unknownSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  urlText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
