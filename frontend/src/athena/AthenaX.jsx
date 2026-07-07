import { useTelemetry } from './useTelemetry'
import AppShell from '../shell/AppShell'
import BootSequence from './hud/BootSequence'

/**
 * AthenaX — Root application component.
 * Mounts the telemetry polling loop and renders the AppShell.
 * The 3D scene lives inside AppShell's main workspace area.
 */
export default function AthenaX() {
  useTelemetry()

  return (
    <>
      <AppShell />
      <BootSequence />
    </>
  )
}
