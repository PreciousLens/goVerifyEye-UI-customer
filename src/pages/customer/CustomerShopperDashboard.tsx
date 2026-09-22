import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  customerAccountApi,
  type CustomerCheckHistoryItem,
  type CustomerShopper,
} from '../../api/customerAccount'
import { toUserMessage } from '../../api'
import { BrandMark } from '../../components/BrandMark'
import {
  ArrowLeftIcon,
  EyeIcon,
  LockIcon,
  PersonIcon,
  ScanFrameIcon,
} from '../../components/icons'
import { CustomerContactSupportModal } from './CustomerContactSupportModal'
import './CustomerShopperDashboard.css'

type Panel = 'checks' | 'edit'

type CheckTone =
  | 'success'
  | 'flagged'
  | 'caution'
  | 'review'
  | 'info'
  | 'invalid'
  | 'signal'

function formatCode(code: string): string {
  const digits = code.replace(/\D/g, '')
  return (digits.match(/.{1,4}/g) ?? [code]).join(' ')
}

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

function formatCheckedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTHS_SHORT[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year} • ${hours}:${minutes}`
}

function checkTone(item: CustomerCheckHistoryItem): CheckTone {
  const { result } = item
  const status = result.status
  const outcome = result.outcome

  if (outcome === 'flagged' || status === 'flagged') return 'flagged'
  if (outcome === 'suspicious') return 'caution'
  if (status === 'under_review') return 'review'
  if (
    status === 'invalid' ||
    status === 'revoked' ||
    status === 'recalled' ||
    status === 'retired'
  ) {
    return 'invalid'
  }
  if (status === 'pending' || status === 'product_unavailable') return 'signal'
  if (
    status === 'not_recognised' ||
    status === 'not_found' ||
    status === 'unactivated'
  ) {
    return 'info'
  }
  if (result.valid || status === 'market_active') return 'success'
  return 'info'
}

function CheckStatusIcon({ tone }: { tone: CheckTone }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none',
    'aria-hidden': true as const,
  }

  switch (tone) {
    case 'success':
      return (
        <svg {...common}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18.2438 5.01211L17.7262 5.31538C15.3404 6.7129 13.4961 8.5544 12.2449 10.0552C11.6206 10.804 11.1473 11.464 10.8313 11.9348C10.6733 12.1701 10.5549 12.3578 10.4767 12.4853C10.4376 12.549 10.4086 12.5977 10.3898 12.6297L10.3692 12.665L10.3646 12.673L10.3639 12.6742L10.1917 12.979H9.494L9.31632 12.7103L9.31432 12.7074L9.30552 12.6943C9.29736 12.6822 9.28456 12.6634 9.26728 12.6388C9.23288 12.5894 9.18088 12.5162 9.11296 12.4243C8.97696 12.2405 8.778 11.9834 8.52896 11.6948C8.02592 11.1116 7.34052 10.4249 6.57598 9.94152L6.06882 9.62088L6.71007 8.60664L7.21722 8.9272C8.12392 9.5004 8.89848 10.286 9.4376 10.911C9.5676 11.0617 9.6852 11.2046 9.78888 11.3348C9.80392 11.3123 9.8192 11.2894 9.83496 11.2659C10.1703 10.7663 10.6682 10.0723 11.3232 9.28672C12.6306 7.71865 14.5769 5.76946 17.1196 4.27996L17.6373 3.97669L18.2438 5.01211Z"
            fill="#0F8A3C"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1.57695 10.0278C1.57695 5.60946 5.15867 2.02774 9.57696 2.02774C13.9952 2.02774 17.577 5.60946 17.577 10.0278C17.577 14.446 13.9952 18.0278 9.57696 18.0278C5.15867 18.0278 1.57695 14.446 1.57695 10.0278ZM9.57696 3.22774C5.82142 3.22774 2.77695 6.2722 2.77695 10.0278C2.77695 13.7833 5.82142 16.8278 9.57696 16.8278C13.3325 16.8278 16.377 13.7833 16.377 10.0278C16.377 6.2722 13.3325 3.22774 9.57696 3.22774Z"
            fill="#0F8A3C"
          />
        </svg>
      )
    case 'flagged':
      return (
        <svg {...common}>
          <path
            d="M16.1833 3.70833C16.1003 3.65102 16.0044 3.61496 15.9041 3.60334C15.8039 3.59172 15.7023 3.60488 15.6083 3.64167C14.6164 4.06376 13.57 4.34428 12.5 4.475C11.8234 4.29352 11.1775 4.01269 10.5833 3.64167C9.81646 3.16859 8.96898 2.8409 8.08333 2.675C6.66091 2.8008 5.26055 3.10888 3.91667 3.59167C3.79287 3.63348 3.68528 3.71305 3.60905 3.81918C3.53282 3.92531 3.49176 4.05266 3.49167 4.18333V16.6667C3.49167 16.8324 3.55751 16.9914 3.67472 17.1086C3.79194 17.2258 3.95091 17.2917 4.11667 17.2917C4.28243 17.2917 4.4414 17.2258 4.55861 17.1086C4.67582 16.9914 4.74167 16.8324 4.74167 16.6667V11.7917C5.77927 11.4162 6.85997 11.1726 7.95833 11.0667C8.66379 11.2402 9.33835 11.5213 9.95833 11.9C10.6834 12.3434 11.4778 12.6617 12.3083 12.8417H12.5C13.7069 12.6893 14.8873 12.3725 16.0083 11.9C16.1261 11.8545 16.2274 11.7745 16.2988 11.6704C16.3702 11.5662 16.4084 11.4429 16.4083 11.3167V4.225C16.4146 4.1272 16.3974 4.02931 16.3583 3.93946C16.3192 3.84961 16.2592 3.77038 16.1833 3.70833ZM15.2083 10.9C14.3428 11.2591 13.4311 11.4947 12.5 11.6C11.8234 11.4185 11.1775 11.1377 10.5833 10.7667C9.81646 10.2936 8.96898 9.9659 8.08333 9.8H7.91667C6.84395 9.89655 5.78652 10.1203 4.76667 10.4667V4.63333C5.80427 4.25783 6.88497 4.01426 7.98333 3.90833C8.68879 4.0819 9.36335 4.36297 9.98333 4.74167C10.7084 5.18502 11.5028 5.50334 12.3333 5.68333C13.3111 5.64449 14.275 5.43875 15.1833 5.075L15.2083 10.9Z"
            fill="#B42318"
          />
        </svg>
      )
    case 'caution':
      return (
        <svg {...common} viewBox="0 0 17 16">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.34501 0C9.19501 0 9.95585 0.440833 10.3775 1.17917L16.3658 11.6492C16.785 12.3817 16.7825 13.2558 16.3583 13.9867C15.9342 14.7183 15.1767 15.155 14.3325 15.155H2.34668C1.50168 15.155 0.744178 14.7183 0.320011 13.9867C-0.104156 13.2558 -0.106656 12.3817 0.312511 11.6492L6.31251 1.1775C6.73418 0.44 7.49418 0 8.34501 0ZM8.34418 1.25C7.94751 1.25 7.59418 1.455 7.39584 1.79917L1.39751 12.27C1.20251 12.6117 1.20418 13.0192 1.40168 13.36C1.59918 13.7008 1.95251 13.905 2.34668 13.905H14.3325C14.7258 13.905 15.0792 13.7008 15.2767 13.36C15.475 13.0192 15.4767 12.6117 15.28 12.27L9.29251 1.79917C9.09501 1.455 8.74168 1.25 8.34418 1.25ZM8.33851 10.4158C8.79935 10.4158 9.17185 10.7883 9.17185 11.2492C9.17185 11.71 8.79935 12.0825 8.33851 12.0825C7.87768 12.0825 7.50101 11.71 7.50101 11.2492C7.50101 10.7883 7.87018 10.4158 8.33018 10.4158H8.33851ZM8.33684 5.47C8.68184 5.47 8.96184 5.75 8.96184 6.095V8.67833C8.96184 9.02333 8.68184 9.30333 8.33684 9.30333C7.99184 9.30333 7.71184 9.02333 7.71184 8.67833V6.095C7.71184 5.75 7.99184 5.47 8.33684 5.47Z"
            fill="#B54708"
          />
        </svg>
      )
    case 'review':
      return (
        <svg {...common}>
          <path
            d="M10 1.875C8.39303 1.875 6.82214 2.35152 5.48599 3.24431C4.14984 4.1371 3.10844 5.40605 2.49348 6.8907C1.87852 8.37535 1.71761 10.009 2.03112 11.5851C2.34462 13.1612 3.11846 14.6089 4.25476 15.7452C5.39106 16.8815 6.8388 17.6554 8.41489 17.9689C9.99099 18.2824 11.6247 18.1215 13.1093 17.5065C14.594 16.8916 15.8629 15.8502 16.7557 14.514C17.6485 13.1779 18.125 11.607 18.125 10C18.1227 7.84581 17.266 5.78051 15.7427 4.25727C14.2195 2.73403 12.1542 1.87727 10 1.875ZM10 16.875C8.64025 16.875 7.31104 16.4718 6.18045 15.7164C5.04987 14.9609 4.16868 13.8872 3.64833 12.6309C3.12798 11.3747 2.99183 9.99237 3.2571 8.65875C3.52237 7.32513 4.17715 6.10013 5.13864 5.13864C6.10013 4.17715 7.32513 3.52237 8.65875 3.2571C9.99237 2.99183 11.3747 3.12798 12.6309 3.64833C13.8872 4.16868 14.9609 5.04987 15.7164 6.18045C16.4718 7.31104 16.875 8.64025 16.875 10C16.8729 11.8227 16.1479 13.5702 14.8591 14.8591C13.5702 16.1479 11.8227 16.8729 10 16.875ZM8.75 7.5V12.5C8.75 12.6658 8.68415 12.8247 8.56694 12.9419C8.44973 13.0592 8.29076 13.125 8.125 13.125C7.95924 13.125 7.80027 13.0592 7.68306 12.9419C7.56585 12.8247 7.5 12.6658 7.5 12.5V7.5C7.5 7.33424 7.56585 7.17527 7.68306 7.05806C7.80027 6.94085 7.95924 6.875 8.125 6.875C8.29076 6.875 8.44973 6.94085 8.56694 7.05806C8.68415 7.17527 8.75 7.33424 8.75 7.5ZM12.5 7.5V12.5C12.5 12.6658 12.4342 12.8247 12.3169 12.9419C12.1997 13.0592 12.0408 13.125 11.875 13.125C11.7092 13.125 11.5503 13.0592 11.4331 12.9419C11.3158 12.8247 11.25 12.6658 11.25 12.5V7.5C11.25 7.33424 11.3158 7.17527 11.4331 7.05806C11.5503 6.94085 11.7092 6.875 11.875 6.875C12.0408 6.875 12.1997 6.94085 12.3169 7.05806C12.4342 7.17527 12.5 7.33424 12.5 7.5Z"
            fill="#9A3412"
          />
        </svg>
      )
    case 'invalid':
      return (
        <svg {...common}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.565 8.10352L7.88281 12.7856L7.03428 11.9371L11.7164 7.25498L12.565 8.10352Z"
            fill="#B42318"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.87977 7.25342L12.565 11.9396L11.7164 12.7881L7.03115 8.10184L7.87977 7.25342Z"
            fill="#B42318"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1.8 10.0278C1.8 5.60946 5.38172 2.02774 9.8 2.02774C14.2182 2.02774 17.8 5.60946 17.8 10.0278C17.8 14.446 14.2182 18.0278 9.8 18.0278C5.38172 18.0278 1.8 14.446 1.8 10.0278ZM9.8 3.22774C6.04446 3.22774 3 6.2722 3 10.0278C3 13.7833 6.04446 16.8278 9.8 16.8278C13.5555 16.8278 16.6 13.7833 16.6 10.0278C16.6 6.2722 13.5555 3.22774 9.8 3.22774Z"
            fill="#B42318"
          />
        </svg>
      )
    case 'signal':
      return (
        <svg {...common}>
          <path
            d="M17.9422 7.68281C18.0003 7.74088 18.0463 7.80982 18.0777 7.88569C18.1092 7.96156 18.1253 8.04288 18.1253 8.125C18.1253 8.20712 18.1092 8.28844 18.0777 8.36431C18.0463 8.44018 18.0003 8.50912 17.9422 8.56719C17.8841 8.62526 17.8152 8.67132 17.7393 8.70275C17.6634 8.73417 17.5821 8.75035 17.5 8.75035C17.4179 8.75035 17.3366 8.73417 17.2607 8.70275C17.1848 8.67132 17.1159 8.62526 17.0578 8.56719L15.625 7.13359L14.1922 8.56719C14.0749 8.68446 13.9159 8.75035 13.75 8.75035C13.5841 8.75035 13.4251 8.68446 13.3078 8.56719C13.1905 8.44991 13.1247 8.29085 13.1247 8.125C13.1247 7.95915 13.1905 7.80009 13.3078 7.68281L14.7414 6.25L13.3078 4.81719C13.2497 4.75912 13.2037 4.69018 13.1723 4.61431C13.1408 4.53844 13.1247 4.45712 13.1247 4.375C13.1247 4.29288 13.1408 4.21156 13.1723 4.13569C13.2037 4.05982 13.2497 3.99088 13.3078 3.93281C13.4251 3.81554 13.5841 3.74965 13.75 3.74965C13.8321 3.74965 13.9134 3.76583 13.9893 3.79725C14.0652 3.82868 14.1341 3.87474 14.1922 3.93281L15.625 5.36641L17.0578 3.93281C17.1159 3.87474 17.1848 3.82868 17.2607 3.79725C17.3366 3.76583 17.4179 3.74965 17.5 3.74965C17.5821 3.74965 17.6634 3.76583 17.7393 3.79725C17.8152 3.82868 17.8841 3.87474 17.9422 3.93281C18.0003 3.99088 18.0463 4.05982 18.0777 4.13569C18.1092 4.21156 18.1253 4.29288 18.1253 4.375C18.1253 4.45712 18.1092 4.53844 18.0777 4.61431C18.0463 4.69018 18.0003 4.75912 17.9422 4.81719L16.5086 6.25L17.9422 7.68281ZM10 15C9.81458 15 9.63332 15.055 9.47915 15.158C9.32498 15.261 9.20482 15.4074 9.13386 15.5787C9.06291 15.75 9.04434 15.9385 9.08051 16.1204C9.11669 16.3023 9.20598 16.4693 9.33709 16.6004C9.4682 16.7315 9.63525 16.8208 9.8171 16.857C9.99896 16.8932 10.1875 16.8746 10.3588 16.8036C10.5301 16.7327 10.6765 16.6125 10.7795 16.4583C10.8825 16.3042 10.9375 16.1229 10.9375 15.9375C10.9375 15.6889 10.8387 15.4504 10.6629 15.2746C10.4871 15.0988 10.2486 15 10 15ZM13.493 12.3852C12.4778 11.6473 11.255 11.2499 10 11.2499C8.745 11.2499 7.52224 11.6473 6.50703 12.3852C6.37297 12.4827 6.28317 12.6296 6.25739 12.7934C6.2316 12.9572 6.27194 13.1245 6.36953 13.2586C6.46712 13.3927 6.61397 13.4825 6.77777 13.5082C6.94157 13.534 7.10891 13.4937 7.24297 13.3961C8.04415 12.8134 9.00934 12.4996 10 12.4996C10.9907 12.4996 11.9558 12.8134 12.757 13.3961C12.8234 13.4444 12.8987 13.4792 12.9785 13.4984C13.0583 13.5177 13.1411 13.521 13.2222 13.5082C13.3033 13.4955 13.3811 13.4669 13.4512 13.424C13.5212 13.3812 13.5821 13.325 13.6305 13.2586C13.6788 13.1922 13.7136 13.117 13.7328 13.0371C13.7521 12.9573 13.7554 12.8745 13.7426 12.7934C13.7298 12.7123 13.7012 12.6345 13.6584 12.5644C13.6156 12.4944 13.5593 12.4335 13.493 12.3852ZM10.5953 5.01406C10.6774 5.01796 10.7594 5.00566 10.8367 4.97785C10.9141 4.95004 10.9852 4.90728 11.046 4.852C11.1067 4.79672 11.1561 4.73 11.1911 4.65567C11.2261 4.58133 11.2461 4.50083 11.25 4.41875C11.2539 4.33667 11.2416 4.25463 11.2138 4.17731C11.186 4.09999 11.1432 4.02891 11.0879 3.96811C11.0327 3.90732 10.9659 3.85801 10.8916 3.823C10.8173 3.78799 10.7368 3.76796 10.6547 3.76406C10.4375 3.75391 10.2172 3.74844 10 3.74844C6.89272 3.75085 3.88191 4.82787 1.47813 6.79687C1.41467 6.84899 1.3621 6.9131 1.32342 6.98553C1.28474 7.05797 1.26071 7.13731 1.25269 7.21903C1.24467 7.30076 1.25283 7.38326 1.2767 7.46183C1.30057 7.5404 1.33968 7.6135 1.3918 7.67695C1.44392 7.74041 1.50802 7.79298 1.58046 7.83166C1.65289 7.87034 1.73223 7.89437 1.81396 7.90239C1.979 7.91858 2.14372 7.86854 2.27188 7.76328C4.45178 5.97785 7.18224 5.00154 10 5C10.1977 5 10.3977 5.00469 10.5953 5.01406ZM10.5828 8.76953C10.6649 8.77507 10.7473 8.76439 10.8252 8.7381C10.9032 8.71181 10.9752 8.67042 11.0371 8.6163C11.0991 8.56218 11.1498 8.49639 11.1863 8.42268C11.2228 8.34898 11.2445 8.26879 11.25 8.18672C11.2555 8.10464 11.2449 8.02228 11.2186 7.94433C11.1923 7.86638 11.1509 7.79437 11.0968 7.73242C11.0427 7.67047 10.9769 7.61978 10.9032 7.58325C10.8294 7.54672 10.7493 7.52507 10.6672 7.51953C10.4461 7.50469 10.2219 7.49687 10 7.49687C7.81508 7.4883 5.69275 8.22615 3.98438 9.58828C3.88251 9.669 3.80835 9.77946 3.7722 9.9043C3.73605 10.0291 3.73972 10.1621 3.7827 10.2848C3.82568 10.4075 3.90582 10.5137 4.01198 10.5886C4.11814 10.6636 4.24503 10.7036 4.375 10.7031C4.51684 10.7041 4.65473 10.6564 4.76563 10.568C6.25259 9.38379 8.09913 8.74246 10 8.75C10.1938 8.75 10.3906 8.75625 10.5828 8.76953Z"
            fill="#0E7490"
          />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.957 15.7568C15.9354 14.7784 16.4002 13.1414 16.4002 10.3999C16.4002 7.65841 15.9354 6.02147 14.957 5.04309C13.9786 4.06471 12.3417 3.59993 9.60016 3.59993C6.85867 3.59993 5.22174 4.06471 4.24336 5.04309C3.26498 6.02147 2.80019 7.65841 2.80019 10.3999C2.80019 13.1414 3.26498 14.7784 4.24336 15.7568C5.22174 16.7351 6.85867 17.1999 9.60016 17.1999C12.3417 17.1999 13.9786 16.7351 14.957 15.7568ZM15.8055 16.6053C14.4714 17.9395 12.4082 18.3999 9.60016 18.3999C6.79212 18.3999 4.72906 17.9395 3.39483 16.6053C2.06061 15.271 1.60019 13.208 1.60019 10.3999C1.60019 7.59185 2.06061 5.52878 3.39483 4.19456C4.72906 2.86034 6.79212 2.39993 9.60016 2.39993C12.4082 2.39993 14.4714 2.86034 15.8055 4.19456C17.1398 5.52878 17.6002 7.59185 17.6002 10.3999C17.6002 13.208 17.1398 15.271 15.8055 16.6053Z"
            fill="#475467"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.60016 14.116C9.2688 14.116 9.00016 13.8474 9.00016 13.516V10.4C9.00016 10.0686 9.2688 9.8 9.60016 9.8C9.9316 9.8 10.2002 10.0686 10.2002 10.4V13.516C10.2002 13.8474 9.9316 14.116 9.60016 14.116Z"
            fill="#475467"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.2037 7.6C10.2037 7.93137 9.93512 8.2 9.60368 8.2H9.59648C9.26512 8.2 8.99648 7.93137 8.99648 7.6C8.99648 7.26863 9.26512 7 9.59648 7H9.60368C9.93512 7 10.2037 7.26863 10.2037 7.6Z"
            fill="#475467"
          />
        </svg>
      )
  }
}

function MenuChevron() {
  return (
    <span className="customer-dash__menu-chevron" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="m9 6 6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

type CustomerShopperDashboardProps = {
  shopper: CustomerShopper
  onShopperChange: (shopper: CustomerShopper | null) => void
  onDeleted: () => void
}

/**
 * Signed-in shopper home — Profile + Your Checks (Figma post-login).
 */
export function CustomerShopperDashboard({
  shopper,
  onShopperChange,
  onDeleted,
}: CustomerShopperDashboardProps) {
  const [panel, setPanel] = useState<Panel>('checks')
  const [items, setItems] = useState<CustomerCheckHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [profileStatus, setProfileStatus] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('')
  const [username, setUsername] = useState(
    shopper.displayName?.trim() || shopper.email.split('@')[0] || '',
  )
  const [nickname, setNickname] = useState(() => {
    try {
      return localStorage.getItem(`goverifyeye.nickname.${shopper.id}`) ?? ''
    } catch {
      return ''
    }
  })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    setUsername(shopper.displayName?.trim() || shopper.email.split('@')[0] || '')
  }, [shopper.displayName, shopper.email])

  useEffect(() => {
    if (panel !== 'checks') return
    let alive = true
    setLoadingHistory(true)
    setHistoryError('')
    void customerAccountApi
      .history(1)
      .then((page) => {
        if (alive) setItems(page.items)
      })
      .catch((cause) => {
        if (alive) setHistoryError(toUserMessage(cause))
      })
      .finally(() => {
        if (alive) setLoadingHistory(false)
      })
    return () => {
      alive = false
    }
  }, [panel])

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setProfileStatus('')
    setError('')
    try {
      const nextName = username.trim()
      if (nextName.length < 2) {
        throw new Error('Username must be at least 2 characters.')
      }
      const updated = customerAccountApi.updateLocalProfile({
        displayName: nextName,
      })
      if (!updated) throw new Error('Sign in again to update your profile.')
      try {
        localStorage.setItem(
          `goverifyeye.nickname.${shopper.id}`,
          nickname.trim(),
        )
      } catch {
        // Ignore storage failures for optional nickname.
      }
      onShopperChange(updated)
      setProfileStatus('Profile changes saved on this device.')
    } catch (cause) {
      setError(toUserMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setPasswordStatus('')
    setError('')
    try {
      if (currentPassword.length < 8) {
        throw new Error('Enter your current password.')
      }
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters.')
      }
      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirmation do not match.')
      }
      await customerAccountApi.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus('Password updated.')
    } catch (cause) {
      setError(toUserMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    setError('')
    try {
      await customerAccountApi.signOut()
      onShopperChange(null)
    } catch (cause) {
      setError(toUserMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function deleteAccount(event: FormEvent) {
    event.preventDefault()
    if (busy || confirmation !== 'DELETE') return
    setBusy(true)
    setError('')
    try {
      await customerAccountApi.deleteAccount(deletePassword)
      onShopperChange(null)
      setDeleteOpen(false)
      onDeleted()
    } catch (cause) {
      setError(toUserMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  const displayName = shopper.displayName?.trim() || 'Shopper'
  const entryLabel = `${items.length} entr${items.length === 1 ? 'y' : 'ies'}`

  return (
    <div className="customer-dash">
      <header className="customer-dash__header">
        <Link to="/verify" className="customer-dash__brand" aria-label="goVerifEye home">
          <BrandMark className="customer-dash__logo" tone="onLight" />
        </Link>
        <Link to="/verify" className="customer-dash__back">
          <ArrowLeftIcon size={16} />
          Back
        </Link>
      </header>

      <main className="customer-dash__main">
        <aside className="customer-dash__profile" aria-label="Profile">
          <h1 className="customer-dash__profile-title">Profile</h1>

          <div className="customer-dash__identity">
            <span className="customer-dash__avatar" aria-hidden="true">
              <span className="customer-dash__avatar-core">
                <PersonIcon size={28} />
              </span>
            </span>
            <div className="customer-dash__identity-text">
              <p className="customer-dash__name">{displayName}</p>
              <p className="customer-dash__email">{shopper.email}</p>
            </div>
          </div>

          <nav className="customer-dash__menu" aria-label="Account">
            <button
              type="button"
              className={`customer-dash__menu-item${panel === 'edit' ? ' customer-dash__menu-item--active' : ''}`}
              onClick={() => setPanel('edit')}
            >
              <span className="customer-dash__menu-left">
                <span className="customer-dash__menu-icon" aria-hidden="true">
                  <PersonIcon size={18} />
                </span>
                Edit Profile
              </span>
              <MenuChevron />
            </button>

            <button
              type="button"
              className={`customer-dash__menu-item${panel === 'checks' ? ' customer-dash__menu-item--active' : ''}`}
              onClick={() => setPanel('checks')}
            >
              <span className="customer-dash__menu-left">
                <span className="customer-dash__menu-icon" aria-hidden="true">
                  <ScanFrameIcon size={18} />
                </span>
                Your Checks
              </span>
              <MenuChevron />
            </button>

            <button
              type="button"
              className="customer-dash__menu-item customer-dash__menu-item--danger"
              disabled={busy}
              onClick={() => void signOut()}
            >
              <span className="customer-dash__menu-left">
                <span className="customer-dash__menu-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15 12H3m0 0 3-3m-3 3 3 3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {busy ? 'Signing out…' : 'Log out'}
              </span>
            </button>

            <button
              type="button"
              className="customer-dash__menu-item customer-dash__menu-item--danger"
              disabled={busy}
              onClick={() => {
                setError('')
                setDeleteOpen(true)
              }}
            >
              <span className="customer-dash__menu-left">
                <span className="customer-dash__menu-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m1 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Delete Account
              </span>
            </button>
          </nav>

          {error && !deleteOpen ? (
            <p className="customer-dash__error" role="alert">
              {error}
            </p>
          ) : null}
        </aside>

        <section className="customer-dash__content" aria-live="polite">
          {panel === 'checks' ? (
            <>
              <div className="customer-dash__content-head">
                <div>
                  <h2 className="customer-dash__content-title">Your Checks</h2>
                  <p className="customer-dash__content-sub">Scan History</p>
                </div>
                {!loadingHistory && !historyError ? (
                  <span className="customer-dash__count">{entryLabel}</span>
                ) : null}
              </div>

              {loadingHistory ? (
                <p className="customer-dash__empty">Loading your scan history…</p>
              ) : historyError ? (
                <p className="customer-dash__error" role="alert">
                  {historyError}
                </p>
              ) : items.length === 0 ? (
                <div className="customer-dash__empty-card">
                  <p className="customer-dash__empty">
                    No saved checks yet. Verify a product to see it here.
                  </p>
                  <Link to="/verify" className="customer-dash__cta">
                    Verify a product
                  </Link>
                </div>
              ) : (
                <ul className="customer-dash__checks">
                  {items.map((item) => {
                    const tone = checkTone(item)
                    const productName =
                      item.result.product?.name?.trim() || 'Product check'
                    return (
                      <li key={item.receipt} className="customer-dash__check">
                        <span
                          className={`customer-dash__check-icon customer-dash__check-icon--${tone}`}
                        >
                          <CheckStatusIcon tone={tone} />
                        </span>
                        <div className="customer-dash__check-body">
                          <p className="customer-dash__check-name">{productName}</p>
                          <p className="customer-dash__check-code">
                            {formatCode(item.code)}
                          </p>
                        </div>
                        <p className="customer-dash__check-time">
                          {formatCheckedAt(item.checkedAt)}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          ) : (
            <div className="customer-dash__edit-stack">
              <form className="customer-dash__edit-block" onSubmit={(e) => void saveProfile(e)}>
                <h2 className="customer-dash__content-title">Edit profile</h2>

                <label className="customer-dash__edit-label">
                  Username
                  <input
                    className="customer-dash__edit-input"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="name"
                    maxLength={80}
                    required
                  />
                </label>

                <label className="customer-dash__edit-label">
                  Nikename
                  <input
                    className="customer-dash__edit-input"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="Enter nikename"
                    autoComplete="nickname"
                    maxLength={40}
                  />
                </label>

                {profileStatus ? (
                  <p className="customer-dash__success" role="status">
                    {profileStatus}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="customer-dash__cta"
                  disabled={busy || username.trim().length < 2}
                >
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
              </form>

              <form
                className="customer-dash__edit-block"
                onSubmit={(e) => void savePassword(e)}
              >
                <h2 className="customer-dash__content-title">Change password</h2>

                <label className="customer-dash__edit-label">
                  Current Password
                  <div className="customer-dash__pw-field">
                    <span className="customer-dash__pw-icon" aria-hidden="true">
                      <LockIcon size={18} />
                    </span>
                    <input
                      className="customer-dash__edit-input customer-dash__edit-input--pw"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      minLength={8}
                      maxLength={72}
                      required
                    />
                    <button
                      type="button"
                      className="customer-dash__pw-eye"
                      aria-label={showCurrent ? 'Hide password' : 'Show password'}
                      onClick={() => setShowCurrent((v) => !v)}
                    >
                      <EyeIcon size={18} />
                    </button>
                  </div>
                </label>

                <label className="customer-dash__edit-label">
                  New Password
                  <div className="customer-dash__pw-field">
                    <span className="customer-dash__pw-icon" aria-hidden="true">
                      <LockIcon size={18} />
                    </span>
                    <input
                      className="customer-dash__edit-input customer-dash__edit-input--pw"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="New password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                      required
                    />
                    <button
                      type="button"
                      className="customer-dash__pw-eye"
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                      onClick={() => setShowNew((v) => !v)}
                    >
                      <EyeIcon size={18} />
                    </button>
                  </div>
                </label>

                <label className="customer-dash__edit-label">
                  Confirm Password
                  <div className="customer-dash__pw-field">
                    <span className="customer-dash__pw-icon" aria-hidden="true">
                      <LockIcon size={18} />
                    </span>
                    <input
                      className="customer-dash__edit-input customer-dash__edit-input--pw"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                      required
                    />
                    <button
                      type="button"
                      className="customer-dash__pw-eye"
                      aria-label={
                        showConfirm ? 'Hide password' : 'Show password'
                      }
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      <EyeIcon size={18} />
                    </button>
                  </div>
                </label>

                {passwordStatus ? (
                  <p className="customer-dash__success" role="status">
                    {passwordStatus}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="customer-dash__cta"
                  disabled={
                    busy ||
                    currentPassword.length < 8 ||
                    newPassword.length < 8 ||
                    confirmPassword.length < 8
                  }
                >
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>

      <footer className="customer-dash__footer">
        <p>© 2025 goVerifEye. All rights reserved.</p>
        <nav className="customer-dash__footer-links" aria-label="Legal">
          <Link to="/verify/privacy">Privacy Policy</Link>
          <button type="button" onClick={() => setSupportOpen(true)}>
            Support Center
          </button>
          <button type="button" onClick={() => setSupportOpen(true)}>
            Report Fraud
          </button>
        </nav>
      </footer>

      <CustomerContactSupportModal
        open={supportOpen}
        initialEmail={shopper.email}
        onClose={() => setSupportOpen(false)}
      />

      {deleteOpen ? (
        <div
          className="customer-dash__modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setDeleteOpen(false)
          }}
        >
          <form
            className="customer-dash__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-delete-heading"
            onSubmit={(event) => void deleteAccount(event)}
          >
            <h2 id="dash-delete-heading">Delete account?</h2>
            <p>
              This is permanent. Your profile and concern reports will be
              deleted, and saved checks will be anonymized.
            </p>
            <label>
              Current password
              <input
                autoFocus
                type="password"
                autoComplete="current-password"
                minLength={8}
                maxLength={72}
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                required
              />
            </label>
            <label>
              Type DELETE to confirm
              <input
                value={confirmation}
                maxLength={6}
                onChange={(event) =>
                  setConfirmation(event.target.value.toUpperCase())
                }
                required
              />
            </label>
            {error ? (
              <p className="customer-dash__error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="customer-dash__danger-btn"
              disabled={
                busy || deletePassword.length < 8 || confirmation !== 'DELETE'
              }
            >
              {busy ? 'Deleting…' : 'Permanently delete account'}
            </button>
            <button
              type="button"
              className="customer-dash__ghost-btn"
              disabled={busy}
              onClick={() => {
                setDeleteOpen(false)
                setDeletePassword('')
                setConfirmation('')
                setError('')
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
