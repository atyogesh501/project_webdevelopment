# Patient Booking

A React frontend and Express API for clinic appointment booking. Patients book appointments, doctors manage schedules, and administrators manage the service catalog, doctors, and appointments.

## Run locally

Use Node.js 24, npm, and a local MongoDB instance or a dedicated development database.

1. In each application directory, copy `.env.example` to `.env` and run `npm ci`.
2. Set the MongoDB connection in the backend's `.env`.
3. Run `npm run dev` from `patientbooking-backend` and from `patientbooking-frontend` in separate terminals.
4. Open http://localhost:3000. Vite forwards API requests to http://localhost:5000 by default. Check the API at http://localhost:5000/api/health.
5. For Google sign-in, enable Google as a sign-in provider in Firebase and configure the same Firebase project in both applications.

Run `npm run build` from the frontend directory to build the site. Use a disposable development database because the application seeds demo accounts with fixed passwords when it initializes an empty database.

## Import history

The patient booking source was imported from the existing frontend and backend repositories. The 40 import commits group the source by feature and use assigned dates from October 15 to November 23, 2026. These dates represent a reconstructed sequence. Check out the final import commit to run the complete application.
