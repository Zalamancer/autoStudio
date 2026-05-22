import { Stack } from 'expo-router'

export default function ExportLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
        title: 'Export',
      }}
    />
  )
}
