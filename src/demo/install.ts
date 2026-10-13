// Demo builds only (aliased in vite.config.ts): installs the in-browser sample backend
// before any app module runs.
import { installDemoBackend } from './mock'

installDemoBackend()
