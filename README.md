# Google Drive UI Component

This project includes a Google Drive interface component implemented in Vue 3.

## GGDriveView Component

The Google Drive view component has been implemented in two versions:

1. **Options API Version** (`GGDriveView.vue`): The original implementation using Vue's Options API.
2. **Composition API Version** (`GGDriveViewComposition.vue`): A refactored version using Vue's Composition API.

## How to Use the Composition API Version

To use the new Composition API version of the component in your routes:

1. Import the component from the views index:

```js
import { GGDriveViewComposition } from './views';
```

2. Update your router configuration to use the Composition API version:

```js
const routes = [
  {
    path: '/drive',
    name: 'GoogleDrive',
    component: GGDriveViewComposition
  }
  // other routes...
];
```

## Benefits of the Composition API Version

The Composition API version offers several advantages:

- Better organization of related code
- Improved type inference
- More reusable logic
- Better performance with large components
- Easier to maintain and extend

## Component Features

Both versions of the component provide the following features:

- File and folder browsing
- File uploads and downloads
- Folder creation and navigation
- File and folder renaming
- File and folder deletion
- Favorites management
- External bookmark management
- File preview
- Breadcrumb navigation

# fund-ui

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
