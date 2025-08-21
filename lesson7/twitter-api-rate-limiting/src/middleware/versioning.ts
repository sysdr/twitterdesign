import { Request, Response, NextFunction } from 'express';

export interface VersionedRequest extends Request {
  apiVersion: string;
  supportsFeature: (feature: string) => boolean;
}

const featureMatrix = {
  'v1': ['basic_tweets', 'basic_users'],
  'v2': ['basic_tweets', 'basic_users', 'reactions', 'threads', 'polls'],
  'v3': ['basic_tweets', 'basic_users', 'reactions', 'threads', 'polls', 'spaces', 'communities']
};

export const versionMiddleware = (req: VersionedRequest, res: Response, next: NextFunction) => {
  // Extract version from URL path
  // Since middleware runs at /api level, path will be /v1/tweets or /v2/tweets
  const pathVersion = req.path.match(/^\/v(\d+)/)?.[1];
  
  // Extract version from Accept header
  const acceptHeader = req.headers.accept || '';
  const headerVersion = acceptHeader.match(/application\/vnd\.twitter\.v(\d+)/)?.[1];
  
  // Default to v1 if no version specified
  const version = pathVersion || headerVersion || '1';
  const versionKey = `v${version}`;
  
  req.apiVersion = versionKey;
  req.supportsFeature = (feature: string) => {
    const features = featureMatrix[versionKey as keyof typeof featureMatrix] || featureMatrix.v1;
    return features.includes(feature);
  };
  
  // Add version headers to response
  res.set({
    'X-API-Version': versionKey,
    'X-Supported-Versions': Object.keys(featureMatrix).join(', ')
  });
  
  next();
};

export const deprecationWarning = (version: string, deprecatedIn: string, removedIn: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path.includes(`/v${version}/`)) {
      res.set({
        'X-API-Deprecated': 'true',
        'X-API-Deprecated-Version': version,
        'X-API-Sunset-Date': new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        'Warning': `299 - "API version ${version} is deprecated. Please migrate to ${removedIn}"`
      });
    }
    next();
  };
};
