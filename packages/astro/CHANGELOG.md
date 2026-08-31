# [1.11.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.10.0...@imjp/writenex-astro@1.11.0) (2026-08-31)


### Features

* add Remote CMS documentation and enhance README with optional features ([706677b](https://github.com/jaainil/writenex/commit/706677b0dcdb9c4b7f2ef976e06722f2bb8bd06b))

# [1.10.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.9.1...@imjp/writenex-astro@1.10.0) (2026-08-31)


### Features

* implement authentication and session management for remote CMS ([c844a18](https://github.com/jaainil/writenex/commit/c844a18e1cd6377ca4baaa2eddd3834f9a3fcd6f))

## [1.9.1](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.9.0...@imjp/writenex-astro@1.9.1) (2026-07-06)


### Bug Fixes

* update dependencies across monorepo ([e42624c](https://github.com/jaainil/writenex/commit/e42624c51d51fa46fcc78991aa105d80f73eadd8))


### Features

* add Astro v7 support with Vite 8 compatibility ([e42624c](https://github.com/jaainil/writenex/commit/e42624c51d51fa46fcc78991aa105d80f73eadd8))
* update peer dependencies to support Astro 4.x, 5.x, 6.x, and 7.x
* upgrade dev dependencies to use Astro v7.3.2 and Vite 8

### Breaking Changes

* Astro v7 requires Vite 8 and Node.js 22.12.0+
* The Rust compiler is now stricter about invalid HTML syntax (unclosed tags now produce errors)
* Default `compressHTML` changed from `true` to `'jsx'` for JSX-style whitespace handling

# [1.9.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.8.0...@imjp/writenex-astro@1.9.0) (2026-04-21)


### Features

* extend frontmatter form with new field types and styling ([5f6ede3](https://github.com/jaainil/writenex/commit/5f6ede30e207017907974e68a2e703c952b9b86d))

# [1.8.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.7.1...@imjp/writenex-astro@1.8.0) (2026-04-21)


### Features

* add auto-resolution of fields.*() in defineConfig ([aad8c36](https://github.com/jaainil/writenex/commit/aad8c36d9fd757ae3131e046f9dcd569f0a96d0a))

## [1.7.1](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.7.0...@imjp/writenex-astro@1.7.1) (2026-04-21)


### Bug Fixes

* trigger build and release ([42e77dd](https://github.com/jaainil/writenex/commit/42e77dd7892d9484d40aa6f5d8676ef42ce5ba24))

# [1.7.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.6.4...@imjp/writenex-astro@1.7.0) (2026-04-17)


### Features

* add support for TypeScript config files using jiti ([eda2c84](https://github.com/jaainil/writenex/commit/eda2c84d3efb2fcf7bec125f546e59b41e0faab0))

## [1.6.4](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.6.3...@imjp/writenex-astro@1.6.4) (2026-04-08)


### Bug Fixes

* add outputDirectory to vercel.json configuration ([380eba6](https://github.com/jaainil/writenex/commit/380eba6c9bb385e7bd0219e5f0a9557a68ad930d))

## [1.6.3](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.6.2...@imjp/writenex-astro@1.6.3) (2026-04-08)


### Bug Fixes

* remove vercel.json configuration file ([19e6cf6](https://github.com/jaainil/writenex/commit/19e6cf66116e76b7a98657124e9b8c6f21193cd5))

## [1.6.2](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.6.1...@imjp/writenex-astro@1.6.2) (2026-04-08)


### Bug Fixes

* remove outputDirectory from vercel.json configuration ([04d9ffc](https://github.com/jaainil/writenex/commit/04d9ffc60c4e1671cf46d42007c7325b008d29e0))

## [1.6.1](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.6.0...@imjp/writenex-astro@1.6.1) (2026-04-08)


### Bug Fixes

* update rootDirectory in vercel.json for correct deployment path ([49fd59a](https://github.com/jaainil/writenex/commit/49fd59a453196f75b3870212a1607b7b200141e0))

# [1.6.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.5.0...@imjp/writenex-astro@1.6.0) (2026-04-08)


### Features

* add Fields API documentation for content schema definition in Astro projects ([d72e897](https://github.com/jaainil/writenex/commit/d72e8970260868268e2b94dcd0d157f76f0eb438))

# [1.5.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.4.0...@imjp/writenex-astro@1.5.0) (2026-04-02)


### Features

* **fields:** add defaultValue support for field types and new field kinds ([c81c6c7](https://github.com/jaainil/writenex/commit/c81c6c782925942ca7a3acacebfa390e2290ac9c))

# [1.4.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.3.6...@imjp/writenex-astro@1.4.0) (2026-04-02)


### Features

* add Keystatic-style Fields API with 25+ field types ([6e07181](https://github.com/jaainil/writenex/commit/6e0718153a736813b91b1ca8613fe693e955fffc))

## [1.3.6](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.3.5...@imjp/writenex-astro@1.3.6) (2026-04-01)


### Bug Fixes

* add npm plugin to semantic-release and update workflow ([f15f749](https://github.com/jaainil/writenex/commit/f15f749cb6281742e7a8ae696c47f8a6aa15fe46))

## [1.3.5](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.3.4...@imjp/writenex-astro@1.3.5) (2026-04-01)


### Bug Fixes

* build after semantic-release to publish correct version ([b62923a](https://github.com/jaainil/writenex/commit/b62923a3d5f2869be0ebd29387e59e00739fbce6))

## [1.3.4](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.3.3...@imjp/writenex-astro@1.3.4) (2026-04-01)


### Bug Fixes

* normalize Windows paths in config loader, filesystem reader, and integration ([d946b39](https://github.com/jaainil/writenex/commit/d946b399b8c8b42ec187ba31ba20aa7d71e0bc04))

## [1.3.3](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.3.2...@imjp/writenex-astro@1.3.3) (2026-04-01)


### Bug Fixes

* restore registry-url in setup-node to enable OIDC auth detection ([98a0d24](https://github.com/jaainil/writenex/commit/98a0d248194e4766f02e1323cc24c5b94ad9fc29))

## [1.3.2](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.3.1...@imjp/writenex-astro@1.3.2) (2026-04-01)


### Bug Fixes

* type (triggers a patch release in semantic-release). ([36fabe1](https://github.com/jaainil/writenex/commit/36fabe15c3860f1e256bd195d2fb5017ce64a5cf))

## [1.3.1](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.3.0...@imjp/writenex-astro@1.3.1) (2026-04-01)


### Bug Fixes

* update release workflow for npm OIDC trusted publishing ([c6deaea](https://github.com/jaainil/writenex/commit/c6deaeade87d3b8314a7467f1763272e891eace3))

# [1.3.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.2.3...@imjp/writenex-astro@1.3.0) (2026-04-01)


### Bug Fixes

* separate semantic-release from npm publishing for OIDC support ([aa6a328](https://github.com/jaainil/writenex/commit/aa6a328b127d006bc61493006a6e4b6b4ddd0460))
* use direct npm publish with OIDC ([debebfa](https://github.com/jaainil/writenex/commit/debebfabde5c8896fe28bd0f77b6c07f36c56227))


### Features

* add Astro v6 compatibility and Node.js 22.12.0+ support ([8aa2bbc](https://github.com/jaainil/writenex/commit/8aa2bbc43ab36394bf373ed465edcb5d5cef066b))
* add GitHub Actions workflow for automated releases ([1e5673c](https://github.com/jaainil/writenex/commit/1e5673c7d88814c1cf29d0915181e8b36f5d515c))

# [1.3.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.2.3...@imjp/writenex-astro@1.3.0) (2026-04-01)


### Features

* add Astro v6 support with Node.js 22.12.0+ requirement
* update peer dependencies to support Astro 4.x, 5.x, and 6.x
* add .nvmrc file specifying Node 22.12.0 as minimum version
* upgrade dev dependencies to use Astro v6 and Vite 7

### Breaking Changes

* Node.js 18 and 20 are no longer supported (now requires Node 22.12.0+)
* This aligns with Astro v6's Node.js support requirements

## [1.2.3](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.2.2...@imjp/writenex-astro@1.2.3) (2026-03-10)


### Bug Fixes

* remove NPM_TOKEN to use OIDC only ([ee5d5aa](https://github.com/jaainil/writenex/commit/ee5d5aad119cc6ea506f1f0253eb58d027f8d2a0))

## [1.2.2](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.2.1...@imjp/writenex-astro@1.2.2) (2026-03-10)


### Bug Fixes

* update package description ([dfae2ce](https://github.com/jaainil/writenex/commit/dfae2cec482d00ed85e8ab2c0346450482520792))

## [1.2.1](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.2.0...@imjp/writenex-astro@1.2.1) (2026-03-10)


### Bug Fixes

* remove conflicting .npmrc config from release workflow ([337e2ef](https://github.com/jaainil/writenex/commit/337e2efafd17d6b3eeb6d35ec5a3225c7cb6adbd))

# [1.2.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.1.3...@imjp/writenex-astro@1.2.0) (2026-03-10)


### Features

* add GitHub Action skill documentation and update skills-lock.json ([0275ef1](https://github.com/jaainil/writenex/commit/0275ef10d9b511d06065bdb11d3e1ac1ee417c4c))

## [1.1.3](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.1.2...@imjp/writenex-astro@1.1.3) (2026-03-10)


### Bug Fixes

* add npm whoami verification step to debug auth ([7785168](https://github.com/jaainil/writenex/commit/77851688894f669e56c888a20058f97f744675fe))

## [1.1.2](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.1.1...@imjp/writenex-astro@1.1.2) (2026-03-10)


### Bug Fixes

* configure npm auth in workflow for semantic-release ([6820ca1](https://github.com/jaainil/writenex/commit/6820ca15b865039b431fb0034e66af2322025ef9))

## [1.1.1](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.1.0...@imjp/writenex-astro@1.1.1) (2026-03-10)


### Bug Fixes

* trigger npm publish ([454b428](https://github.com/jaainil/writenex/commit/454b428f21693ddabb97e854df028858455899e4))

# [1.1.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.0.0...@imjp/writenex-astro@1.1.0) (2026-03-10)


### Features

* add image, link, and keyboard shortcuts dialogs for the editor, along with a generic dialog component. ([ebd1caa](https://github.com/jaainil/writenex/commit/ebd1caa9909f720f580ee5e167b387ed600ff32d))
* Add Zod-based configuration schema with validation and a version history diff viewer component. ([a38449b](https://github.com/jaainil/writenex/commit/a38449b6f4296b01bb5ebbb3994e4cf964eb9524))
* Implement the initial Writenex application with its core Astro component library, editor, and filesystem management. ([0e674cc](https://github.com/jaainil/writenex/commit/0e674cc65e1bab23cffddc3898dc5bf30eaa838c))
* Introduce new `@writenex/eslint-config` package with Prettier integration. ([c955ab6](https://github.com/jaainil/writenex/commit/c955ab61221d8c24c26ef2ea0897f44a39b44450))
* Introduce new agent skills for Biome.js, ESLint/Prettier migration, and various development-related tasks, updating the skills lock file. ([cc06929](https://github.com/jaainil/writenex/commit/cc069292bf2f16c7ac7713c0761d0518f051c819))
* Introduce new agent skills for Next.js best practices, covering various topics and updating package configurations. ([d90c9aa](https://github.com/jaainil/writenex/commit/d90c9aacb5463a5d9cb36003cf51238900238452))

# 1.0.0 (2026-01-18)


### Bug Fixes

* remove duplicate pnpm version specification ([7d76b70](https://github.com/jaainil/writenex/commit/7d76b70a7b22e4370478acc39edd4e6bdaafe27f))
* update package name to @imjp/writenex-astro ([64e5fe1](https://github.com/jaainil/writenex/commit/64e5fe1b3485a5299849615d1cd8adacc77a4803))


### Features

* add @writenex/astro - CMS integration for Astro content collections ([4223c4b](https://github.com/jaainil/writenex/commit/4223c4bec0049d122785c02505181ba7d9b9bff2))
* Add new Vercel React best practice rules and skill definitions. ([5ac16f0](https://github.com/jaainil/writenex/commit/5ac16f08265e1131e2bdc24269656c3257c15d3e))
* Add numerous code block languages and implement dropdown scrolling to prevent overflow. ([5e83a81](https://github.com/jaainil/writenex/commit/5e83a81294aae72e485c314e8e28980aea48d5e6))
* **astro:** v0.2.0 - Major UI/UX improvements and new features ([29a7188](https://github.com/jaainil/writenex/commit/29a718869efe7102188a25cb4ce3b24203b76585))
* **astro:** v0.2.2 - Enhanced editor with accessibility and version history ([427a1b8](https://github.com/jaainil/writenex/commit/427a1b82d94f8eb9a2ebe78690fe2c8b48385583))
* **astro:** v0.2.4 - UI refinements and collection selection modal ([74b4766](https://github.com/jaainil/writenex/commit/74b47666bd94413a964e4bff8d51375682795569))
* **astro:** v0.2.5 - Image strategies, file patterns, and brand color system ([8787c8c](https://github.com/jaainil/writenex/commit/8787c8c01d142642c688c01439c3dc2417880014))
* **astro:** v0.3.0 - Monorepo restructuring and package consolidation ([274d651](https://github.com/jaainil/writenex/commit/274d65140f04adcd0cd337c3688e0b237ef00c47))
* **astro:** v0.3.1 - Remove customizable basePath option ([0a52e80](https://github.com/jaainil/writenex/commit/0a52e80f136a9422bde80b983a92d2c5b229724e))
* expand and categorize supported code block languages in the editor with updated display names and an empty string fallback. ([eee0e13](https://github.com/jaainil/writenex/commit/eee0e13e1dde847123170dd4865cb7462e0073d0))
* migrate to monorepo structure with pnpm workspaces ([#3](https://github.com/jaainil/writenex/issues/3)) ([6d0c62a](https://github.com/jaainil/writenex/commit/6d0c62a5106f62e8f1ced0b493f7690f0b9c4a27))
