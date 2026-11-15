# DEBDE Phase 1 Requirements

## Scope

DEBDE is a campus marketplace for students, clubs, suppliers, and student projects to publish academic tools, course materials, campus offers, and announcements. Users can browse, filter, view details, contact the owner, save listings, and create a listing when authenticated.

## Functional requirements

| ID | Requirement | Acceptance result |
| --- | --- | --- |
| FR-01 | Browse available listings. | Home and Catalog show listing cards with title, price, status, image, and metadata. |
| FR-02 | Filter listings. | Catalog filters by faculty, price type, condition, search text, and sort order. |
| FR-03 | View a listing. | View Details opens the selected item by ID and shows its own data and image. |
| FR-04 | Contact the owner. | The detail page creates a WhatsApp message using the selected meetup spot. |
| FR-05 | Save a listing. | An authenticated user can add a listing to the wishlist. |
| FR-06 | Create a listing. | An authenticated user can submit title, faculty, price, pickup, description, and an optional image. |
| FR-07 | Campus announcements. | Home shows announcements filtered by University, City, and Campus. |
| FR-08 | Open an announcement. | View Details opens the selected announcement page, not the Catalog. |
| FR-09 | Authentication. | Demo student, club, and supplier accounts can sign in; protected pages require a valid session. |
| FR-10 | Responsive navigation. | Desktop navigation collapses to a Font Awesome menu button on smaller screens. |

## Non functional requirements

| ID | Requirement | Acceptance result |
| --- | --- | --- |
| NFR-01 | Usability | Labels, buttons, spacing, fallback images, and error messages are clear. |
| NFR-02 | Responsive design | Cards, forms, selectors, and navigation remain usable on phone and desktop widths. |
| NFR-03 | Maintainability | HTML, CSS, and JavaScript are separated; the stylesheet is expanded and readable. |
| NFR-04 | Consistency | DEBDE colors, logo, typography, image treatment, and controls are reused across pages. |
| NFR-05 | Data integrity | A detail link preserves the selected item or announcement ID and loads the matching record. |
| NFR-06 | Media resilience | Missing listing images use the DEBDE default image; uploaded images are limited to 5 MB. |
| NFR-07 | Security baseline | Protected pages and write actions require the DEBDE session cookie. |

## Stakeholders

| Stakeholder | Interest and responsibility |
| --- | --- |
| Students and underclassmen | Find affordable tools, books, equipment, and donations. |
| Seniors and graduates | Sell, swap, or donate used academic items. |
| Clubs and student chapters | Publish campus activities and useful student announcements. |
| Campus suppliers and bookstores | Publish relevant offers for students. |
| Student projects | Publish product or order announcements such as stickers and stationery. |
| DEBDE administrators | Maintain accounts, listings, announcements, and moderation rules. |
| Course or faculty communities | Provide context for filtering and safe campus exchange. |

## UML views for Phase 1

### Use case view

| Actor | Use cases |
| --- | --- |
| Student | Sign in, browse listings, filter listings, view item details, contact owner, save listing, post item, upload image |
| Club Representative | Sign in, publish announcement, manage own announcements |
| Supplier | Sign in, publish announcement, manage own announcements |
| Student Project | Sign in, publish announcement, manage own announcements |
| Administrator | Manage accounts, listings, announcements, and moderation rules |

### Item details sequence

| Step | Participant | Action |
| --- | --- | --- |
| 1 | User | Selects View Details for an item ID. |
| 2 | Catalog | Requests `GET /api/catalog/{id}`. |
| 3 | Server | Finds the item and its owner. |
| 4 | Server | Returns the selected item JSON, including image and metadata. |
| 5 | Item Details | Renders the selected item, not a catalog page. |

### Announcement sequence

| Step | Participant | Action |
| --- | --- | --- |
| 1 | User | Selects University, City, or Campus. |
| 2 | Home | Requests filtered announcements. |
| 3 | Server | Filters the announcement store. |
| 4 | Home | Shows matching cards with announcement IDs. |
| 5 | User | Selects View Details. |
| 6 | Announcement Details | Requests and renders the selected announcement. |

### Core domain relationships

| Relationship | Meaning |
| --- | --- |
| Account 1 to many Listing | One account can create many listings. |
| Account 1 to many Announcement | One club, supplier, or student project account can publish many announcements. |
| Listing 1 to 1 Image | A listing has one primary image or the DEBDE fallback. |
| Announcement 1 to 1 Image | An announcement has one primary image or the DEBDE fallback. |
| Listing many to 1 Campus | Many listings can belong to one campus. |
| Announcement many to 1 Campus | Many announcements can belong to one campus. |
| University 1 to many City | A university can have multiple cities. |
| City 1 to many Campus | A city can have multiple campuses. |

## Current implementation note

The application uses a small in-memory demo store for Phase 1. The demo accounts and sample listings are test data; a production release would replace them with persistent storage, moderation, and a proper media service.
