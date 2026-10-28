# Organization Documents API

Organization Documents stores payroll and statutory compliance files for each tenant organization. Files are uploaded to Cloudinary with authenticated delivery and API responses return short-lived signed preview/download URLs.

## Storage

- Collection: `organization_documents`
- Cloudinary folder: `hrms/organization-documents/{organizationId}`
- Allowed file types: PDF, JPG, PNG, DOCX
- Max file size: 8 MB

## Permissions

- `ORG_DOCUMENT_VIEW`: view documents and signed URLs
- `ORG_DOCUMENT_UPLOAD`: upload or replace documents
- `ORG_DOCUMENT_DELETE`: delete documents
- `ORG_DOCUMENT_REPORT_VIEW`: view missing and expiring reports

Existing `ORG_SETTINGS_*`, `PAYROLL_CONFIG_MANAGE`, and `PAYROLL_REPORT_VIEW` permissions are accepted for settings/payroll administrators.

## Endpoints

- `GET /api/v1/organization-documents/catalog`
- `GET /api/v1/organization-documents`
- `GET /api/v1/organization-documents/summary`
- `GET /api/v1/organization-documents/reports/missing`
- `GET /api/v1/organization-documents/reports/expiring-soon?days=30`
- `POST /api/v1/organization-documents/upload`
- `PATCH /api/v1/organization-documents/:id`
- `GET /api/v1/organization-documents/:id/access`
- `DELETE /api/v1/organization-documents/:id`

## Upload Payload

```json
{
  "documentKey": "COMPANY_PAN",
  "documentNumber": "ABCDE1234F",
  "expiryDate": null,
  "remarks": "Verified by HR",
  "file": {
    "fileName": "company-pan.pdf",
    "mimeType": "application/pdf",
    "size": 120000,
    "base64Data": "..."
  }
}
```

Uploading an already existing `documentKey` replaces the current file and appends an upload history entry.
