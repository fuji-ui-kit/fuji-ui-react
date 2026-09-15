## Basic

A row of individually focusable slots.

```tsx
<OTPInput length={6} onValueChange={(code) => verify(code)} />
```

## Invalid

The error state paints across every slot - a wrong code, not a wrong digit.

```tsx
<OTPInput length={6} invalid />
```
