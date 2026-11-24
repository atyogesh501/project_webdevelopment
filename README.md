# Smart Clinic · Patient Booking

**A web app for booking clinic appointments, managing doctor availability, and coordinating appointments across a clinic.**

**[Open the live Smart Clinic demo](https://master.d3478oam6crwuo.amplifyapp.com)**

![Smart Clinic cover](patientbooking-frontend/public/images/clinic-hero.png)

[Features](#features) · [How it works](#how-it-works) · [Local setup](#local-setup) · [API](#api)

## Features

| Role | Sign-in | What they can do |
| --- | --- | --- |
| Patient | Google via Firebase | Browse services and doctors, choose an available time, and view or cancel appointments. |
| Doctor | Staff email and password | Review assigned appointments, update weekly working hours, and mark sessions complete. |
| Administrator | Staff email and password | Manage doctors and services, review clinic-wide bookings, and update appointment statuses. |

## How it works

1. A patient selects a service, a doctor, and a date. The API generates slots from the doctor's working hours and the service duration, filtering out past times and overlaps with existing bookings.
2. The patient submits the booking. The API checks the requested slot again before saving the appointment in MongoDB.
3. Doctors see their assigned appointments, and administrators can review bookings across the clinic. Appointment statuses include pending, approved, cancelled, and completed.

The **React** interface uses **Vite** and **Tailwind CSS**. An **Express** API handles sessions, role checks, scheduling, and data access. On patient sign-in, the API verifies the **Firebase** ID token and creates a cookie-based application session. **MongoDB** stores users, sessions, services, doctors, and appointments.

## Local setup

Install **Node.js 24** and **npm**, and have a disposable MongoDB database available. Run these commands in PowerShell.

**1. Start the backend**

```powershell
git clone https://github.com/atyogesh501/project_webdevelopment.git
cd project_webdevelopment/patientbooking-backend
Copy-Item .env.example .env
npm ci
npm run dev
```

Set `MONGODB_URI` and, if needed, `MONGODB_DB` in the backend's `.env` before starting the server. The default API port is **5000**. Check [API health](http://localhost:5000/api/health) after startup.

**2. Start the frontend**

Open a second terminal at the repository root.

```powershell
cd patientbooking-frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Leave `VITE_API_URL` empty for local development so Vite can proxy API requests to Express. Run `npm run build` from the frontend directory to create a production build.

**3. Configure Google sign-in**

Enable Google as a sign-in provider in Firebase. Copy the web app's Firebase settings into the frontend's `VITE_FIREBASE_*` variables and set `FIREBASE_PROJECT_ID` in the backend to the same project ID. Restart both development servers after changing the environment files.

> The app seeds sample services and staff accounts with fixed demo passwords when it initializes an empty database. Use a disposable development database and sample data.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Check that the Express API is running. |
| `GET /api/services` | Browse the clinic's services. |
| `GET /api/doctors` | Browse doctors. |
| `GET /api/doctors/:id/slots` | Find available appointment times. |
| `POST /api/auth/login` | Sign in as clinic staff. |
| `POST /api/auth/google` | Exchange a Firebase ID token for an application session. |
| `GET /api/appointments` | View appointments available to the signed-in role. |
| `POST /api/appointments` | Book an appointment as a patient. |

## Repository layout

- [patientbooking-frontend/](patientbooking-frontend/) contains the clinic homepage, sign-in, and dashboards.
- [patientbooking-backend/](patientbooking-backend/) contains the REST API, session handling, and booking logic.

## Import history

The 40 import commits group the existing frontend and backend source by feature. Their assigned dates, October 15 through November 23, 2026, represent a reconstructed sequence.
