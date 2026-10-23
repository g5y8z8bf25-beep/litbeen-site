# Litbeen official website

Static public pages for Litbeen 1.0:

- Product home page
- Privacy Policy
- Support and JSON backup guide

The site has no runtime dependencies, analytics, cookies, contact forms, application source code,
signing material, or user travel data. It is intended to be published from the repository root with
GitHub Pages.

The approved public support address is `litbeen@tutamail.com`. Before publication, run:

```sh
node scripts/validate.mjs
```

During private drafting only, structural validation can be run with:

```sh
node scripts/validate.mjs --allow-placeholder
```
