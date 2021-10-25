import type { AWS } from '@serverless/typescript';

import ivsViewerCount from '@functions/ivs-viewer-count';

const serverlessConfiguration: AWS = {
  service: 'jawspankration2021-ivs-viewers-count',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
  },
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
    lambdaHashingVersion: '20201221',
    region: 'us-east-1',
    stage: 'beta',
    profile: 'default'
  },
  // import the function via paths
  functions: {
    ivsViewerCount: {
      handler: ivsViewerCount.handler,
      events: [{
        schedule: {
          rate: ['rate(1 minute)']
        }
      }]
    }
  },
};

module.exports = serverlessConfiguration;