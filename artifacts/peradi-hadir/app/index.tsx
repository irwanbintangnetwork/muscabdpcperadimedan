import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const OktaLogo = require("../assets/images/icon.png");

export default function LoginScreen() {
  const { login } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError("Masukkan username dan password");
      return;
    }
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 400));
    const ok = login(username.trim(), password);
    setLoading(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Username atau password salah");
    }
  };

  return (
    <LinearGradient
      colors={["#1B3A6B", "#0D2147"]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        {/* Logo + Title */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrapper}>
            <Image source={OktaLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.appTitle}>MUSCAB DPC PERADI SAI</Text>
          <Text style={styles.appTitleSub}>MEDAN</Text>
          <Text style={styles.appSubtitle}>
            Musyawarah Cabang DPC PERADI SAI Medan
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, { borderRadius: colors.radius * 2 }]}>
          <Text style={[styles.formTitle, { color: "#1B3A6B" }]}>
            Login Panitia
          </Text>

          <View style={styles.fieldGroup}>
            <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
              <Feather name="user" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Username"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={(t) => { setUsername(t); setError(""); }}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
              <Feather name="lock" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(""); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginBtn, { borderRadius: colors.radius }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#1B3A6B", "#0D2147"]}
              style={[styles.loginBtnGrad, { borderRadius: colors.radius }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Masuk</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Default: admin / peradi2024
          </Text>
        </View>

        {/* Credit */}
        <View style={styles.creditSection}>
          <Text style={styles.creditText}>Dikembangkan oleh</Text>
          <Text style={styles.creditName}>Irwan, S.H.</Text>
          <Text style={styles.creditOrg}>DPC PERADI SAI Medan</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 24,
    paddingBottom: Platform.OS === "web" ? 20 : 0,
    paddingTop: 16,
  },
  logoSection: {
    alignItems: "center",
    gap: 6,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logo: {
    width: 96,
    height: 96,
  },
  appTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 2,
    textAlign: "center",
  },
  appTitleSub: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#C9A84C",
    letterSpacing: 4,
    textAlign: "center",
    marginTop: -4,
  },
  appSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.60)",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 2,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  fieldGroup: {
    gap: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F8FAFF",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  loginBtn: {
    overflow: "hidden",
    marginTop: 2,
  },
  loginBtnGrad: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  creditSection: {
    alignItems: "center",
    gap: 2,
    paddingBottom: 8,
  },
  creditText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  creditName: {
    color: "#C9A84C",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  creditOrg: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
