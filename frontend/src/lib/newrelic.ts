/**
 * New Relic Browser Agent initialization
 * 
 * This file initializes New Relic browser monitoring for frontend performance tracking.
 * Make sure to set the following environment variables:
 * - VITE_NEW_RELIC_LICENSE_KEY
 * - VITE_NEW_RELIC_APP_ID
 * - VITE_NEW_RELIC_ACCOUNT_ID
 */

import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'

// Only initialize if all required environment variables are present
const licenseKey = import.meta.env.VITE_NEW_RELIC_LICENSE_KEY
const appId = import.meta.env.VITE_NEW_RELIC_APP_ID
const accountId = import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID

if (licenseKey && appId && accountId) {
  const opts = {
    init: {
      distributed_tracing: {
        enabled: true
      },
      privacy: {
        cookies_enabled: true
      }
    },
    info: {
      beacon: 'bam.nr-data.net',
      errorBeacon: 'bam.nr-data.net',
      licenseKey: licenseKey,
      applicationID: appId,
      sa: 1
    },
    loader_config: {
      accountID: accountId
    }
  }

  const agent = new BrowserAgent(opts)
  agent.observe()
}

export default {}

