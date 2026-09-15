## Dialog

```tsx
<Dialog>
  <Dialog.Trigger render={<Button />}>Open</Dialog.Trigger>
  <Dialog.Content mobileBehavior="sheet">
    <Dialog.Title>Edit profile</Dialog.Title>
  </Dialog.Content>
</Dialog>
```

## Alert dialog (destructive confirmation)

```tsx
<AlertDialog>
  <AlertDialog.Trigger render={<Button tone="fire" />}>Delete</AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Footer>
      <AlertDialog.Close render={<Button />}>Cancel</AlertDialog.Close>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>
```
