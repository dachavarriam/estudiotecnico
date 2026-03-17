# NocoDB Schema Documentation

## Database Overview

**Database**: `estudio_tecnico`
**Description**: System for managing technical security studies for TAS Honduras.

## Tables

### `technical_studies`

- **Table ID**: `mxyg1dg5evhjdgl`
- **Description**: Main table storing study details (site observations, client info, engineers).
- **Key Relations**:
  - `versions` (Has Many) -> `StudyVersions`
  - `followers_link` (Has Many) -> `StudyFollowers`
  - `users` (Belongs To) -> `users` (Creator)

### `StudyVersions`

- **Table ID**: `mo5s6ro1l9jmkn4`
- **Description**: Stores snapshots of study states.
- **Fields**: `version_name`, `snapshot_data` (JSON), `created_by`.
- **Relations**:
  - `technical_studies` (Link Column) -> `technical_studies`

### `StudyFollowers`

- **Table ID**: `mkke9u0hi7x1vej`
- **Description**: Join table for Users following Studies.
- **Relations**:
  - `technical_studies` (Link Column) -> `technical_studies`
  - `users` (Link Column) -> `users`

### `users`

- **Table ID**: `myyvu2xakmkxqz3`
- **Description**: System users (Engineers, Directors).
- **Relations**:
  - `technical_studies_list` (Has Many) -> `technical_studies`
  - `studies_link` (Has Many) -> `StudyFollowers`

## Implementation Details

When using the NocoDB API to create records with links:

- To link a Version to a Study, provide `{ technical_studies: STUDY_ID }`.
- To link a Follower to a Study and User, provide `{ technical_studies: STUDY_ID, users: USER_ID }`.
