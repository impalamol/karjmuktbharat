import { Redirect, Tabs } from 'expo-router'
import { TabBar } from '@/components/TabBar'
import { useSession } from '@/stores/session'

export default function TabsLayout() {
  const userId = useSession((s) => s.userId)
  if (!userId) return <Redirect href="/login" />
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#000' } } as object}>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="rescue" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="bank" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
