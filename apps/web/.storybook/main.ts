import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'

import type { StorybookConfig } from '@storybook/nextjs'
import type { Configuration } from 'webpack'

const forceDevelopmentNodeEnv = (config: Configuration) => {
  const plugins = config.plugins || []
  let updatedExistingDefine = false

  for (const plugin of plugins) {
    if (!plugin || plugin.constructor?.name !== 'DefinePlugin') {
      continue
    }

    const definitions = (plugin as { definitions?: Record<string, unknown> }).definitions

    if (!definitions) {
      continue
    }

    if ('process.env.NODE_ENV' in definitions) {
      definitions['process.env.NODE_ENV'] = JSON.stringify('development')
      updatedExistingDefine = true
    }

    const processEnvDefinition = definitions['process.env']
    if (processEnvDefinition && typeof processEnvDefinition === 'object' && !Array.isArray(processEnvDefinition)) {
      ;(processEnvDefinition as Record<string, unknown>).NODE_ENV = JSON.stringify('development')
      updatedExistingDefine = true
    }
  }

  if (!updatedExistingDefine) {
    plugins.push({
      constructor: { name: 'DefinePlugin' },
      definitions: {
        'process.env.NODE_ENV': JSON.stringify('development'),
      },
      apply: () => {},
    } as unknown as Configuration['plugins'][number])
  }

  config.plugins = plugins
}

const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  stories: ['../.storybook/stories/**/*.stories.@(ts|tsx|mdx)', '../src/**/*.stories.@(ts|tsx|mdx)'],
  staticDirs: ['../public'],
  webpackFinal: async config => {
    if (config.resolve) {
      const tsconfigPathsPlugin = new TsconfigPathsPlugin({
        extensions: config.resolve.extensions,
      })

      config.resolve.plugins = [
        ...(config.resolve.plugins || []),
        tsconfigPathsPlugin as Configuration['resolve']['plugins'][number],
      ]
    }
    // Optimize for hot reload
    config.watchOptions = {
      ignored: /node_modules/,
      poll: 1000,
      aggregateTimeout: 300,
    }

    // Enable hot module replacement
    if (config.mode === 'development') {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      }

      forceDevelopmentNodeEnv(config)
    }
    return config
  },
  addons: ['@storybook/addon-themes'],
}

export default config
