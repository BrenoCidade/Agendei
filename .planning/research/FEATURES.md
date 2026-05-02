# Research: Features

## Core v1 Features

### Provider Setup

- Account creation and login
- Real profile/business configuration
- Service CRUD
- Availability management saved to the database

### Public Booking

- Public provider page by slug
- Dynamic slots derived from service + availability + booked appointments
- Appointment creation with persistent backend state
- Customer self-service lookup and cancellation

### Operational Resilience

- Loading, empty, and error states on critical screens
- Useful mutation feedback
- Graceful auth expiry and unstable-network handling
- Strong E2E coverage for the main path

## Differentiators Deferred

- Real-time push updates
- Notification system depth
- Marketplace/discovery features
- CRM and analytics expansion

## Anti-Features For This Milestone

- Any new user journey that does not directly strengthen the provider setup or booking loop
- Cosmetic complexity that hides incomplete persistence
- “Looks saved” interactions without confirmed backend success
