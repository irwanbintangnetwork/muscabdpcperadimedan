import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface QuorumBarProps {
  present: number;
  total: number;
  threshold?: number;
}

export function QuorumBar({ present, total, threshold = 50 }: QuorumBarProps) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  const pct = total > 0 ? Math.min((present / total) * 100, 100) : 0;
  const reached = pct >= threshold;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barColor = reached ? colors.success : colors.accent;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Kuorum {threshold}%
        </Text>
        <Text style={[styles.pctText, { color: barColor }]}>
          {pct.toFixed(1)}%
        </Text>
      </View>
      <View
        style={[
          styles.track,
          { backgroundColor: colors.secondary, borderRadius: colors.radius },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              borderRadius: colors.radius,
              width: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
        {/* Threshold marker */}
        <View
          style={[
            styles.marker,
            { left: `${threshold}%` as unknown as number },
          ]}
        >
          <View style={[styles.markerLine, { backgroundColor: colors.foreground }]} />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {present} hadir dari {total} anggota
        </Text>
        {reached ? (
          <Text style={[styles.statusText, { color: colors.success }]}>
            Kuorum tercapai
          </Text>
        ) : (
          <Text style={[styles.statusText, { color: colors.accent }]}>
            Butuh {Math.ceil(total * (threshold / 100)) - present} lagi
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  pctText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  track: {
    height: 14,
    overflow: "hidden",
    position: "relative",
  },
  fill: {
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
  },
  marker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    alignItems: "center",
  },
  markerLine: {
    width: 2,
    flex: 1,
    opacity: 0.4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
