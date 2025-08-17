export const corsConfig = {
  // Production domains
  productionDomains: [
    'https://karin-and-noam-wedding-gallery.vercel.app',
  ],
  
  // Vercel preview domains patterns
  vercelPreviewPatterns: [
    /^https:\/\/.*-git-.*-.*-.*\.vercel\.app$/,
    /^https:\/\/.*-.*-.*-.*\.vercel\.app$/,
    /^https:\/\/.*-.*-.*\.vercel\.app$/,
  ],
  
  // Local development
  localDomains: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://10.0.0.43:3000',
    'http://10.0.0.43:3001',
  ],
  
  // Methods allowed
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Headers allowed
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  
  // Credentials
  allowCredentials: true,
};

export const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  
  const allAllowedOrigins = [
    ...corsConfig.productionDomains,
    ...corsConfig.vercelPreviewPatterns,
    ...corsConfig.localDomains,
  ];
  
  return allAllowedOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === origin;
    }
    if (typeof allowedOrigin === 'object' && allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }
    return false;
  });
};
