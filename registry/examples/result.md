## Success

```tsx
<Result
  variant="success"
  title="Payment complete"
  description="A receipt is on its way to your inbox."
  actions={<Button>Back to orders</Button>}
/>
```

## Error

```tsx
<Result
  variant="danger"
  title="Payment failed"
  description="Your card was declined. No money has left your account."
  actions={<Button>Try another card</Button>}
/>
```
