Readme preview SVGs are generated — not edited by hand.

```bash
pnpm run generate-readme-samples
```

CI runs this before tests. Pushes to `main` that change card renderers open a PR via [.github/workflows/generate-readme-samples.yml](/.github/workflows/generate-readme-samples.yml) (branch protection requires PR, not direct push).
