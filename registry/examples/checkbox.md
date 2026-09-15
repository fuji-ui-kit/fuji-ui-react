## States

```tsx
<Checkbox label="Accept terms" defaultChecked />
```

## Controlled

Drive the checked state yourself with checked and onCheckedChange.

```tsx
const [checked, setChecked] = useState(false);
<Checkbox label="Subscribe" checked={checked} onCheckedChange={setChecked} />;
```
