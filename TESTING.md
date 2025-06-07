# Odisha Municipal Services App Testing Document

## Overview
This document outlines the testing procedures for the Odisha Municipal Services mobile application. The app provides various services including waste management, Kalyan Mandap bookings, and pollution complaint management.

## Test Environment Requirements
- Mobile device running iOS/Android
- Expo development environment
- Active internet connection
- Valid user credentials

## 1. Authentication Testing

### 1.1 User Registration (Signup.js)
- [ ] Test valid email format validation
- [ ] Test password strength requirements
- [ ] Test successful user registration
- [ ] Test duplicate email handling
- [ ] Verify OTP functionality if implemented

### 1.2 Login (Login.js)
- [ ] Test valid credentials login
- [ ] Test invalid credentials handling
- [ ] Test "Remember Me" functionality
- [ ] Test password reset flow
- [ ] Verify token storage and management

### 1.3 Forgot Password (ForgotPassword.js)
- [ ] Test email validation
- [ ] Test reset link/OTP delivery
- [ ] Test password update process
- [ ] Verify error handling

## 2. Waste Management Testing

### 2.1 Personal Waste Form (PersonalWasteForm.js)
- [ ] Test waste type selection
- [ ] Verify address input fields (house number, floor, block)
- [ ] Test image upload (max 5 images)
- [ ] Test location selection
- [ ] Verify time slot selection
- [ ] Test payment method selection
- [ ] Verify form submission

### 2.2 Public Waste Form (PublicWasteForm.js)
- [ ] Test waste type selection
- [ ] Test location picker
- [ ] Verify image upload
- [ ] Test description input
- [ ] Verify contact number validation
- [ ] Test form submission

## 3. Kalyan Mandap Booking Testing

### 3.1 Mandap Listing (KalyanMandapBooking/index.js)
- [ ] Test mandap list loading
- [ ] Verify image gallery functionality
- [ ] Test filter/search options if available
- [ ] Verify mandap details display

### 3.2 Mandap Booking (KalyanMandapBooking/mandap-details.js)
- [ ] Test date selection
- [ ] Verify time slot booking
- [ ] Test occasion input
- [ ] Test number of people input
- [ ] Verify payment process
- [ ] Test booking confirmation

## 4. Pollution Complaint Testing

### 4.1 Pollution Category Selection (PollutionCategorySelect.js)
- [ ] Test category list loading
- [ ] Verify category selection
- [ ] Test subcategory display
- [ ] Verify navigation flow

### 4.2 Pollution Complaint Form (PollutionComplaintForm.js)
- [ ] Test pollution type selection
- [ ] Verify cause selection
- [ ] Test location input
- [ ] Test image upload
- [ ] Verify description input
- [ ] Test form submission

## 5. Bookings Management Testing

### 5.1 Bookings List (Bookings.js)
- [ ] Test booking list loading
- [ ] Verify filtering functionality
- [ ] Test booking status display
- [ ] Verify booking details access
- [ ] Test pagination if implemented

### 5.2 Booking Details (BookingDetails.js)
- [ ] Test booking details display
- [ ] Verify status updates
- [ ] Test cancellation process
- [ ] Verify payment status display

## 6. General UI/UX Testing

### 6.1 Navigation
- [ ] Test tab navigation
- [ ] Verify back button functionality
- [ ] Test deep linking if implemented
- [ ] Verify navigation stack management

### 6.2 Components
- [ ] Test FloatingLabelInput functionality
- [ ] Verify toast messages
- [ ] Test modal operations
- [ ] Verify loading states
- [ ] Test error boundary handling

### 6.3 Responsiveness
- [ ] Test on different screen sizes
- [ ] Verify keyboard handling
- [ ] Test orientation changes
- [ ] Verify text scaling

## 7. API Integration Testing

### 7.1 API Endpoints
- [ ] Test authentication endpoints
- [ ] Verify waste management API calls
- [ ] Test Kalyan Mandap booking endpoints
- [ ] Verify pollution complaint submission
- [ ] Test image upload API

### 7.2 Error Handling
- [ ] Test network error handling
- [ ] Verify token expiration handling
- [ ] Test API timeout scenarios
- [ ] Verify error message display

## 8. Performance Testing

### 8.1 Load Testing
- [ ] Test app launch time
- [ ] Verify image loading performance
- [ ] Test form submission speed
- [ ] Verify list scrolling performance

### 8.2 Memory Usage
- [ ] Monitor memory usage with multiple images
- [ ] Test memory cleanup on navigation
- [ ] Verify cache management

## Bug Reporting Template

When reporting bugs, use the following template:

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

## Test Case Status Tracking

Use the following status indicators:
- ✅ Passed
- ❌ Failed
- 🟡 Partially Working
- ⏳ Not Tested

## Notes
- All tests should be performed on both iOS and Android platforms
- Test with different user roles if applicable
- Document any specific test data requirements
- Update test cases as new features are added
