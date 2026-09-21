import { Navigate, Route, Routes } from 'react-router-dom'
import { CustomerAccountPage } from './pages/customer/CustomerAccountPage'
import { CustomerManualVerifyPage } from './pages/customer/CustomerManualVerifyPage'
import { CustomerMobileLandingPage } from './pages/customer/CustomerMobileLandingPage'
import { CustomerPrivacyPage } from './pages/customer/CustomerPrivacyPage'
import { CustomerScanVerifyPage } from './pages/customer/CustomerScanVerifyPage'
import { CustomerVerifyResultPage } from './pages/customer/CustomerVerifyResultPage'
import { CustomerVerificationDetailsPage } from './pages/customer/CustomerVerificationDetailsPage'

/**
 * Standalone shopper verify site — host separately from the vendor/admin portal.
 * Routes mirror the previous portal /verify* paths for deep-link compatibility.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CustomerMobileLandingPage />} />
      <Route path="/verify" element={<CustomerMobileLandingPage />} />
      <Route path="/verify/scan" element={<CustomerScanVerifyPage />} />
      <Route path="/verify/manual" element={<CustomerManualVerifyPage />} />
      <Route path="/verify/result" element={<CustomerVerifyResultPage />} />
      <Route path="/verify/details" element={<CustomerVerificationDetailsPage />} />
      <Route path="/verify/account" element={<CustomerAccountPage />} />
      <Route path="/verify/privacy" element={<CustomerPrivacyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
