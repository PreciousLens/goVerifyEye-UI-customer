import { Navigate, Route, Routes } from 'react-router-dom'
import { CustomerAccountPage } from './pages/customer/CustomerAccountPage'
import { CustomerLandingLayout } from './pages/customer/CustomerLandingLayout'
import { CustomerManualVerifyPage } from './pages/customer/CustomerManualVerifyPage'
import { CustomerPrivacyPage } from './pages/customer/CustomerPrivacyPage'
import { CustomerScanVerifyPage } from './pages/customer/CustomerScanVerifyPage'
import { CustomerVerifyResultPage } from './pages/customer/CustomerVerifyResultPage'
import { CustomerVerificationDetailsPage } from './pages/customer/CustomerVerificationDetailsPage'

/**
 * Standalone shopper verify site — host separately from the vendor/admin portal.
 * Routes mirror the previous portal /verify* paths for deep-link compatibility.
 *
 * Landing stays mounted under result/details so those screens display as
 * white modals over the marketing page (Figma desktop frames).
 */
export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLandingLayout />}>
        <Route index element={null} />
        <Route path="verify" element={null} />
        <Route path="verify/result" element={<CustomerVerifyResultPage />} />
        <Route path="verify/details" element={<CustomerVerificationDetailsPage />} />
      </Route>
      <Route path="/verify/scan" element={<CustomerScanVerifyPage />} />
      <Route path="/verify/manual" element={<CustomerManualVerifyPage />} />
      <Route path="/verify/account" element={<CustomerAccountPage />} />
      <Route path="/verify/privacy" element={<CustomerPrivacyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
