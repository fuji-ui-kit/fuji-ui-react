## Variants

```tsx
<Alert variant="danger" title="Error" onDismiss={handleDismiss}>
  Something went wrong.
</Alert>
```

## Dismissible

Pass onDismiss to render a close control; you own the visibility state.

```tsx
const [visible, setVisible] = useState(true);
{
  visible && (
    <Alert variant="warning" title="Unsaved changes" onDismiss={() => setVisible(false)}>
      You have edits that haven't been saved yet.
    </Alert>
  );
}
```

## Without a title

Omit title for a compact, single-line inline message.

```tsx
<Alert variant="info">A simple, title-less inline message.</Alert>
```
