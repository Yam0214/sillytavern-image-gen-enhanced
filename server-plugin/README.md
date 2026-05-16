# Quick Image Gen Relay Server Plugin

This optional SillyTavern server plugin lets Quick Image Gen use CivitAI and Replicate when SillyTavern is running with `basicAuthMode: true`.

## Install

1. Copy this `server-plugin` directory to your SillyTavern `plugins/quick-image-gen-relay/` directory.
2. Set `enableServerPlugins: true` in SillyTavern `config.yaml`.
3. Restart SillyTavern.
4. While logged in, open `/api/plugins/quick-image-gen-relay/healthz`. A blank page with HTTP 204 means the plugin is loaded.

## Security

SillyTavern server plugins are not sandboxed. Only install plugins from developers you trust.

This plugin is intentionally narrow:

- It only relays the CivitAI consumer jobs endpoint and the Replicate predictions endpoints used by Quick Image Gen.
- It does not accept arbitrary target URLs, so it is not a general-purpose open proxy.
- It does not store or log provider API keys. Keys are only used to build the upstream `Authorization` header for the current request.
