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
