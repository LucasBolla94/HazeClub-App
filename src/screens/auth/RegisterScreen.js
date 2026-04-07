import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();

  const [invite, setInvite] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refs for focusing next input
  const lastNameRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const inviteRef = useRef(null);

  function formatUsername(text) {
    return text.toLowerCase().replace(/[^a-z0-9._]/g, '');
  }

  async function handleRegister() {
    // Validations
    if (!invite.trim()) {
      Toast.show({ type: 'error', text1: 'Codigo de convite obrigatorio' });
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      Toast.show({ type: 'error', text1: 'Preencha nome e sobrenome' });
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      Toast.show({ type: 'error', text1: 'Username deve ter pelo menos 3 caracteres' });
      return;
    }
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Preencha o email' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Senha deve ter pelo menos 6 caracteres' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'As senhas nao coincidem' });
      return;
    }
    if (!acceptTerms) {
      Toast.show({ type: 'error', text1: 'Aceite os termos e condicoes' });
      return;
    }
    if (!isAdult) {
      Toast.show({ type: 'error', text1: 'Voce precisa ter 18 anos ou mais' });
      return;
    }

    setLoading(true);
    try {
      // Validate invite code
      const { data: inviteData, error: inviteError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', invite.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (inviteError || !inviteData) {
        Toast.show({ type: 'error', text1: 'Codigo de convite invalido' });
        setLoading(false);
        return;
      }

      if (inviteData.used_count >= inviteData.max_uses) {
        Toast.show({ type: 'error', text1: 'Codigo de convite esgotado' });
        setLoading(false);
        return;
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        Toast.show({ type: 'error', text1: 'Username ja esta em uso', text2: 'Escolha outro username' });
        setLoading(false);
        return;
      }

      // Create account (Supabase retorna erro se email ja existe)
      const displayName = `${firstName.trim()} ${lastName.trim()}`;
      await signUp(
        email.trim().toLowerCase(),
        password,
        username.trim().toLowerCase(),
        displayName
      );

      // Increment invite code usage
      await supabase
        .from('invite_codes')
        .update({ used_count: inviteData.used_count + 1 })
        .eq('id', inviteData.id);

      Toast.show({ type: 'success', text1: 'Conta criada!', text2: 'Bem-vindo ao HazeClub' });
    } catch (err) {
      let msg = err.message;
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        msg = 'Este email ja esta cadastrado';
      } else if (msg.includes('unique') || msg.includes('duplicate')) {
        msg = 'Username ou email ja esta em uso';
      }
      Toast.show({ type: 'error', text1: 'Erro ao criar conta', text2: msg });
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>HazeClub</Text>
            <Text style={styles.subtitle}>Crie sua conta</Text>
          </View>

          <View style={styles.form}>
            {/* 1. Invite Code - primeiro para validar acesso */}
            <Input
              label="Codigo de Convite"
              placeholder="Insira seu codigo"
              value={invite}
              onChangeText={(t) => setInvite(t.toUpperCase())}
              autoCapitalize="characters"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              ref={inviteRef}
            />

            {/* 2-3. Nome e Sobrenome lado a lado */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Nome"
                  placeholder="Seu nome"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Sobrenome"
                  placeholder="Seu sobrenome"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => usernameRef.current?.focus()}
                  ref={lastNameRef}
                />
              </View>
            </View>

            {/* 4. Username */}
            <View>
              <Input
                label="Username"
                placeholder="@seuusuario"
                value={username}
                onChangeText={(t) => setUsername(formatUsername(t))}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                ref={usernameRef}
              />
              {username.length > 0 && (
                <Text style={styles.usernamePreview}>@{username}</Text>
              )}
            </View>

            {/* 5. Email */}
            <Input
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              ref={emailRef}
            />

            {/* 6. Senha */}
            <Input
              label="Senha"
              placeholder="Minimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              ref={passwordRef}
            />

            {/* 7. Confirmar senha */}
            <Input
              label="Confirmar Senha"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              returnKeyType="done"
              ref={confirmRef}
            />

            {/* 8. Checkboxes */}
            <View style={styles.checkboxes}>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkLabel}>
                  Aceito os <Text style={styles.checkLink}>Termos e Condicoes</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setIsAdult(!isAdult)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isAdult && styles.checkboxChecked]}>
                  {isAdult && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkLabel}>Confirmo que tenho 18 anos ou mais</Text>
              </TouchableOpacity>
            </View>

            {/* 9. Submit */}
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: spacing.lg },
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  usernamePreview: {
    color: colors.accent,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  checkboxes: {
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    flex: 1,
  },
  checkLink: {
    color: colors.accent,
    fontWeight: '500',
  },
  link: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { color: colors.text.secondary, fontSize: 14 },
  linkAccent: { color: colors.accent, fontWeight: '600' },
});
