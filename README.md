# 🧪 Odisha Municipal Services App - Testing Document

A comprehensive QA checklist for the **Odisha Municipal Services** mobile application.  
This app provides services such as **waste management**, **Kalyan Mandap bookings**, and **pollution complaint management**.

---

## 🚀 Test Environment Requirements

- 📱 Mobile device (iOS / Android)  
- ⚙️ Expo development environment  
- 🌐 Active internet connection  
- 🔐 Valid user credentials  

---

## ✅ Test Coverage

<details>
  <summary><strong>1. Authentication Testing</strong></summary>

### 1.1 User Registration (`Signup.js`)
- [ ] Valid email format validation  
- [ ] Password strength requirements  
- [ ] Successful user registration  
- [ ] Duplicate email handling  
- [ ] OTP functionality (if implemented)  

### 1.2 Login (`Login.js`)
- [ ] Valid credentials login  
- [ ] Invalid credentials handling  
- [ ] "Remember Me" functionality  
- [ ] Password reset flow  
- [ ] Token storage and management  

### 1.3 Forgot Password (`ForgotPassword.js`)
- [ ] Email validation  
- [ ] Reset link/OTP delivery  
- [ ] Password update process  
- [ ] Error handling  

</details>

<details>
  <summary><strong>2. Waste Management Testing</strong></summary>

### 2.1 Personal Waste Form (`PersonalWasteForm.js`)
- [ ] Waste type selection  
- [ ] Address input (house number, floor, block)  
- [ ] Image upload (max 5)  
- [ ] Location selection  
- [ ] Time slot selection  
- [ ] Payment method selection  
- [ ] Form submission  

### 2.2 Public Waste Form (`PublicWasteForm.js`)
- [ ] Waste type selection  
- [ ] Location picker  
- [ ] Image upload  
- [ ] Description input  
- [ ] Contact number validation  
- [ ] Form submission  

</details>

<details>
  <summary><strong>3. Kalyan Mandap Booking Testing</strong></summary>

### 3.1 Mandap Listing (`KalyanMandapBooking/index.js`)
- [ ] Mandap list loading  
- [ ] Image gallery functionality  
- [ ] Filter/search options (if any)  
- [ ] Mandap details display  

### 3.2 Mandap Booking (`KalyanMandapBooking/mandap-details.js`)
- [ ] Date selection  
- [ ] Time slot booking  
- [ ] Occasion input  
- [ ] Number of people input  
- [ ] Payment process  
- [ ] Booking confirmation  

</details>

<details>
  <summary><strong>4. Pollution Complaint Testing</strong></summary>

### 4.1 Pollution Category Selection (`PollutionCategorySelect.js`)
- [ ] Category list loading  
- [ ] Category selection  
- [ ] Subcategory display  
- [ ] Navigation flow  

### 4.2 Pollution Complaint Form (`PollutionComplaintForm.js`)
- [ ] Pollution type selection  
- [ ] Cause selection  
- [ ] Location input  
- [ ] Image upload  
- [ ] Description input  
- [ ] Form submission  

</details>

<details>
  <summary><strong>5. Bookings Management Testing</strong></summary>

### 5.1 Bookings List (`Bookings.js`)
- [ ] Booking list loading  
- [ ] Filtering functionality  
- [ ] Booking status display  
- [ ] Booking details access  
- [ ] Pagination (if implemented)  

### 5.2 Booking Details (`BookingDetails.js`)
- [ ] Booking details display  
- [ ] Status updates  
- [ ] Cancellation process  
- [ ] Payment status display  

</details>

<details>
  <summary><strong>6. General UI/UX Testing</strong></summary>

### 6.1 Navigation
- [ ] Tab navigation  
- [ ] Back button functionality  
- [ ] Deep linking (if implemented)  
- [ ] Navigation stack management  

### 6.2 Components
- [ ] `FloatingLabelInput` functionality  
- [ ] Toast messages  
- [ ] Modal operations  
- [ ] Loading states  
- [ ] Error boundary handling  

### 6.3 Responsiveness
- [ ] Different screen sizes  
- [ ] Keyboard handling  
- [ ] Orientation changes  
- [ ] Text scaling  

</details>

<details>
  <summary><strong>7. API Integration Testing</strong></summary>

### 7.1 API Endpoints
- [ ] Authentication APIs  
- [ ] Waste management APIs  
- [ ] Mandap booking APIs  
- [ ] Pollution complaint submission  
- [ ] Image upload API  

### 7.2 Error Handling
- [ ] Network error handling  
- [ ] Token expiration  
- [ ] Timeout scenarios  
- [ ] Error message display  

</details>

<details>
  <summary><strong>8. Performance Testing</strong></summary>

### 8.1 Load Testing
- [ ] App launch time  
- [ ] Image loading  
- [ ] Form submission speed  
- [ ] List scrolling  

### 8.2 Memory Usage
- [ ] Memory with multiple images  
- [ ] Cleanup on navigation  
- [ ] Cache management  

</details>

---

## 🐞 Bug Reporting Template

```txt
### Bug Description
- Component:
- Expected Behavior:
- Actual Behavior:
- Steps to Reproduce:
- Environment:
  - Device:
  - OS Version:
  - App Version:
- Screenshots/Videos:
