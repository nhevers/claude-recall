# Community Contributions

This folder contains community-contributed modes, themes, and extensions for claude-recall.

## Structure

```
contrib/
├── modes/       # Custom observation modes
├── themes/      # UI themes
└── README.md    # This file
```

## Contributing

We welcome contributions! Here's how to add your own:

### Adding a Mode

1. Create a JSON file in `contrib/modes/`
2. Follow the schema in `schemas/mode.schema.json`
3. Test your mode locally
4. Submit a pull request

Example mode structure:

```json
{
  "id": "my-mode",
  "name": "My Custom Mode",
  "description": "Description of what this mode does",
  "observation_types": [
    {
      "type": "custom-type",
      "description": "What this type captures",
      "icon": "🎯"
    }
  ]
}
```

### Adding a Theme

1. Create a CSS file in `contrib/themes/`
2. Use CSS variables for colors
3. Test in both light and dark contexts
4. Submit a pull request

Example theme structure:

```css
:root {
  --bg-primary: #1a1a2e;
  --text-primary: #eaeaea;
  /* ... more variables */
}
```

## Guidelines

- Test your contribution thoroughly before submitting
- Include a description comment at the top of your file
- Follow existing naming conventions
- Keep file sizes reasonable

## License

All contributions are licensed under the same license as claude-recall (MIT).
