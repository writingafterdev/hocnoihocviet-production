import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  // Don't let `next dev` write an AGENTS.md into the repo.
  agentRules: false,
  // Dev server only: keep Next's round badge out of the bottom-left, where the sidebar toggle lives.
  devIndicators: { position: 'bottom-right' },
  // Dev server only: extra hostnames allowed to load dev assets (e.g. a preview proxy), comma-separated in DEV_ORIGINS.
  allowedDevOrigins: (process.env.DEV_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
};

export default nextConfig;

// Lets `next dev` read Cloudflare bindings (D1, R2…) from wrangler.jsonc.
initOpenNextCloudflareForDev();
