# API Documentation - CloudStore Service

## Overview

CloudStore is a RESTful API service for cloud-based file storage and management. This documentation covers authentication, endpoints, and usage examples.

## Base URL

```
https://api.cloudstore.com/v1
```

## Authentication

All API requests require authentication using an API key in the header:

```
Authorization: Bearer YOUR_API_KEY
```

Get your API key from the CloudStore Dashboard under Settings > API Keys.

## Endpoints

### Upload File

Upload a file to your CloudStore account.

**Endpoint:** `POST /files/upload`

**Request:**
```json
{
  "file": "base64_encoded_file_content",
  "filename": "document.pdf",
  "folder": "/projects/client-a"
}
```

**Response:**
```json
{
  "success": true,
  "file_id": "f_abc123xyz",
  "url": "https://cdn.cloudstore.com/f_abc123xyz",
  "size": 2048576,
  "created_at": "2026-01-24T10:30:00Z"
}
```

### List Files

Retrieve a list of files in your account.

**Endpoint:** `GET /files`

**Query Parameters:**
- `folder` (optional): Filter by folder path
- `limit` (optional): Number of results (default: 50, max: 200)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "total": 150,
  "files": [
    {
      "file_id": "f_abc123xyz",
      "filename": "document.pdf",
      "size": 2048576,
      "folder": "/projects/client-a",
      "created_at": "2026-01-24T10:30:00Z",
      "modified_at": "2026-01-24T10:30:00Z"
    }
  ]
}
```

### Download File

Download a file by ID.

**Endpoint:** `GET /files/{file_id}/download`

**Response:** Binary file content

### Delete File

Delete a file from your account.

**Endpoint:** `DELETE /files/{file_id}`

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Share File

Generate a public sharing link for a file.

**Endpoint:** `POST /files/{file_id}/share`

**Request:**
```json
{
  "expires_in": 86400,
  "password": "optional_password",
  "download_limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "share_url": "https://cloudstore.com/s/abc123",
  "expires_at": "2026-01-25T10:30:00Z"
}
```

## Rate Limits

- Free tier: 100 requests per hour
- Pro tier: 1,000 requests per hour
- Enterprise: Custom limits

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1706097000
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "The 'filename' parameter is required"
  }
}
```

## SDKs and Libraries

Official SDKs available for:
- Python: `pip install cloudstore-sdk`
- JavaScript: `npm install cloudstore-sdk`
- Ruby: `gem install cloudstore-sdk`
- PHP: `composer require cloudstore/sdk`

## Example Usage (Python)

```python
from cloudstore import CloudStore

# Initialize client
client = CloudStore(api_key='your_api_key')

# Upload file
with open('document.pdf', 'rb') as f:
    result = client.upload(f, folder='/projects')
    print(f"File uploaded: {result['url']}")

# List files
files = client.list_files(folder='/projects', limit=10)
for file in files:
    print(f"{file['filename']} - {file['size']} bytes")

# Share file
share = client.share(file_id='f_abc123xyz', expires_in=86400)
print(f"Share URL: {share['share_url']}")
```

## Support

- Documentation: https://docs.cloudstore.com
- Support: support@cloudstore.com
- Status page: https://status.cloudstore.com
- Community forum: https://community.cloudstore.com
