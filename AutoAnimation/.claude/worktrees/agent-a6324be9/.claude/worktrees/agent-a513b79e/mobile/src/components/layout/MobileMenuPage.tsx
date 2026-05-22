import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/useAuthStore'

interface MenuItemProps {
  icon: string
  label: string
  description?: string
  onPress: () => void
  accent?: boolean
  danger?: boolean
}

function MenuItem({ icon, label, description, onPress, accent, danger }: MenuItemProps) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, accent && styles.menuIconAccent, danger && styles.menuIconDanger]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuLabel, accent && styles.menuLabelAccent, danger && styles.menuLabelDanger]}>
          {label}
        </Text>
        {description && <Text style={styles.menuDesc}>{description}</Text>}
      </View>
      <Text style={styles.menuArrow}>{'\u276F'}</Text>
    </Pressable>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>
}

export function MobileMenuPage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <SectionHeader title="File" />
        <MenuItem icon={"\u{1F4C2}"} label="Projects" description="Open or create a project" onPress={() => router.push('/(tabs)/projects')} />
        <MenuItem icon={"\u{1F4BE}"} label="Save" description="Save current project" onPress={() => {}} />
        <MenuItem icon={"\u{1F4E5}"} label="Export" description="Export video or assets" onPress={() => router.push('/export/current')} />
        <MenuItem icon={"\u{1F3AC}"} label="Render" description="Render final video" onPress={() => {}} accent />

        <SectionHeader title="Navigate" />
        <MenuItem icon={"\u2699"} label="Settings" description="App settings" onPress={() => router.push('/(tabs)/settings')} />
        <MenuItem icon={"\u{1F3EA}"} label="Marketplace" description="Templates & assets" onPress={() => {}} />
        <MenuItem icon={"\u{1F4CA}"} label="Dashboard" description="Clip dashboard" onPress={() => {}} />

        <SectionHeader title="Account" />
        {!user ? (
          <MenuItem icon={"\u{1F511}"} label="Sign In" description="Sign in or create account" onPress={() => router.push('/(auth)/login')} />
        ) : (
          <>
            <View style={styles.emailRow}>
              <Text style={styles.emailText}>{user.email}</Text>
            </View>
            <MenuItem icon={"\u{1F4B3}"} label="Credits & Billing" description="Manage subscription" onPress={() => {}} />
            <MenuItem icon={"\u{1F514}"} label="Notifications" description="View notifications" onPress={() => {}} />
            <MenuItem icon={"\u{1F6AA}"} label="Sign Out" onPress={() => signOut()} danger />
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  sectionHeader: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', color: '#52525b',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconAccent: { backgroundColor: 'rgba(34,197,94,0.1)' },
  menuIconDanger: { backgroundColor: 'rgba(239,68,68,0.1)' },
  menuIconText: { fontSize: 18 },
  menuInfo: { flex: 1 },
  menuLabel: { color: '#e4e4e7', fontSize: 13, fontWeight: '500' },
  menuLabelAccent: { color: '#4ade80' },
  menuLabelDanger: { color: '#ef4444' },
  menuDesc: { color: '#52525b', fontSize: 11, marginTop: 2 },
  menuArrow: { color: '#3f3f46', fontSize: 14 },
  emailRow: { paddingHorizontal: 16, paddingVertical: 8 },
  emailText: { color: '#52525b', fontSize: 11 },
})
