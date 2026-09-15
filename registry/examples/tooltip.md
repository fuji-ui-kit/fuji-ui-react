## Basic

Wrap the app once in Tooltip.Provider so the delays are shared.

```tsx
<Tooltip.Provider>
  <Tooltip>
    <Tooltip.Trigger
      render={
        <IconButton aria-label="Duplicate">
          <Copy />
        </IconButton>
      }
    />
    <Tooltip.Content>Duplicate</Tooltip.Content>
  </Tooltip>
</Tooltip.Provider>
```

## Server Components

A Server Component must import the named sub-export rather than reading it off the root.

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@fujiui/react";

<Tooltip>
  <TooltipTrigger render={<Button>Hover me</Button>} />
  <TooltipContent>Shown on hover and on focus</TooltipContent>
</Tooltip>;
```
