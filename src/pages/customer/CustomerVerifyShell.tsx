import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../../components/BrandMark'
import { ArrowLeftIcon } from '../../components/icons'
import './CustomerVerifyShell.css'

type CustomerVerifyShellProps = {
  title: string
  children: ReactNode
  backTo?: string
  /** Layout variant for desktop Figma screens. */
  variant?: 'default' | 'scan' | 'auth' | 'result'
}

/**
 * Shared chrome for verify scan / manual / result / account screens.
 * Desktop variants match Customer → DESKTOP frames in Figma.
 */
export function CustomerVerifyShell({
  title,
  children,
  backTo = '/verify',
  variant = 'default',
}: CustomerVerifyShellProps) {
  return (
    <div className={`customer-verify customer-verify--${variant}`}>
      <header className="customer-verify__header">
        <Link
          to={backTo}
          className="customer-verify__back"
          aria-label="Go back"
        >
          <ArrowLeftIcon size={20} />
        </Link>
        {variant === 'scan' ? (
          <h1 className="customer-verify__page-title">{title}</h1>
        ) : (
          <div className="customer-verify__brand">
            <BrandMark className="customer-verify__logo" tone="onLight" />
          </div>
        )}
        {variant === 'scan' ? (
          <span className="customer-verify__header-spacer" aria-hidden="true" />
        ) : (
          <span className="customer-verify__title">{title}</span>
        )}
      </header>
      <main className="customer-verify__main">{children}</main>
    </div>
  )
}
