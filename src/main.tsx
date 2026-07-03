import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ProposalModule } from './components/ProposalModule'
import { CheckInPage } from './components/CheckInPage'
import { VehicleCheckInPage } from './components/VehicleCheckInPage'

// Wrapper to extract vehicleId from URL params
function VehicleCheckInWrapper() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  if (!vehicleId) return null;
  return <VehicleCheckInPage vehicleId={vehicleId} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/propuesta" element={<ProposalModule />} />
        <Route path="/fichar" element={<CheckInPage />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/checkin/:vehicleId" element={<VehicleCheckInWrapper />} />
        <Route path="/presentacion-mesa-tecnica" element={<App />} />
        <Route path="/tracking" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
