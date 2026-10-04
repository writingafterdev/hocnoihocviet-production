import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
};

export default nextConfig;

// Lets `next dev` read Cloudflare bindings (D1, R2…) from wrangler.jsonc.
initOpenNextCloudflareForDev();
