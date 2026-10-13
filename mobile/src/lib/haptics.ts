import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

/** Haptics are a no-op on web. */
const on = Platform.OS !== 'web'
export const tap = () => on && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
export const select = () => on && void Haptics.selectionAsync()
export const success = () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
export const warn = () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
