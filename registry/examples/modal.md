## Dialog

```tsx
<Dialog>
  <Dialog.Trigger render={<Button />}>Open</Dialog.Trigger>
  <Dialog.Content mobileBehavior="sheet">
    <Dialog.Title>Edit profile</Dialog.Title>
  </Dialog.Content>
</Dialog>
```

## Long content

`Dialog.Content` caps at the viewport (85vh, or full height under
`mobileBehavior="fullscreen"` on a phone) and scrolls its own content past
that, so a long form needs no scroll wrapper.

```tsx
<Dialog>
  <Dialog.Trigger render={<Button />}>Terms</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Terms of service</Dialog.Title>
    <TermsBody />
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
