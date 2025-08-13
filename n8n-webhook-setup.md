# n8n Webhook Setup for NeedleSpotter LongformGen

## Overview

This document explains how to configure n8n to send research completion data to the WordPress plugin using the new dedicated webhook endpoint.

## Webhook Endpoint

The dedicated webhook endpoint for n8n to send completion data is:

```
https://your-domain.com/wp-admin/admin-ajax.php?action=n8n-research-complete
```

## Expected Data Format

n8n should send the research results in one of these formats:

### Format 1: JSON Array (Recommended)
```json
[
  {
    "deepresearch_original": "## Executive Summary\n\nRecent oncology research...",
    "deepresearch_reasons_for_change": "[\"Overly dense and jargon-heavy text...\"]",
    "deepresearch_improved_text": "## Executive Summary\n\nRecent oncology research...",
    "run_id": "57bfc26e-5898-4557-9183-a35b3502af0c"
  }
]
```

### Format 2: Single Object
```json
{
  "deepresearch_original": "## Executive Summary\n\nRecent oncology research...",
  "deepresearch_reasons_for_change": "[\"Overly dense and jargon-heavy text...\"]",
  "deepresearch_improved_text": "## Executive Summary\n\nRecent oncology research...",
  "run_id": "57bfc26e-5898-4557-9183-a35b3502af0c"
}
```

### Format 3: Form Data
```
deepresearch_original: ## Executive Summary\n\nRecent oncology research...
deepresearch_reasons_for_change: ["Overly dense and jargon-heavy text..."]
deepresearch_improved_text: ## Executive Summary\n\nRecent oncology research...
run_id: 57bfc26e-5898-4557-9183-a35b3502af0c
```

## n8n Configuration

### 1. HTTP Request Node

Add an HTTP Request node at the end of your n8n workflow:

- **Method**: POST
- **URL**: `https://your-domain.com/wp-admin/admin-ajax.php?action=n8n-research-complete`
- **Content Type**: `application/json`

### 2. Request Body

Set the request body to include:
- `run_id`: The unique identifier for the research run
- `deepresearch_original`: The original research content
- `deepresearch_reasons_for_change`: JSON array of reasons for changes
- `deepresearch_improved_text`: The improved/refined research content

### 3. Error Handling

The webhook will return:
- **200 OK**: Successfully processed
- **400 Bad Request**: Missing run_id
- **500 Internal Server Error**: Database update failed

## Real-Time Updates

The frontend now uses Server-Sent Events (SSE) for real-time status updates instead of polling. This provides:

- ✅ **Instant updates** when research completes
- ✅ **Reduced server load** (no constant polling)
- ✅ **Better user experience** with real-time feedback
- ✅ **Automatic reconnection** if connection is lost

## Testing the Webhook

You can test the webhook endpoint using curl:

```bash
curl -X POST "https://your-domain.com/wp-admin/admin-ajax.php?action=n8n-research-complete" \
  -H "Content-Type: application/json" \
  -d '{
    "run_id": "test-run-id",
    "deepresearch_original": "Test original content",
    "deepresearch_reasons_for_change": ["Test reason"],
    "deepresearch_improved_text": "Test improved content"
  }'
```

## Benefits of This Approach

1. **No Timeouts**: The frontend doesn't wait for the long-running process
2. **Real-Time Updates**: Users see progress immediately via SSE
3. **Reliable**: Webhook ensures data is delivered when ready
4. **Scalable**: Can handle multiple concurrent research processes
5. **Efficient**: No constant polling reduces server load

## Troubleshooting

### Common Issues

1. **Webhook not receiving data**: Check the URL and ensure n8n is sending POST requests
2. **Data not displaying**: Verify the JSON format matches the expected structure
3. **SSE connection issues**: Check browser console for connection errors
4. **Database errors**: Check WordPress error logs for database update failures

### Debug Logs

The plugin logs detailed information to the WordPress error log. Check for entries starting with `NSLFG DEBUG:` or `NSLFG ERROR:`.
