import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import DismissKeyboard from "../components/DismissKeyboard";
import LoadingButton from "../components/LoadingButton";
import { ApiError, isApiError } from "../api/client"; // ApiError used ONLY for API-originated errors

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setP] = useState("");
  const [confirmPassword, setCP] = useState("");
  const [busy, setBusy] = useState(false);

  const { register } = useAuth(); // make sure this matches your AuthContext
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const redirectTo = route.params?.redirectTo as { tab?: string; screen: string; params?: any } | undefined;

  const handleRegister = async () => {
    const u = username.trim();
    const e = email.trim();

    // ---- Frontend-only validation (no ApiError here) ----
    if (!u || !e || !password || !confirmPassword) {
      Alert.alert("Missing details", "Please fill in username, email, password, and confirmation.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don’t match", "Please make sure both passwords are the same.");
      return;
    }

    try {
      // ---- Actual API call ----
      // Ensure this matches your AuthContext register signature:
      // e.g. register(username, email, password) OR register({ username, email, password })
      await (register as any)(u, e, password);

      // On success, follow the same redirect behavior as Login
      if (redirectTo) {
        (navigation as any).navigate(redirectTo.tab ?? "MapTab", {
          screen: redirectTo.screen,
          params: redirectTo.params,
        });
      } else {
        (navigation as any).navigate("ProfileTab", { screen: "Profile" });
      }
    } catch (e: any) {
      // ---- API-originated error handling using ApiError ONLY ----
      const status = e?.response?.status as number | undefined;
      const data = e?.response?.data;
      const title = data?.title;
      const serverDetail = data?.detail;
      const fallbackMsg = e?.message || "Something went wrong.";

        if (status === 400) {
          // validation error from server (ProblemDetails / model-state)
          Alert.alert("Validation error", title || "Please check the details and try again.");
        } else if (status === 409) {
          // conflict (e.g., email/username already taken)
          Alert.alert("Already registered", title || "That username or email is already in use.");
        } else if (status === 401) {
          // shouldn’t usually happen on register, but handle anyway
          Alert.alert("Not authorized", title || "Please check your details and try again.");
        } else if (status && status >= 500) {
          Alert.alert("Server error", "Please try again in a moment.");
        } else {
          // unexpected API error shape/status
          Alert.alert("Sign up failed", title || "Something went wrong.");
        } 
      // LoadingButton spinner stops via onLoadingChange(false)
    }
  };

  return (
    <DismissKeyboard>
      <View style={s.container}>
        <Text style={s.title}>Create your account</Text>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          style={[s.input, busy && s.inputDisabled]}
          placeholderTextColor="#666"
          returnKeyType="next"
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!busy}
          style={[s.input, busy && s.inputDisabled]}
          placeholderTextColor="#666"
          returnKeyType="next"
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setP}
          secureTextEntry
          editable={!busy}
          style={[s.input, busy && s.inputDisabled]}
          placeholderTextColor="#666"
          returnKeyType="next"
        />

        <TextInput
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setCP}
          secureTextEntry
          editable={!busy}
          style={[s.input, busy && s.inputDisabled]}
          placeholderTextColor="#666"
          returnKeyType="done"
          onSubmitEditing={() => !busy && handleRegister()}
        />

        <LoadingButton
          title="Create account"
          onPressAsync={handleRegister}
          onLoadingChange={setBusy}  // disables inputs while loading
        />

        <View style={{ height: 12 }} />
        <Text style={s.muted}>Already have an account?</Text>
        <Pressable disabled={busy} onPress={() => (navigation as any).navigate("Login", { redirectTo })}>
          <Text style={[s.link, busy && { opacity: 0.5 }]}>Sign in</Text>
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
