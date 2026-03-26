// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://9c55dd5e07d285708943c377afacfcda@o4508397697630208.ingest.us.sentry.io/4509569496055808',

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})
