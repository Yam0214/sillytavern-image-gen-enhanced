# Quick Image Gen - SillyTavern Extension

## TL;DR
One-click image generation for SillyTavern with 14 providers, 40+ styles, LLM prompt generation, connection profiles, generation presets, contextual filters, auto-insert, gallery, prompt history, PNG metadata, and settings export/import.

Prompt Replacement Maps and Prompt Templates have been removed. Old prompt replacement data is migrated into Contextual Filters on load when possible.

**Install:** Extensions -> Install from URL -> `https://github.com/platberlitz/sillytavern-image-gen`

## What's New in v2.0.6
- Added Reverse Proxy `New-API Chat Image mode` for OpenAI-compatible proxies that generate images through `chat/completions`.
- Chat Image mode locks routing to `chat/completions` by default, uses a 16k max-token budget, supports a custom system prompt, can optionally append active character/persona context, and avoids editing the source chat message when auto-inserting results.
- Added a route-permission toggle for proxies that should still use `/images/generations` routing.

## Recent v2.0.5 Fixes
- Added GPT Image as its own provider, defaulting to `gpt-image-2`.
- GPT Image supports optional reverse proxy URL/key overrides like NovelAI, plus quality, output format, background, and moderation controls.

## Recent v2.0.4 Fixes
- Reverse Proxy requests now have a configurable `Request Timeout` setting, defaulting to 600 seconds for slower image services like LinkAPI.

## Recent v2.0.3 Fixes
- Added `Plain Description` generation: type a natural-language image idea and QIG will ask your AI to turn it into an image prompt before generating.
- Added ComfyUI workflow variable documentation in [`docs/comfyui-workflow-variables.md`](docs/comfyui-workflow-variables.md).
- Custom ComfyUI workflow placeholders now preserve numeric types when a node input is exactly a placeholder such as `%seed%`, `%width%`, or `%cfg%`.
- Runtime ComfyUI JSON errors are no longer mislabeled as invalid custom workflow JSON.

## Recent v2.0.2 Fixes
- Restored the palette button Direct / Inject mode option.
- Inject palette ignores stale tags from older messages when a newer user message exists.
- If there is no current image tag, Inject asks the LLM for one from the selected scene instead of targeting old chat content.
- Contextual filters now match the selected scene again, so global/card filters fire properly.
- Saved card/character filters can be edited, deleted, toggled, and reordered from the manager without switching to that card/character.
- Loading generation presets no longer overwrites or moves contextual filters.

## Features

### Providers
- Pollinations
- NovelAI
- GPT Image (OpenAI)
- ArliAI
- NanoGPT
- Chutes
- CivitAI
- Nanobanana/Gemini
- Stability AI
- Replicate
- Fal.ai
- Together AI
- Local (A1111 / ComfyUI)
- Reverse Proxy

### Generation
- 40+ style presets
- Manual prompt generation
- Plain-description-to-prompt generation
- Message-based scene selection
- LLM prompt generation with optional prompt editing
- Prompt wildcards
- Batch generation with sequential seeds
- ST Style panel integration
- Contextual Filters with keyword or LLM concept matching
- Optional per-filter seed overrides
- Automatic inject mode using AI-written image tags

### Workflow
- Connection Profiles
- Generation Presets
- Comfy Workflow Presets
- Character settings
- Per-character reference images
- Export / import settings

### Output
- Gallery
- Prompt History
- Auto-insert into chat
- Inline data URL or `image_url` insertion
- Save to ST server
- PNG metadata embedding and metadata round-trip

## Quick Start

1. Open the QIG panel in SillyTavern.
2. Pick a provider.
3. Enter a prompt or enable `Use chat message`.
4. Click `Generate`.
5. Optionally save the setup as a preset or profile.

## Settings Overview

### Prompt & Presets
- `Prompt`: Base prompt with `{{char}}` and `{{user}}` placeholders.
- `Plain Description`: Type a quick natural-language idea and generate from an AI-converted image prompt without changing the saved prompt field.
- `Negative Prompt`: What to avoid.
- `Quality Tags`: Optional tags prepended to prompts.
- `Use chat message`: Use selected chat messages as scene context.
- `Use LLM to create image prompt`: Have the chat model rewrite the scene into an image prompt.
- `Save Preset`: Save the full generation setup.
- `Export` / `Import`: Move settings between installs.

### Contextual Filters
Contextual Filters are now the only native prompt-transformation system.

They support:
- Keyword matching with `OR` / `AND`
- LLM concept matching
- Positive and negative prompt additions
- Removal of conflicting tokens before append
- Global, card-only, and character scope
- Filter pools for bulk enable/disable
- Seed overrides

Legacy Prompt Replacement Maps are migrated into Contextual Filters as best-effort removal-plus-append rules.

### Auto Generation
- `Auto-generate after AI response`: Generate after assistant replies.
- `Confirm before generating`: Ask before manual generation.
- `Auto-insert`: Insert generated images directly into chat.

### Reverse Proxy New-API Chat Image Mode

Use Reverse Proxy `New-API Chat Image mode` when your OpenAI-compatible endpoint exposes image generation through `chat/completions` instead of the normal `/images/generations` route.

Recommended setup:

1. Pick `Reverse Proxy` as the provider.
2. Enter your proxy base URL, for example `https://proxy.example/v1`, and optional API key.
3. Enter the chat-image model name required by your proxy.
4. Enable `New-API Chat Image mode`.
5. Click `Apply Chat Image Defaults` for the simple workflow:
   - route through `chat/completions`
   - use OpenAI Strict payload mode
   - allow inline or URL reference images
   - disable SSE
   - use the latest chat message as the image instruction
   - auto-insert generated images as a new assistant chat message

Chat Image settings:

- `Personality / System Prompt`: The system prompt sent before the user image instruction. The default tells the model to behave as a visual image generation assistant and return an image in the provider-supported format.
- `Append active chat character and persona context`: Optional. Leave this off for cleaner, more predictable provider calls. Turn it on when the image model should preserve the current character card, persona, scenario, outfit, or identity details.
- `Max Tokens`: Defaults to `16384` (16k) because chat-image providers may return verbose image payloads or data URLs. The field accepts values from `1` to `65536`.
- `Permit /images/generations routing`: Off by default. When off, QIG forces `chat/completions` even if the URL or endpoint selector would otherwise route to `/images/generations`. Turn it on only for proxy stacks where Auto routing should still be allowed to choose `/images/generations`.

When Chat Image mode is enabled and `Auto-insert` is on, generated images are inserted as a new assistant message unless `Insert as hidden reply` is enabled. This keeps the original user/source message unchanged.

### Inject
Inject is now auto-only.

When both `Use AI-written image tags for auto-generation` and `Auto-generate after AI response` are enabled, QIG:

1. Injects instructions into chat completion.
2. Reads paired image tags from AI replies.
3. Generates images from those extracted prompts.
4. Optionally removes the tags from stored/displayed messages.

Supported tag formats:
- Custom paired tag, default `<image>...</image>`
- Legacy `<pic prompt="...">`

Available inject settings:
- Tag name
- Inject prompt template
- Extraction regex
- Injection position
- Tag handling
- Auto-clean
- Test Inject Detection

The palette button always runs a normal generation now. There is no manual inject palette mode.

## Presets And Profiles

### Connection Profiles
Profiles store provider-specific connection settings such as API keys, model IDs, URLs, and related provider options.

### Generation Presets
Presets store the broader generation setup, including prompt fields, size, provider settings, contextual filters, and inject configuration.

## Migration Notes

- Old Prompt Replacement Maps are migrated into Contextual Filters on load, preset import, and settings import when possible.
- Old Prompt Templates are not converted. Their storage is ignored and cleaned up.
- Exported settings no longer include templates or prompt replacement maps.

## Gallery And History

- `Gallery` keeps generated images available across sessions.
- `Prompts` keeps recent prompt history for reuse and inspection.
- `Logs` shows generation and provider diagnostics.

## ComfyUI Notes

For ComfyUI:
- Start ComfyUI with CORS enabled.
- Use API-format workflow JSON for custom workflows.
- Use `%reference_image%` in custom workflows when needed.
- See [`docs/comfyui-workflow-variables.md`](docs/comfyui-workflow-variables.md) for the full placeholder list and typed-value behavior.

## Credits

- Veda - ComfyUI Proxy method

## License

MIT
