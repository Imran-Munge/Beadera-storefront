# Beadera Storefront

Beadera Storefront is a web product workspace maintained in this repository. The codebase is a pnpm monorepo with TypeScript packages and shared artifacts.

## Tooling

- TypeScript
- pnpm workspaces
- Replit Connectors SDK

## Requirements

- Node.js compatible with the pinned project dependencies
- pnpm

## Setup

```bash
git clone https://github.com/Imran-Munge/Beadera-storefront.git
cd Beadera-storefront
pnpm install
pnpm run typecheck
pnpm run build
```

The repository enforces pnpm during installation. Use the workspace scripts rather than running npm install.

## Development

Inspect the workspace package scripts to identify the relevant app or package before starting development. Run typechecking and the build before submitting changes.

## License

The package manifest currently declares MIT. Check the repository's LICENSE file for the complete license text.
