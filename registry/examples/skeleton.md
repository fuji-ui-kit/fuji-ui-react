## Text lines

```tsx
<Skeleton shape="text" className="w-full" />
```

## Profile row

```tsx
<Skeleton shape="circle" className="size-10" />
<Skeleton shape="text" className="w-1/2" />
```

## Card

```tsx
<Skeleton shape="block" className="h-32 w-full" />
```

## Dashboard statistics

```tsx
<Skeleton shape="text" className="h-6 w-1/2" />
```

## Table rows

```tsx
{
  rows.map((_, i) => <Skeleton key={i} shape="text" className="w-1/4" />);
}
```
