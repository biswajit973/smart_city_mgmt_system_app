# Joda Municipality (Odisha Municipal Services App)

**Version:** 1.0.0

---

## Table of Contents
- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
- [Version History](#version-history)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## About

Joda Municipality is a React Native (Expo) app for Odisha citizens to access municipal services, including waste management, Kalyan Mandap bookings, pollution complaints, and grievance redressal.  
Empowering citizens for a cleaner, greener, and more responsive Joda.

---

## Features

- **User Authentication:** Signup, login, password reset, and account management.
- **Waste Management:** Book personal/public waste pickup, upload images, select location, and pay online.
- **Kalyan Mandap Booking:** Browse, filter, and book community halls for events.
- **Cesspool Services:** Request cleaning and track requests.
- **Pollution Complaint:** File and track pollution-related complaints.
- **Grievance Redressal:** Submit and monitor civic complaints.
- **Notifications:** In-app notifications for updates.
- **Help & Support:** Contact information for escalation.

---

## Installation

1. Clone the repository:
   ```powershell
   git clone <repo-url>
   cd my-app
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the app:
   ```powershell
   npx expo start
   ```

---

## Usage

- Open in Expo Go, Android/iOS emulator, or web browser.
- Edit files in the `app/` directory to customize features.
- Uses file-based routing via `expo-router`.

---

## Scripts

- `npm start` – Start Expo development server.
- `npm run android` – Run on Android emulator/device.
- `npm run ios` – Run on iOS simulator/device.
- `npm run web` – Run in web browser.
- `npm run lint` – Lint the codebase.
- `npm run reset-project` – Reset to a blank project (moves code to `app-example`).

---

## Dependencies

- React Native, Expo, Expo Router, React Navigation, Lottie, AsyncStorage, Maps, Modal, Toast, and more.
- See `package.json` for the full list.

---

## Version History

### v1.0.0 (June 2025)
- Initial public release.
- Core modules: Authentication, Waste Management, Kalyan Mandap, Cesspool, Pollution, Grievance, Notifications.
- Modern UI, file-based routing, and Expo support.

---

## Testing

See [`TESTING.md`](./TESTING.md) for detailed manual test cases for all modules, including authentication, waste management, Kalyan Mandap, and more.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

Specify your license here (e.g., MIT, Apache 2.0, etc.).
