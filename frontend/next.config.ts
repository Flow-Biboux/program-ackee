import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      buffer: false,
      'pino-pretty': false,
      pino: false,
    };
    
    // Also try this for Anchor-specific issues
    config.externals = config.externals || [];
    config.externals.push('fs', 'path', 'os', 'pino-pretty', 'pino');
    
    // Ignore specific modules that cause issues in browser
    config.plugins.push(
      new config.webpack.IgnorePlugin({
        resourceRegExp: /^(pino-pretty|pino)$/,
      })
    );
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

export default nextConfig
