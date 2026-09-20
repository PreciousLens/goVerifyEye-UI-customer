import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../../components/BrandMark'
import { ArrowLeftIcon } from '../../components/icons'
import './CustomerVerifyShell.css'

type CustomerVerifyShellProps = {
  title: string
  children: ReactNode
  backTo?: string
}

/**
 * Shared mobile chrome for verify scan / manual / result screens.
 */
export function CustomerVerifyShell({
  title,
  children,
  backTo = '/verify',
}: CustomerVerifyShellProps) {
  return (
    <div className="customer-verify">
      <header className="customer-verify__header">
        <Link
          to={backTo}
          className="customer-verify__back"
          aria-label="Go back"
        >
          <ArrowLeftIcon size={20} />
        </Link>
        <div className="customer-verify__brand">
          <BrandMark className="customer-verify__logo" tone="onLight" />
        </div>
        <span className="customer-verify__title">{title}</span>
      </header>
      <main className="customer-verify__main">{children}</main>
    </div>
  )
}
