import { Redirect } from 'expo-router'

/** Unknown paths (old links, the web preview's host path) go to onboarding. */
export default function NotFound() {
  return <Redirect href="/" />
}
