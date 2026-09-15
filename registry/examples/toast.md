## Variants

Each trigger uses the tone of the toast it raises.

```tsx
const toast = useToast();
toast.add({ title: "Saved", data: { variant: "success" } });
```

## With a description

A second line for detail the title cannot carry. timeout overrides the auto-dismiss delay - give a longer message longer to read.

```tsx
toast.add({
  title: "Upload failed",
  description: "The file was larger than the 10 MB limit.",
  data: { variant: "danger" },
  timeout: 8000,
});
```

## Setup

Mount the provider and one Toaster viewport once at the app root. Toaster takes position; add() takes an optional description and a timeout (ms; 0 keeps it until dismissed).

```tsx
// app root
<ToastProvider>
  <App />
  <Toaster position="bottom-right" />
</ToastProvider>;

// anywhere inside
const toast = useToast();
toast.add({
  title: "Upload failed",
  description: "The file was larger than 10 MB.",
  data: { variant: "danger" },
  timeout: 8000,
});
```
