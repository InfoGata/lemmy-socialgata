# Lemmy Plugin for SocialGata

A SocialGata plugin that provides access to Lemmy instances, communities, posts, and comments.

## Features

- Browse posts from any Lemmy instance
- Discover and switch between Lemmy instances
- View communities and their posts
- Read post comments with nested replies
- View user profiles and their activity
- Search posts across the instance
- Configurable default instance

## Installation

### From URL (Recommended)

Install the plugin in SocialGata by providing the manifest URL:
```
https://cdn.jsdelivr.net/gh/InfoGata/lemmy-socialgata@latest/manifest.json
```

### Manual Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. In SocialGata, add the plugin from the `dist/` folder

## Configuration

By default, the plugin connects to `lemmy.ml`. You can change the default instance in the plugin options:

1. Open the plugin options in SocialGata
2. Enter your preferred Lemmy instance URL (e.g., `https://lemmy.world`)
3. Save settings

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

This runs two builds:
- `npm run build:options` - Builds the options UI page
- `npm run build:plugin` - Builds the main plugin script

### Output

- `dist/index.js` - Main plugin script
- `dist/options.html` - Options/settings page

## Plugin API Methods

| Method | Description |
|--------|-------------|
| `onGetFeed` | Get posts from the instance feed |
| `onGetInstances` | Get list of Lemmy instances |
| `onGetCommunity` | Get posts from a specific community |
| `onGetComments` | Get comments for a post with nested replies |
| `onGetUser` | Get a user's profile and posts |
| `onSearch` | Search posts across the instance |
| `onGetPlatformType` | Returns "forum" |

## License

MIT
