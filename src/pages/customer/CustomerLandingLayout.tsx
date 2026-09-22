import { Outlet, useLocation } from 'react-router-dom'
import { CustomerMobileLandingPage } from './CustomerMobileLandingPage'
import './CustomerMobileLandingPage.css'

function isVerifyOverlayPath(pathname: string): boolean {
  return (
    pathname === '/verify/result' ||
    pathname === '/verify/details' ||
    pathname.startsWith('/verify/result/') ||
    pathname.startsWith('/verify/details/')
  )
}

/**
 * Keeps the marketing landing visible while verify result / details
 * render as white modals on top (Figma desktop frames).
 */
export function CustomerLandingLayout() {
  const { pathname } = useLocation()
  const overlayOpen = isVerifyOverlayPath(pathname)

  return (
    <>
      <div
        className={
          overlayOpen
            ? 'customer-landing-host customer-landing-host--covered'
            : 'customer-landing-host'
        }
        {...(overlayOpen
          ? { inert: true as const, 'aria-hidden': true as const }
          : {})}
      >
        <CustomerMobileLandingPage />
      </div>
      <Outlet />
    </>
  )
}
