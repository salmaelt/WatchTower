import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { palette } from '../theme';

const GREEN = palette.green ?? '#2f6b57';
const GREEN_D = palette.greenD ?? '#285a49';
const INK = palette.ink ?? '#0f172a';
const BG = (palette as any).bg ?? '#ffffff';

export default function AuthGateScreen() {
  const nav = useNavigation<any>();

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.sub}>Sign in to view your reports or create an account to get started.</Text>

        <Pressable
          onPress={() => nav.navigate('Login')}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>Sign in</Text>
        </Pressable>

        <Pressable
          onPress={() => nav.navigate('Register')}
          style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
        >
          <Text style={styles.ghostText}>Create account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, padding: 16 },
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
  title: { fontSize: 22, fontWeight: '900', color: INK, marginBottom: 6 },
  sub: { color: '#6b7280', marginBottom: 16 },
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryText: { color: '#fff', fontWeight: '800', letterSpacing: 0.3, fontSize: 16 },
  ghostBtn: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  ghostText: { color: GREEN, fontWeight: '800', letterSpacing: 0.3, fontSize: 16 },
  pressed: { transform: [{ translateY: 1 }] },
});
