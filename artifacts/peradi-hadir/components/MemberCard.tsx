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
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius * 2,
            },
          ]}
        >
          {isDuplicate && (
            <View
              style={[
                styles.duplicateBanner,
                { backgroundColor: "#F59E0B" },
              ]}
            >
              <Feather name="alert-triangle" size={14} color="#fff" />
              <Text style={styles.duplicateBannerText}>
                Anggota ini sudah tercatat hadir
              </Text>
            </View>
          )}

          {isUnknown ? (
            <View style={styles.unknownContainer}>
              <View
                style={[
                  styles.unknownIcon,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Feather name="help-circle" size={40} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.unknownTitle, { color: colors.foreground }]}>
                Data Tidak Ditemukan
              </Text>
              <Text style={[styles.unknownSub, { color: colors.mutedForeground }]}>
                Anggota tidak ada di database lokal
              </Text>
              {scannedUrl ? (
                <Text
                  style={[styles.urlText, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {scannedUrl}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.memberInfo}>
              <View
                style={[
                  styles.photoContainer,
                  { backgroundColor: colors.secondary },
                ]}
              >
                {photoUrl && !imgError ? (
                  <>
                    {imgLoading && (
                      <ActivityIndicator
                        color={colors.primary}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.photo}
                      onLoad={() => setImgLoading(false)}
                      onError={() => {
                        setImgError(true);
                        setImgLoading(false);
                      }}
                    />
                  </>
                ) : (
                  <Feather name="user" size={52} color={colors.mutedForeground} />
                )}
              </View>

              <Text style={[styles.name, { color: colors.foreground }]}>
                {name}
              </Text>
              <View
                style={[
                  styles.niaBadge,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Text style={[styles.niaLabel, { color: colors.mutedForeground }]}>
                  NIA
                </Text>
                <Text style={[styles.niaValue, { color: colors.primary }]}>
                  {nia}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            {isUnknown && onOpenWebView ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                  <Text
                    style={[styles.actionBtnText, { color: colors.foreground }]}
                  >
                    Batal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.primary, flex: 1.5 },
                  ]}
                  onPress={onOpenWebView}
                  activeOpacity={0.7}
                >
                  <Feather name="external-link" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                    Buka Website
                  </Text>
                </TouchableOpacity>
              </>
            ) : isDuplicate ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                  <Text
                    style={[styles.actionBtnText, { color: colors.foreground }]}
                  >
                    Tutup
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: "#F59E0B", flex: 1.2 },
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                >
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                    Konfirmasi Ulang
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                  <Text
                    style={[styles.actionBtnText, { color: colors.foreground }]}
                  >
                    Batal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.success,
                      flex: 1.5,
                    },
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                >
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                    Konfirmasi Hadir
                  </Text>
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
  duplicateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  duplicateBannerText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  memberInfo: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
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
  name: {
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
