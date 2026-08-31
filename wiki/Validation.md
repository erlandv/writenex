# Validation

Every field supports a `validation` object. Validation runs when the form is submitted (create/update) and shows inline errors in the frontmatter panel.

```typescript
fields.text({
  label: "Title",
  validation: {
    isRequired: true,
    minLength: 3,
    maxLength: 100,
    pattern: "^[A-Za-z]",
    patternDescription: "Must start with a letter",
  },
})

fields.number({
  label: "Price",
  validation: {
    isRequired: true,
    min: 0,
    max: 10000,
  },
})
```

## Options

| Option | Type | Applies to | Description |
| --- | --- | --- | --- |
| `isRequired` | `boolean` | all fields | Field must have a value |
| `min` | `number` | `number`, `integer` | Minimum numeric value |
| `max` | `number` | `number`, `integer` | Maximum numeric value |
| `minLength` | `number` | `text`, `url` | Minimum character count |
| `maxLength` | `number` | `text`, `url` | Maximum character count |
| `pattern` | `string` | `text`, `slug` | Regex pattern the value must match |
| `patternDescription` | `string` | `text`, `slug` | Human-friendly error shown when the pattern fails |

## Notes

- `isRequired` validates on **form submission only** — autosave doesn't block on missing required fields, so you can draft freely and fix validation before publishing
- `pattern` accepts any JavaScript regex source string
- Validation is enforced in the editor UI. The [REST API](REST-API) writes files directly — combine API use with your own validation if you script mutations

## Examples

### Pattern-matched slug

```typescript
fields.slug({
  label: "URL Slug",
  validation: {
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    patternDescription: "Lowercase letters, numbers, and hyphens only",
  },
})
```

### Bounded rating

```typescript
fields.number({
  label: "Rating",
  validation: { min: 0, max: 5 },
})
```

### Required summary with length limit

```typescript
fields.text({
  label: "Summary",
  multiline: true,
  validation: {
    isRequired: true,
    minLength: 20,
    maxLength: 300,
  },
})
```
