## Sizes

sm / md / lg.

```tsx
<Input size="lg" placeholder="Large" />
```

## With icon slot

```tsx
<Input startSlot={<Mail className="size-4" />} placeholder="you@studio.com" />
```

## States

Invalid, disabled, and read-only.

```tsx
<Input invalid />
<Input disabled />
<Input readOnly />
```

## Textarea

Resizable multi-line text input with the same border, focus, and invalid states as Input.

```tsx
<Textarea placeholder="Write your message…" rows={3} />
```

## Password Input

Adds a show/hide visibility toggle button.

```tsx
<PasswordInput placeholder="Password" />
```

## Search Input

Adds a search icon and a clear button once there's a value.

```tsx
<SearchInput placeholder="Search…" />
```

## Number Input

Increment/decrement steppers (wraps Base UI NumberField).

```tsx
<NumberInput defaultValue={1} min={0} max={10} />
```

## OTP Input

One-time-code entry with individually-focusable character slots.

```tsx
<OTPInput length={6} autoSubmit onValueComplete={handleComplete} />
```
