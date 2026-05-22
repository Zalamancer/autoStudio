import { Slot } from 'expo-router'
import { LogBox } from 'react-native'

LogBox.ignoreLogs(['Looks like you have configured linking'])

export default function RootLayout() {
  return <Slot />
}
