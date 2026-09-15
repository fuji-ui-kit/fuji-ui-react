## Basic

For a destructive choice the user must make explicitly. Use Dialog when it can simply be dismissed.

```tsx
<AlertDialog>
  <AlertDialog.Trigger render={<Button tone="fire">Delete project</Button>} />
  <AlertDialog.Content>
    <AlertDialog.Title>Delete this project?</AlertDialog.Title>
    <AlertDialog.Description>This removes every deployment and cannot be undone.</AlertDialog.Description>
    <AlertDialog.Footer>
      <AlertDialog.Close render={<Button appearance="bordered">Cancel</Button>} />
      <Button tone="fire" onClick={destroy}>
        Delete
      </Button>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>
```
