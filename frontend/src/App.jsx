import { useState } from 'react'
import AthenaX from './athena/AthenaX'
import PitchGate from './pitch/PitchGate'

export default function App() {
  const [launched, setLaunched] = useState(false)
  return (
    <>
      {/* App always mounted — telemetry polling starts immediately */}
      <AthenaX />
      {/* Pitch deck sits on top; removed on launch with cinematic exit */}
      {!launched && <PitchGate onLaunch={() => setLaunched(true)} />}
    </>
  )
}
