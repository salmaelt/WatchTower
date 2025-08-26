import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import LoadingButton from '../components/LoadingButton';  
import { palette } from '../theme';

const GREEN = palette.green ?? '#2f6b57';
const INK = palette.ink ?? '#0f172a';
const BG = (palette as any).bg ?? '#ffffff';

export default function LoginScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  //add authentication
  const onSubmit = async () => {
    await signIn({ email, password }); 
    const redirect = route.params?.redirectTo;
    if (redirect?.tab) {
      nav.navigate(redirect.tab, {
        screen: redirect.screen,
        params: redirect.params,
      });
    } else {
      nav.navigate('ProfileTab');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.sub}>Welcome back — please enter your details.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
          />
        </View>

      <LoadingButton
        title="Sign in"
        onPressAsync={onSubmit}
        onLoadingChange={setBusy}
        bg={palette.green}
        textColor="#fff"
        style={{ marginTop: 12, width: '100%' }}   // optional
      />

        <Pressable
          onPress={() => nav.navigate('Register')}
          style={({ pressed }) => [
            styles.ghostBtn,
            pressed && { transform: [{ translateY: 1 }] },
          ]}
        >
          <Text style={styles.ghostText}>Create account</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    padding: 16,
  },
  card: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1f2937',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: INK,
    marginBottom: 6,
  },
  sub: { color: '#6b7280', marginBottom: 12 },
  field: { marginBottom: 10 },
  label: { fontWeight: '800', color: INK, marginBottom: 6 },
  input: {
    height: 44,
    borderWidth: 2,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: INK,
  },
  ghostBtn: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  ghostText: {
    color: GREEN,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontSize: 16,
  },
});
