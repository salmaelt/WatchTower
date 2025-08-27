import React, { useMemo, useState } from "react";
import { Alert, SafeAreaView, View, Text, StyleSheet, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import LoadingButton from "../components/LoadingButton";

// Optional: fallback to JWT claims if user object missing
function parseJwtClaims(token: string | null): any {
  if (!token) return {};
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (part.length % 4)) % 4);
    // @ts-ignore
    const json = typeof atob === "function" ? atob(b64) : null;
    return json ? JSON.parse(json) : {};
  } catch { return {}; }
}

function initialsFrom(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.slice(-1)[0]?.[0] ?? "")).toUpperCase() || "U";
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { token, user, logout } = useAuth();
  const claims = useMemo(() => parseJwtClaims(token), [token]);

  const displayName =
    user?.username || claims?.unique_name || claims?.name || claims?.sub || "Logged in user";
  const initials = initialsFrom(displayName);

  const [deleting, setDeleting] = useState(false);

  const onLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          (navigation as any).navigate("ProfileTab", { screen: "Login" });
        },
      },
    ]);
  };

  const runDelete = async () => {
    try {
      setDeleting(true);
      // DELETE /auth/me (requires Authorization: Bearer <token>)
      await axios.delete("/auth/me");
      await logout();
      (navigation as any).navigate("ProfileTab", { screen: "Login" });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        // Token invalid/expired—treat as deleted session and bounce to Login
        await logout();
        (navigation as any).navigate("ProfileTab", { screen: "Login" });
      } else {
        Alert.alert("Delete failed", e?.response?.data || e.message || "Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete account?",
      "This will permanently remove your account and related data (reports/comments/upvotes). This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: runDelete },
      ]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{displayName}</Text>
          <Text style={s.subtle}>Signed in</Text>
        </View>
      </View>

      {/* Account card */}
      <View style={s.card}>
        <View style={s.row}>
          <Ionicons name="person-circle-outline" size={22} color="#555" />
          <Text style={s.rowText}>Account</Text>
        </View>
        <View style={s.divider} />

        <Pressable onPress={onLogout} style={({ pressed }) => [s.logoutBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={s.logoutText}>Log out</Text>
        </Pressable>
      </View>

      {/* Danger zone */}
      <View style={[s.card, s.dangerZone]}>
        <View style={[s.row, { marginBottom: 8 }]}>
          <Ionicons name="alert-circle-outline" size={20} color="#b83a3a" />
          <Text style={[s.rowText, { color: "#b83a3a" }]}>Danger zone</Text>
        </View>
        <LoadingButton
          title="Delete account"
          variant="danger"
          loading={deleting}
          onPress={confirmDelete}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7fb", paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a72ff",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    marginBottom: 14,
    shadowColor: "#2a72ff",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 20 },
  name: { color: "#fff", fontSize: 18, fontWeight: "700" },
  subtle: { color: "rgba(255,255,255,0.9)", marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  rowText: { fontSize: 16, color: "#333", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 10 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    backgroundColor: "#e15656",
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  dangerZone: { borderWidth: 1, borderColor: "#f1c4c4", backgroundColor: "#fff7f7" },
});
