## States

```tsx
<Switch label="Notifications" defaultChecked />
```

## Controlled

Own the on/off state with checked and onCheckedChange.

```tsx
const [checked, setChecked] = useState(false);
<Switch label="Airplane mode" checked={checked} onCheckedChange={setChecked} />;
```
