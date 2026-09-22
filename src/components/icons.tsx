type IconProps = {
  className?: string
  size?: number
}

export function ScanIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 8V5.5A1 1 0 0 1 5.5 4.5H8M16 4.5h2.5a1 1 0 0 1 1 1V8M19.5 16v2.5a1 1 0 0 1-1 1H16M8 19.5H5.5a1 1 0 0 1-1-1V16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function ArrowLeftIcon({ className, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 5.5 8.5 12 15 18.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ArrowRightIcon({ className, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 5.5 15.5 12 9 18.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InfoCircleIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.9486 18.9081C19.1227 17.734 19.6804 15.7697 19.6804 12.4799C19.6804 9.19006 19.1227 7.22574 17.9486 6.05168C16.7745 4.87762 14.8102 4.31988 11.5204 4.31988C8.23059 4.31988 6.26626 4.87762 5.09221 6.05168C3.91816 7.22574 3.36041 9.19006 3.36041 12.4799C3.36041 15.7697 3.91816 17.734 5.09221 18.9081C6.26626 20.0821 8.23059 20.6399 11.5204 20.6399C14.8102 20.6399 16.7745 20.0821 17.9486 18.9081ZM18.9668 19.9263C17.3658 21.5274 14.8901 22.0799 11.5204 22.0799C8.15072 22.0799 5.67505 21.5274 4.07398 19.9263C2.47291 18.3252 1.92041 15.8496 1.92041 12.4799C1.92041 9.11019 2.47291 6.63451 4.07398 5.03344C5.67505 3.43238 8.15072 2.87988 11.5204 2.87988C14.8901 2.87988 17.3658 3.43238 18.9668 5.03344C20.5679 6.63451 21.1204 9.11019 21.1204 12.4799C21.1204 15.8496 20.5679 18.3252 18.9668 19.9263Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.5203 16.939C11.1227 16.939 10.8003 16.6166 10.8003 16.219V12.4798C10.8003 12.0821 11.1227 11.7598 11.5203 11.7598C11.918 11.7598 12.2403 12.0821 12.2403 12.4798V16.219C12.2403 16.6166 11.918 16.939 11.5203 16.939Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.2445 9.12039C12.2445 9.51803 11.9223 9.84039 11.5245 9.84039H11.5159C11.1183 9.84039 10.7959 9.51803 10.7959 9.12039C10.7959 8.72275 11.1183 8.40039 11.5159 8.40039H11.5245C11.9223 8.40039 12.2445 8.72275 12.2445 9.12039Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function FlagIcon({ className, size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 3.75v16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M5.75 4.5h9.2c.9 0 1.45.95.98 1.7l-1.15 1.85a1.1 1.1 0 0 0 0 1.2l1.15 1.85c.47.75-.08 1.7-.98 1.7H5.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Mobile app bar hamburger — Figma manage-codes-mobile */

export function MenuIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Desktop header shopper avatar — Figma landing nav */

export function PersonIcon({ className, size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5 19.2c1.3-3.2 3.7-4.8 7-4.8s5.7 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MailIcon({ className, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m5 8 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon({ className, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="5"
        y="10.5"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function EyeIcon({ className, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

/** Profile menu — Your Checks (Figma scan-frame) */

export function ScanFrameIcon({ className, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.3699 17.2786C4.3699 18.9226 5.7079 20.2606 7.3529 20.2606H8.5889C9.0029 20.2606 9.3389 20.5966 9.3389 21.0106C9.3389 21.4246 9.0029 21.7606 8.5889 21.7606H7.3529C4.8809 21.7606 2.8699 19.7496 2.8699 17.2786L2.869 13.954L1.75 13.9549C1.336 13.9549 1 13.6189 1 13.2049C1 12.7909 1.336 12.4549 1.75 12.4549L3.60559 12.4537C3.61035 12.4536 3.61512 12.4536 3.6199 12.4536L3.634 12.454L20.8648 12.4538C20.8699 12.4537 20.8749 12.4536 20.88 12.4536L20.894 12.454L22.75 12.4549C23.164 12.4549 23.5 12.7909 23.5 13.2049C23.5 13.6189 23.164 13.9549 22.75 13.9549L21.63 13.954V17.2786C21.63 19.7496 19.619 21.7606 17.147 21.7606H15.942C15.528 21.7606 15.192 21.4246 15.192 21.0106C15.192 20.5966 15.528 20.2606 15.942 20.2606H17.147C18.792 20.2606 20.13 18.9226 20.13 17.2786V13.954H4.369L4.3699 17.2786ZM17.1469 3C19.6189 3 21.6299 5.011 21.6299 7.481V8.995C21.6299 9.409 21.2939 9.745 20.8799 9.745C20.4659 9.745 20.1299 9.409 20.1299 8.995V7.481C20.1299 5.838 18.7919 4.5 17.1469 4.5H15.9419C15.5279 4.5 15.1919 4.164 15.1919 3.75C15.1919 3.336 15.5279 3 15.9419 3H17.1469ZM8.5891 3C9.0031 3 9.3391 3.336 9.3391 3.75C9.3391 4.164 9.0031 4.5 8.5891 4.5H7.3531C5.7081 4.5 4.3701 5.838 4.3701 7.481V8.995C4.3701 9.409 4.0341 9.745 3.6201 9.745C3.2061 9.745 2.8701 9.409 2.8701 8.995V7.481C2.8701 5.011 4.8811 3 7.3531 3H8.5891Z"
        fill="currentColor"
      />
    </svg>
  )
}
