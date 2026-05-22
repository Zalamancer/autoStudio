import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useAuthStore } from '../../src/stores/useAuthStore'

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{user?.email}</Text>
      <Pressable style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  text: { color: '#fff', fontSize: 16, marginBottom: 24 },
  button: { backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
})
