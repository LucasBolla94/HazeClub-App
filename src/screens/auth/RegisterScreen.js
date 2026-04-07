import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!displayName || !username || !email || !password) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Senha deve ter pelo menos 6 caracteres' });
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, username.trim().toLowerCase(), displayName.trim());
      Toast.show({ type: 'success', text1: 'Conta criada!', text2: 'Bem-vindo ao HazeClub' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Erro ao criar conta', text2: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0a0a0f']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>HazeClub</Text>
            <Text style={styles.subtitle}>Crie sua conta</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nome"
              placeholder="Seu nome"
              value={displayName}
              onChangeText={setDisplayName}
            />
            <Input
              label="Username"
              placeholder="seunome"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <Input
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Senha"
              placeholder="Min 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button title="Criar Conta" onPress={handleRegister} loading={loading} />

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.link}
            >
              <Text style={styles.linkText}>
                Ja tem conta? <Text style={styles.linkAccent}>Entrar</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    ...typography.h1,
    fontSize: 36,
    color: colors.accent,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  form: { width: '100%' },
  link: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { color: colors.text.secondary, fontSize: 14 },
  linkAccent: { color: colors.accent, fontWeight: '600' },
});
