import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../../src/stores/useAuthStore'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuthStore()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) setError(result.error)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProAnimate</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0a0a0a' },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 16 },
  error: { color: '#ef4444', marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
