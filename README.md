# Grocery Choice Customer App

Grocery Choice is an online grocery shopping platform.

This repository contains the customer-facing mobile application built with **Expo** and **React Native**, designed for Android, iOS, and Web. It delivers a fast, responsive grocery shopping experience with real-time catalogue browsing, seamless address management, shopping cart operations, Cash on Delivery (COD), Razorpay online payment integration, and end-to-end order tracking.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Backend & API Configuration](#backend--api-configuration)
- [Deep Linking & Payment Flow](#deep-linking--payment-flow)
- [Security Notes](#security-notes)
- [Related Projects](#related-projects)

---

## Overview

The Grocery Choice Customer Mobile App interacts with the Grocery Choice Spring Boot REST backend to allow customers to:
- Authenticate securely via JWT tokens
- Browse categories and products with search, filtering, and stock availability
- Manage an interactive shopping cart with live discount and delivery fee calculation
- Add, edit, select, and delete delivery addresses with full validation and compatibility
- Place orders using Cash on Delivery (COD) or online payment through Razorpay
- Track order progression in real time and cancel eligible pending orders
- Review complete order history and manage customer account profiles

---

## Key Features

1. **Authentication & Session Persistence**:
   - Secure customer login and registration.
   - Secure token storage with automatic session restoration and token attachment on API calls.

2. **Product Catalogue & Discovery**:
   - Category-wise product filtering and instant search.
   - Rich product cards displaying pricing, discounts, pack size, stock status, and imagery.
   - Detailed product view with description, nutritional facts, and direct add-to-cart actions.

3. **Cart & Pricing Engine**:
   - Real-time cart updates with increment/decrement/remove actions.
   - Calculation of subtotal, delivery charges, savings, and grand total.

4. **Address Management**:
   - Save multiple delivery addresses (Home, Work, Other).
   - Add new addresses with comprehensive client-side validation (name, mobile, street, city, state, pincode).
   - Edit existing addresses with prefilled fields and null-safe data normalization.
   - Delete addresses with confirmation dialogs.
   - Seamless compatibility with backend address contracts (`normalizeAddress` / `toBackendAddressRequest`).

5. **Flexible Checkout & Payments**:
   - Cash on Delivery (COD) with immediate order confirmation.
   - Online payment via Razorpay using an in-app browser bridge (`expo-web-browser`) to avoid native binary compilation issues while maintaining deep-link return flows (`grocerychoice://payment/verify`).
   - Server-side cryptographic payment verification (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`).
   - Safe cart clearing only upon verified payment confirmation.

6. **Order Tracking & Management**:
   - Active orders and past order history tabs.
   - Interactive order timeline tracking order status (`PLACED`, `PENDING`, `CONFIRMED`, `PROCESSING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).
   - Customer self-service order cancellation for eligible orders (`PLACED`, `PENDING`, `CONFIRMED`) with confirmation alerts and instant status refresh.

7. **Profile & Account Management**:
   - User profile viewing and profile details update.
   - One-tap logout clearing local tokens and cache.

---

## Technology Stack

- **Framework**: [Expo SDK 54](https://expo.dev/) (React Native 0.81)
- **Routing**: [Expo Router v4](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Language**: TypeScript (`strict` mode enabled)
- **Icons**: `@expo/vector-icons` (Lucide, Ionicons, MaterialIcons)
- **State Management**: React Context & Hooks (`AuthContext`, `CartContext`, `AddressContext`)
- **Persistence**: `@react-native-async-storage/async-storage`
- **HTTP Client**: Axios with interceptors
- **In-App Browser & Deep Links**: `expo-web-browser` and `expo-linking`
- **Test Runner**: Node test runner with native TypeScript type stripping

---

## Project Structure

```text
customer-app/
├── assets/                  # App icons, splash screens, and static images
├── src/
│   ├── __tests__/           # Unit and regression test suites
│   │   ├── addressManagement.test.mjs
│   │   ├── orderAddress.test.mjs
│   │   └── orderCancellation.test.mjs
│   ├── api/                 # REST API services (Axios client)
│   │   ├── addresses.ts     # Address CRUD endpoints and payload adapters
│   │   ├── auth.ts          # Authentication endpoints (login, register)
│   │   ├── client.ts        # Axios instance with auth headers & error handling
│   │   ├── orders.ts        # Order creation, fetching, and cancellation
│   │   ├── payments.ts      # Razorpay order creation and payment verification
│   │   └── products.ts      # Product and category catalogue endpoints
│   ├── app/                 # Expo Router file-based screens & layouts
│   │   ├── (tabs)/          # Bottom navigation tabs
│   │   │   ├── _layout.tsx  # Tab bar navigation configuration
│   │   │   ├── index.tsx    # Home / catalogue screen
│   │   │   ├── cart.tsx     # Shopping cart screen
│   │   │   ├── orders.tsx   # Order history list
│   │   │   └── profile.tsx  # User profile screen
│   │   ├── address/         # Address management screen (list, add, edit, delete)
│   │   ├── auth/            # Auth screens (login, register)
│   │   ├── checkout/        # Checkout flow & payment method selection
│   │   ├── order/           # Order details & tracking screen
│   │   ├── payment/         # Deep link verification handler screen
│   │   ├── product/         # Product detail screen
│   │   ├── search/          # Product search screen
│   │   └── _layout.tsx      # Root application layout and providers
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Header, EmptyState, Loading, etc.
│   │   └── ui/              # Button, Card, Badge, ProductCard, QuantitySelector
│   ├── constants/           # Colors, typography, spacing, API endpoints
│   ├── context/             # Global Context providers (Auth, Cart)
│   ├── services/            # Payment orchestration & bridge helpers
│   ├── storage/             # AsyncStorage wrappers for tokens & cached state
│   ├── theme/               # Design tokens, color palette, typography styles
│   ├── types/               # TypeScript interfaces and enum definitions
│   └── utils/               # Formatters (currency, date), validators, sanitizers
├── .env.example             # Environment variable template with safe placeholders
├── .gitignore               # Strict gitignore excluding secrets and build outputs
├── app.json                 # Expo project configuration
├── package.json             # NPM package scripts and dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

---

## Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on your mobile device (or Android Studio / Xcode for emulators)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/Soumyapatra-0505/grocery-choice-customer-app.git
   cd grocery-choice-customer-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` or `.env.local`:
   ```bash
   cp .env.example .env
   ```
   Configure your local IP or backend URL as needed (see [Environment Variables](#environment-variables)).

---

## Environment Variables

The app uses Expo's built-in environment variable convention (`EXPO_PUBLIC_*`). These variables are embedded into the client bundle at build time.

Refer to `.env.example`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_BASE_URL` | Backend Spring Boot REST API URL | Defaults to production Railway API if omitted |
| `EXPO_PUBLIC_API_URL` | Alternate API URL override | Safe fallback |
| `EXPO_PUBLIC_CUSTOMER_WEB_URL` | Customer Web Storefront URL for hosted Razorpay payment bridge | Deployed web checkout URL |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Public Razorpay Key ID (Client-side public key only) | `rzp_test_...` or production key ID |

> [!WARNING]
> **NEVER put secret keys, database credentials, or private tokens in any client environment file.** Only public keys and public URLs belong in mobile application builds.

---

## Running the Application

Start the Expo development server:

```bash
npx expo start
```

### Options:
- **Android Device / Emulator**: Press `a` in the terminal, or scan the QR code using the Expo Go app.
- **iOS Simulator / Device**: Press `i` in the terminal, or scan the QR code with the iOS Camera.
- **Web Browser**: Press `w` in the terminal to run in a web browser.
- **Clear Metro Cache**:
  ```bash
  npx expo start -c
  ```

---

## Testing & Quality Assurance

### Type Checking

Verify TypeScript integrity across the entire project:
```bash
npx tsc --noEmit
```

### Running Automated Tests

Run the complete test suite:
```bash
npm test
```

The test suite covers:
- **Address Management & Normalization** (`src/__tests__/addressManagement.test.mjs`):
  - Normalization of missing/null fields (`street`, `city`, `state`, `pincode`, `type`)
  - Conversion between mobile and backend API payload structures
  - Duplicate address detection and validation
- **Order Address Safety** (`src/__tests__/orderAddress.test.mjs`):
  - Null-safe address rendering for Cash on Delivery (COD) and Online orders
  - Fallback string formatting preventing undefined property crashes
- **Order Cancellation Eligibility** (`src/__tests__/orderCancellation.test.mjs`):
  - Validation of cancellation eligibility for statuses (`PLACED`, `PENDING`, `CONFIRMED`)
  - Non-cancellable state protection (`PROCESSING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`)

---

## Backend & API Configuration

The app connects to the **Grocery Choice Spring Boot Backend** providing:
- `/api/auth/login`, `/api/auth/register` — User authentication
- `/api/products`, `/api/categories` — Catalogue discovery
- `/api/addresses` — User address management
- `/api/orders` — Order placement, listing, and cancellation (`/api/orders/{id}/cancel`)
- `/api/payments/create-order`, `/api/payments/verify` — Razorpay online payment lifecycle

By default, the app points to the production backend deployment or can be overridden via `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to point to `http://<your-local-ip>:8080`.

---

## Deep Linking & Payment Flow

The app registers the custom deep-link scheme:
```text
grocerychoice://
```

### Hosted Razorpay Payment Architecture:
1. The app creates an order in the backend and receives the backend Order ID and Razorpay Order ID.
2. The app opens the web payment bridge via `expo-web-browser` (`WebBrowser.openAuthSessionAsync`).
3. The bridge handles Razorpay checkout securely using the public key.
4. On completion, the bridge redirects back to:
   ```text
   grocerychoice://payment/verify?orderId=...&razorpay_order_id=...&razorpay_payment_id=...&razorpay_signature=...
   ```
5. The app forwards the payload to `/api/payments/verify` where the backend cryptographically validates the signature.
6. Upon verified success, the order transitions to `PAID` and the local cart is cleared.

---

## Security Notes

- **Zero Client Secrets**: Razorpay secret keys, JWT signing keys, database credentials, and service accounts are strictly maintained on the backend and are **never** bundled into the mobile app.
- **Protected Storage**: User authentication tokens are stored securely in asynchronous storage and transmitted solely via standard Authorization headers over HTTPS.
- **Input Validation**: All customer-entered data (delivery addresses, contact numbers, pincodes) is validated and sanitized on the client before network transmission.

---

## Related Projects

Grocery Choice is organized into dedicated repositories for each service:
- `grocery-choice-customer-app` — Customer Mobile Application (This repository)
- `grocery-choice-customer` — Customer Web Storefront
- `grocery-choice-owner` — Owner / Admin Web Portal
- `grocery-choice-backend` — Spring Boot Backend REST API
- `grocery-choice-owner-app` — Store Owner Mobile App (Planned)
- `grocery-choice-delivery-app` — Delivery Partner Mobile App (Planned)
