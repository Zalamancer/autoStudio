import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{symbol}</Text>
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#222', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="showcase"
        options={{
          title: 'Showcase',
          tabBarIcon: ({ color }) => <TabIcon symbol={"\u25B6"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <TabIcon symbol="\u25A6" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon symbol="\u2699" color={color} />,
        }}
      />
    </Tabs>
  )
}
