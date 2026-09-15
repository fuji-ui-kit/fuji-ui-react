## Clickable

```tsx
<Stepper activeStep={step} onStepClick={setStep} steps={steps} />
```

## Custom icons

Give a step an icon to replace its number; completed steps still show the check.

```tsx
<Stepper
  activeStep={1}
  steps={[
    { label: "Account", icon: <User /> },
    { label: "Payment", icon: <CreditCard /> },
  ]}
/>
```

## Tones

tone recolors the completed track, active step, and connectors.

```tsx
<Stepper tone="forest" activeStep={2} steps={steps} />
```

## Back / Next with a disabled step

Drive activeStep from your own Back/Next controls; a step can be disabled so it's skipped.

```tsx
const [active, setActive] = useState(2);
<Stepper steps={steps} activeStep={active} onStepClick={setActive} />
<Button onClick={() => setActive((s) => s - 1)}>Back</Button>
<Button onClick={() => setActive((s) => s + 1)}>Next</Button>
```
