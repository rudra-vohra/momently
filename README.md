# Momently

Momently is a photo sharing platform designed for photographers, event teams, and clients.

It allows an admin to create an event, upload photos, select photos for a gallery, manage team members, and publish a private gallery for the client.

The client receives a public gallery link and can enter a PIN to view and download the published photos.

## About

The main workflow is simple:

```text
Admin creates an event
        ↓
Admin or team members upload photos
        ↓
Photos are stored in Cloudinary
        ↓
Photo information is stored in MongoDB
        ↓
Admin selects photos for the gallery
        ↓
Admin publishes the gallery
        ↓
Client opens the public gallery
        ↓
Client enters the gallery PIN
        ↓
Client views and downloads photos
```

## Features

### Event Management

Admins can:

- Create events
- View events
- Open an event workspace
- Delete events
- Add team members
- Remove team members

### Team Members

Team members can work on events assigned to them.

They can upload photos  for the gallery according to their permissions.

### Photo Management

Photos can also be uploaded in bulk.

Each photo stores information such as:

- File name
- Cloudinary URL
- Thumbnail URL
- File size
- Uploading user
- Event
- Selection status
- Creation time

### Gallery Selection

Admins can select photos for the gallery.

The current selection is different from the published gallery.

For example:

```text
Current selection:  A B D E
Published gallery: A B C D
```

C is still visible to the client because it is part of the published snapshot.

### Gallery Publishing

When a gallery is published, Momently stores a snapshot of the selected photo IDs.

The snapshot contains the exact photos and their order that are available to the client.

### Update Snapshot

An already published gallery can be updated with additional photos.

For example:

```text
Previously published: A B C
Current selection:    A B C D E

After Update Snapshot:
A B C D E
```
The update is additive. Existing published photos are not removed.

### Published Photo Protection

Photos that are part of the published snapshot are protected while the gallery is published.

They cannot be deleted or removed from the current selection.

Photos that are not published can still be worked on.

Unpublishing the gallery removes this protection.

### Public Gallery

Clients do not need an account.

The public gallery flow is:

```text
Gallery URL
    ↓
PIN entry
    ↓
Gallery access
    ↓
Photo grid
    ↓
Lightbox
    ↓
Download
```

### Download

Clients can download individual photos and use the download-all option for bulk download.

## Architecture

```text
                         Browser
                    React + Vite
                         │
                         │ REST API
                         ↓
                    FastAPI Backend
                    Python + Beanie
                     /           \
                    /             \
                   ↓               ↓
            MongoDB Atlas      Cloudinary
           Application Data    Image Storage
```

### Frontend

The frontend uses:

- React
- Vite
- Tailwind CSS

It handles the user interface, routing, authentication screens, dashboards, event workspaces, photo uploads, photo selection, gallery management, and public gallery screens.

### Backend

The backend uses:

- Python
- FastAPI
- Beanie
- MongoDB
- JWT authentication
- Cloudinary

It handles authentication, authorization, events, team members, photos, gallery publishing, gallery PIN access, and downloads.

### Storage

MongoDB stores application data.

Cloudinary stores the actual image files.

MongoDB stores the information needed to reference and manage those images.

## Database Structure

Momently uses MongoDB with four main collections:

```text
users
events
photos
galleries
```

### Users

Stores admin and team member accounts.

```text
User
├── id
├── name
├── email
├── password_hash
├── role
└── event_ids
└── created_at
```
Passwords are stored as hashes.

### Events

Represents a photography event.

```text
Event
├── id
├── name
├── description
├── admin_id
├── cover_image_url
└── team_members_ids
```
An event belongs to an admin and can have team members assigned to it.

### Photos

Stores metadata about uploaded photos.

```text
Photo
├── id
├── event_id
├── uploaded_by
├── filename
├── url
├── thumbnail_url
├── storage_key
├── file_size
├── selected_for_gallery
└── created_at
```
The actual image is stored in Cloudinary.

`selected_for_gallery` represents the current selection. It does not mean that the photo is currently published.

### Galleries

Represents the public gallery for an event.

```text
Gallery
├── id
├── created_at
├── event_id
├── slug
├── pin_hash
├── is_published
└── published_photo_ids
```

`published_photo_ids` is the published snapshot.

## Current Selection vs Published Snapshot

This is one of the important parts of Momently.

```text
Current Selection
        ≠
Published Snapshot
```

The current selection is stored on each photo:

```text
selected_for_gallery
```

The published snapshot is stored on the gallery:

```text
published_photo_ids
```

This allows an admin to continue selecting and organizing photos without changing the gallery that the client has already received.

## Authentication

Momently uses JWT authentication for admin and team member accounts.

Main authentication endpoints:

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

Public galleries use a separate PIN-based access system.

## API Overview

### Authentication

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Events

```text
POST   /events
GET    /events
GET    /events/{event_id}
DELETE /events/{event_id}

POST   /events/{event_id}/team-members
DELETE /events/{event_id}/members/{user_id}

PATCH /events/{event_id}/cover
```

### Photos

```text
POST   /photos/{event_id}
GET    /photos/{event_id}

PATCH  /photos/{event_id}/select
PATCH  /photos/event/{event_id}/selection

DELETE /photos/{photo_id}
```

### Galleries

```text
POST  /galleries/events/{event_id}/publish
GET   /galleries/events/{event_id}

PATCH /galleries/events/{event_id}/unpublish
PATCH /galleries/events/{event_id}/pin
PATCH /galleries/events/{event_id}/snapshot

GET   /galleries/events/{event_id}/photos

GET   /galleries/public/{slug}
POST  /galleries/public/{slug}/access

GET   /galleries/public/{slug}/download-all
```

## Project Structure

```text
photo_sharing_platform/
│
├── backend/
│   └── FastAPI application
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   └── ...
└── README.md
```

The frontend and backend are separate applications inside the same repository.

## Frontend Screens

The main screens are:

1. Landing Page
2. Login
3. Register
4. Admin Dashboard
5. Team Member Dashboard
6. Admin Event Workspace
7. Team Member Event Workspace
8. Public Gallery PIN Entry
9. Public Gallery Locked Out
10. Public Gallery Viewing
11. Photo Lightbox

Team Modal, Publish Gallery Modal, and Gallery Settings Modal are handled as modal states instead of separate routes.

## Responsive Design

The frontend is responsively designed for:

- Mobile
- Tablet
- Desktop

## Design

Momently uses a warm photography-focused visual style.

Main colors:

```text
#FFFAF3
#FFF2DB
#FFE5BF
#BB0028
#F62440
```

The Momently wordmark uses a rounded geometric style with a warm crimson-red color.

## Deployment

The production architecture is:

```text
Vercel Frontend
       │
       ↓
Vercel FastAPI Backend
       │
       ├── MongoDB Atlas
       │
       └── Cloudinary
```

## Upload Architecture

```text
Browser
   ↓
Frontend upload batching
   ↓
FastAPI /photos/{event_id}
   ↓
Cloudinary
   ↓
MongoDB photo document
   ↓
Uploaded photo returned to frontend
   ↓
Photo appears immediately in workspace
```

The frontend uses size-aware batching for the production deployment.

The user can select many photos at once. The frontend automatically splits them into smaller requests and uploads the batches sequentially.

This keeps the upload experience simple while respecting the production request size limit.

## Running Locally

### Backend

```bash
cd backend
python -m venv venv
```

On Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Add the required environment variables and start the FastAPI server using the project's configured entry point.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

## Environment Variables

Keep secrets in local `.env` files and configure them through the deployment platform in production.

Backend variables include:

```text
MONGODB_USERNAME
MONGODB_PASSWORD
MONGO_URI
JWT_SECRET_KEY
JWT_ALGORITHM
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CORS_ORIGINS
```

Frontend:

```text
VITE_API_URL
```

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| Language | Python |
| Database | MongoDB Atlas |
| ODM | Beanie |
| Authentication | JWT |
| Image Storage | Cloudinary |
| Hosting | Vercel |

## Project Status

Momently is an actively deployed project.

Try it urself using the link: https://momently-steg.vercel.app/
