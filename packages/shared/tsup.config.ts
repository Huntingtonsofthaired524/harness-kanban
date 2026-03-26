import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    // Main entry points
    index: 'src/index.ts',
    constants: 'src/constants/index.ts',
    lib: 'src/lib/index.ts',
    // Property-specific entry points
    'property/constants': 'src/property/constants.ts',
    'property/types': 'src/property/types.ts',
    'property/status-config': 'src/property/status-config.ts',
    // Issue-specific entry points
    'issue/types': 'src/issue/types.ts',
    'issue/constants': 'src/issue/constants.ts',
    // Project-specific entry points
    'project/types': 'src/project/types.ts',
    // Notification-specific entry points
    'notification/constants': 'src/notification/constants.ts',
    'notification/types': 'src/notification/types.ts',
    // Utils-specific entry points
    'lib/utils/number': 'src/lib/utils/number.ts',
    'lib/utils/datetime': 'src/lib/utils/datetime.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  sourcemap: true,
  splitting: false,
  external: [
    // external dependencies that should not be bundled
    'zod',
  ],
  target: 'es2022',
  platform: 'neutral',
})
