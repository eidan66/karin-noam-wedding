# S3 CORS Configuration

## Required CORS Policy

Apply the following CORS configuration to your S3 bucket to enable cross-origin uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type", "Accept-Ranges"]
  }
]
```

## Implementation Options

### Option 1: AWS Console
1. Go to S3 Console
2. Select your bucket
3. Go to "Permissions" tab
4. Scroll down to "Cross-origin resource sharing (CORS)"
5. Click "Edit" and paste the above configuration

### Option 2: AWS CLI
```bash
aws s3api put-bucket-cors --bucket YOUR_BUCKET_NAME --cors-configuration file://cors.json
```

### Option 3: Infrastructure as Code (Terraform)
```hcl
resource "aws_s3_bucket_cors_configuration" "wedding_album" {
  bucket = aws_s3_bucket.wedding_album.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "Content-Length", "Content-Type"]
  }
}
```

### Option 4: Infrastructure as Code (AWS CDK)
```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

const bucket = new s3.Bucket(this, 'WeddingAlbumBucket', {
  cors: [{
    allowedHeaders: ['*'],
    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.HEAD],
    allowedOrigins: ['*'],
    exposedHeaders: ['ETag', 'Content-Length', 'Content-Type'],
  }],
});
```

## Important Notes

- **AllowedOrigins**: Set to `["*"]` for development. In production, consider restricting to your domain(s)
- **AllowedMethods**: Includes all necessary methods for upload, download, and metadata operations
- **ExposeHeaders**: Ensures clients can access important response headers
- **Content-Type**: Must be properly set on uploads to ensure correct media processing
