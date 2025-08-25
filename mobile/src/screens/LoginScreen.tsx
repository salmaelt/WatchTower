import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import DismissKeyboard from "../components/DismissKeyboard";
import LoadingButton from "../components/LoadingButton";

export default function LoginScreen() {
  const [usernameOrEmail, setU] = useState("");
  const [password, setP] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const redirectTo = route.params?.redirectTo as { tab?: string; screen: string; params?: any } | undefined;

  const handleLogin = async () => {
    try {
      await login(usernameOrEmail.trim(), password);
      if (redirectTo) {
        (navigation as any).navigate(redirectTo.tab ?? "MapTab", {
          screen: redirectTo.screen,
          params: redirectTo.params,
        });
      } else {
        (navigation as any).navigate("ProfileTab", { screen: "Profile" });
      }
    } catch (e: any) {
      Alert.alert("Login failed", e?.response?.data || e.message);
      // LoadingButton will stop spinner automatically via onLoadingChange(false)
      // Keep it here for clarity; no rethrow needed.
    }
  };

  return (
    <DismissKeyboard>
      <View style={s.container}>
        <Text style={s.title}>Welcome back</Text>

        <TextInput
          placeholder="Username or email"
          value={usernameOrEmail}
          onChangeText={setU}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          style={[s.input, busy && s.inputDisabled]}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setP}
          secureTextEntry
          editable={!busy}
          style={[s.input, busy && s.inputDisabled]}
        />

        <LoadingButton
          title="Log in"
          onPressAsync={handleLogin}
          onLoadingChange={setBusy}  // disables inputs while loading
        />

        <View style={{ height: 12 }} />
        <Text style={s.muted}>Don’t have an account?</Text>
        <Pressable disabled={busy} onPress={() => (navigation as any).navigate("Register", { redirectTo })}>
          <Text style={[s.link, busy && { opacity: 0.5 }]}>Create one here</Text>
        </Pressable>
      </View>
    </DismissKeyboard>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fafafa",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, marginBottom: 10,
  },
  inputDisabled: { opacity: 0.6 },
  muted: { textAlign: "center", opacity: 0.7, marginTop: 4 },
  link: { textAlign: "center", fontWeight: "600", marginTop: 6 },
});
