import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Candidate, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

function CandidateBar({
  candidate,
  totalVotes,
  rank,
}: {
  candidate: Candidate;
  totalVotes: number;
  rank: number;
}) {
  const colors = useColors();
  const pct = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
  const isLeading = rank === 1 && candidate.voteCount > 0;

  return (
    <View
      style={[
        styles.candidateBar,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderLeftWidth: 4,
          borderLeftColor: isLeading ? colors.accent : colors.border,
        },
      ]}
    >
      <View style={styles.candidateBarHeader}>
        <View style={styles.candidateLeft}>
          <View
            style={[
              styles.rankBadge,
              {
                backgroundColor: isLeading ? colors.accent : colors.secondary,
              },
            ]}
          >
            <Text
              style={[
                styles.rankText,
                { color: isLeading ? "#fff" : colors.mutedForeground },
              ]}
            >
              #{rank}
            </Text>
          </View>
          <View>
            <Text style={[styles.candidateName, { color: colors.foreground }]}>
              {candidate.name}
            </Text>
            {candidate.nia ? (
              <Text style={[styles.candidateNia, { color: colors.mutedForeground }]}>
                NIA {candidate.nia}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.candidateRight}>
          <Text style={[styles.voteCount, { color: isLeading ? colors.accent : colors.foreground }]}>
            {candidate.voteCount}
          </Text>
          <Text style={[styles.voteLabel, { color: colors.mutedForeground }]}>
            suara
          </Text>
        </View>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: isLeading ? colors.accent : colors.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.pctText, { color: colors.mutedForeground }]}>
        {pct.toFixed(1)}%
      </Text>
    </View>
  );
}

export default function VotingScreen() {
  const {
    candidates,
    votes,
    votingOpen,
    attendance,
    addCandidate,
    removeCandidate,
    castVote,
    toggleVoting,
    clearVotes,
    findMemberByNia,
  } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [voterNia, setVoterNia] = useState("");
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [currentVoter, setCurrentVoter] = useState<{ nia: string; name: string } | null>(null);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandName, setNewCandName] = useState("");
  const [newCandNia, setNewCandNia] = useState("");

  const totalVotes = votes.length;
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

  const handleStartVote = () => {
    const nia = voterNia.trim();
    if (!nia) return;

    const alreadyVoted = votes.some(
      (v) => v.voterNia.replace(/[.\-\s]/g, "") === nia.replace(/[.\-\s]/g, "")
    );
    if (alreadyVoted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Sudah Memilih", "Anggota dengan NIA ini sudah memberikan suara.");
      return;
    }

    const isPresent = attendance.some(
      (r) => r.nia.replace(/[.\-\s]/g, "") === nia.replace(/[.\-\s]/g, "")
    );
    if (!isPresent) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Belum Hadir",
        "Anggota ini belum terdaftar sebagai peserta hadir. Lakukan check-in terlebih dahulu di tab Scan."
      );
      return;
    }

    const member = findMemberByNia(nia);
    setCurrentVoter({ nia, name: member?.name ?? nia });
    setSelectedCandidate(null);
    setShowVoteModal(true);
    setVoterNia("");
  };

  const handleConfirmVote = () => {
    if (!currentVoter || !selectedCandidate) return;
    const result = castVote(currentVoter.nia, selectedCandidate.id);
    if (result === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowVoteModal(false);
      setCurrentVoter(null);
      setSelectedCandidate(null);
      Alert.alert("Suara Diterima", `Terima kasih, ${currentVoter.name} telah memilih.`);
    }
  };

  const handleAddCandidate = () => {
    if (!newCandName.trim()) return;
    addCandidate(newCandName.trim(), newCandNia.trim());
    setNewCandName("");
    setNewCandNia("");
    setShowAddCandidate(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleVoting = () => {
    Alert.alert(
      votingOpen ? "Tutup Sesi Voting?" : "Buka Sesi Voting?",
      votingOpen
        ? "Peserta tidak akan bisa memberikan suara setelah sesi ditutup."
        : `${attendance.length} peserta hadir akan dapat memberikan suara.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: votingOpen ? "Tutup Voting" : "Buka Voting",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toggleVoting();
          },
        },
      ]
    );
  };

  const handleClearVotes = () => {
    Alert.alert(
      "Reset Voting",
      "Ini akan menghapus semua suara. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearVotes();
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          paddingHorizontal: 16,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header banner */}
        <LinearGradient
          colors={["#1B3A6B", "#0D2147"]}
          style={[styles.headerBanner, { borderRadius: colors.radius * 1.5 }]}
        >
          <View style={styles.bannerRow}>
            <Feather name="check-square" size={22} color="#C9A84C" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>E-Voting Ketua DPC</Text>
              <Text style={styles.bannerSub}>PERADI SAI Medan</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: votingOpen ? "#16A34A" : "#6B7280" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: votingOpen ? "#BBF7D0" : "#D1D5DB" },
                ]}
              />
              <Text style={styles.statusText}>
                {votingOpen ? "OPEN" : "CLOSED"}
              </Text>
            </View>
          </View>

          <View style={styles.bannerStats}>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatValue}>{attendance.length}</Text>
              <Text style={styles.bannerStatLabel}>Peserta Hadir</Text>
            </View>
            <View style={styles.bannerStatDivider} />
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatValue}>{totalVotes}</Text>
              <Text style={styles.bannerStatLabel}>Suara Masuk</Text>
            </View>
            <View style={styles.bannerStatDivider} />
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatValue}>
                {attendance.length > 0
                  ? `${((totalVotes / attendance.length) * 100).toFixed(0)}%`
                  : "0%"}
              </Text>
              <Text style={styles.bannerStatLabel}>Partisipasi</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Admin controls */}
        <View style={styles.adminRow}>
          <TouchableOpacity
            style={[
              styles.adminBtn,
              {
                backgroundColor: votingOpen ? "#FEE2E2" : "#DCFCE7",
                borderRadius: colors.radius,
                flex: 1,
              },
            ]}
            onPress={handleToggleVoting}
            activeOpacity={0.7}
          >
            <Feather
              name={votingOpen ? "lock" : "unlock"}
              size={16}
              color={votingOpen ? "#DC2626" : "#16A34A"}
            />
            <Text
              style={[
                styles.adminBtnText,
                { color: votingOpen ? "#DC2626" : "#16A34A" },
              ]}
            >
              {votingOpen ? "Tutup Voting" : "Buka Voting"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.adminBtn,
              { backgroundColor: colors.secondary, borderRadius: colors.radius },
            ]}
            onPress={handleClearVotes}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.adminBtn,
              { backgroundColor: colors.secondary, borderRadius: colors.radius },
            ]}
            onPress={() => setShowAddCandidate((v) => !v)}
            activeOpacity={0.7}
          >
            <Feather name="user-plus" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Add candidate form */}
        {showAddCandidate && (
          <View
            style={[
              styles.addCandForm,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.addCandTitle, { color: colors.foreground }]}>
              Tambah Calon
            </Text>
            <TextInput
              style={[
                styles.addCandInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: 8,
                },
              ]}
              placeholder="Nama lengkap (contoh: Supriono, S.H.)"
              placeholderTextColor={colors.mutedForeground}
              value={newCandName}
              onChangeText={setNewCandName}
            />
            <TextInput
              style={[
                styles.addCandInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: 8,
                },
              ]}
              placeholder="NIA (opsional)"
              placeholderTextColor={colors.mutedForeground}
              value={newCandNia}
              onChangeText={setNewCandNia}
            />
            <View style={styles.addCandBtns}>
              <TouchableOpacity
                style={[styles.addCandBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setShowAddCandidate(false)}
              >
                <Text style={[styles.addCandBtnText, { color: colors.foreground }]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addCandBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddCandidate}
              >
                <Text style={[styles.addCandBtnText, { color: "#fff" }]}>
                  Tambah
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Results */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          HASIL SEMENTARA
        </Text>
        {sortedCandidates.map((c, i) => (
          <CandidateBar
            key={c.id}
            candidate={c}
            totalVotes={totalVotes}
            rank={i + 1}
          />
        ))}

        {sortedCandidates.length === 0 && (
          <View style={styles.empty}>
            <Feather name="users" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Belum ada calon. Tambah calon dengan tombol +
            </Text>
          </View>
        )}

        {/* Vote input */}
        {votingOpen && (
          <View
            style={[
              styles.voteInputCard,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.voteInputTitle, { color: colors.foreground }]}>
              Masukkan Suara
            </Text>
            <Text style={[styles.voteInputSub, { color: colors.mutedForeground }]}>
              Input NIA peserta yang akan memilih
            </Text>
            <View style={styles.voteInputRow}>
              <TextInput
                style={[
                  styles.voteInputField,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: 10,
                  },
                ]}
                placeholder="NIA peserta, contoh: 24.10136"
                placeholderTextColor={colors.mutedForeground}
                value={voterNia}
                onChangeText={setVoterNia}
                returnKeyType="done"
                onSubmitEditing={handleStartVote}
              />
              <TouchableOpacity
                style={[
                  styles.voteGoBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                  },
                ]}
                onPress={handleStartVote}
                activeOpacity={0.8}
              >
                <Feather name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Vote modal */}
      <Modal visible={showVoteModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius * 2,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Pilih Kandidat
            </Text>
            <Text style={[styles.modalVoter, { color: colors.mutedForeground }]}>
              Pemilih: {currentVoter?.name} (NIA {currentVoter?.nia})
            </Text>

            <View style={styles.candidateList}>
              {candidates.map((c) => {
                const selected = selectedCandidate?.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.candidateOption,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.secondary,
                        borderRadius: colors.radius,
                        borderWidth: selected ? 0 : 1.5,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCandidate(c);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: selected ? "#fff" : colors.mutedForeground,
                          backgroundColor: selected ? "#fff" : "transparent",
                        },
                      ]}
                    >
                      {selected && (
                        <View
                          style={[
                            styles.radioDot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.candidateOptionName,
                          { color: selected ? "#fff" : colors.foreground },
                        ]}
                      >
                        {c.name}
                      </Text>
                      {c.nia ? (
                        <Text
                          style={[
                            styles.candidateOptionNia,
                            {
                              color: selected
                                ? "rgba(255,255,255,0.7)"
                                : colors.mutedForeground,
                            },
                          ]}
                        >
                          NIA {c.nia}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.secondary },
                ]}
                onPress={() => {
                  setShowVoteModal(false);
                  setCurrentVoter(null);
                  setSelectedCandidate(null);
                }}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: selectedCandidate
                      ? colors.success
                      : colors.muted,
                    flex: 1.5,
                    opacity: selectedCandidate ? 1 : 0.5,
                  },
                ]}
                onPress={handleConfirmVote}
                disabled={!selectedCandidate}
              >
                <Feather name="check-circle" size={16} color="#fff" />
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  Konfirmasi Pilihan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBanner: {
    padding: 18,
    gap: 14,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerTitle: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  bannerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 12,
  },
  bannerStat: {
    alignItems: "center",
    flex: 1,
  },
  bannerStatValue: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  bannerStatLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  bannerStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  adminRow: {
    flexDirection: "row",
    gap: 8,
  },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  adminBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  addCandForm: {
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  addCandTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  addCandInput: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addCandBtns: {
    flexDirection: "row",
    gap: 8,
  },
  addCandBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  addCandBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  candidateBar: {
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  candidateBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  candidateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  candidateName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  candidateNia: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  candidateRight: {
    alignItems: "flex-end",
  },
  voteCount: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  voteLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  pctText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  voteInputCard: {
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  voteInputTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  voteInputSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  voteInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  voteInputField: {
    flex: 1,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  voteGoBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "web" ? 34 : 0,
  },
  modalCard: {
    padding: 24,
    paddingBottom: 36,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  modalVoter: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -6,
  },
  candidateList: {
    gap: 10,
  },
  candidateOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  candidateOptionName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  candidateOptionNia: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
