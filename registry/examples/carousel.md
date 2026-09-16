## Basic autoplay

Autoplay is opt-in: pass autoplay to advance every 3000ms with no arrows. The active dot fills to show progress until the next slide.

```tsx
<Carousel autoplay>
  {images.map((src) => (
    <Image key={src} src={src} ratio={16 / 9} className="w-full" />
  ))}
</Carousel>
```

## Configurable interval

Pass autoplay with autoplayInterval; the progress dot animation matches it.

```tsx
<Carousel autoplay autoplayInterval={1500}>
  <img src="/photos/ridge.jpg" alt="A ridge at sunrise" />
  <img src="/photos/lake.jpg" alt="A still lake shore" />
  <img src="/photos/forest.jpg" alt="A pine forest" />
</Carousel>
```

## Arrow controls

Pass controls for prev/next arrows overlaid on the edges. Arrows are semantic icon buttons.

```tsx
<Carousel controls autoplay={false}>
  <img src="/photos/ridge.jpg" alt="A ridge at sunrise" />
  <img src="/photos/lake.jpg" alt="A still lake shore" />
  <img src="/photos/forest.jpg" alt="A pine forest" />
</Carousel>
```

## Non-looping edges

With loop set to false, the arrows disable themselves at the first and last slide.

```tsx
<Carousel controls loop={false} autoplay={false}>
  <img src="/photos/ridge.jpg" alt="A ridge at sunrise" />
  <img src="/photos/lake.jpg" alt="A still lake shore" />
  <img src="/photos/forest.jpg" alt="A pine forest" />
</Carousel>
```

## Responsive multi-image

slidesPerView takes a responsive map. Slide count changes at CSS breakpoints, not via JavaScript.

```tsx
<Carousel controls slidesPerView={{ base: 1, sm: 2, lg: 3 }}>
  {images.map((src) => (
    <Image key={src} src={src} className="w-full" />
  ))}
</Carousel>
```

## Infinite autoplay, multiple cards

Use continuous mode for a smooth, always-moving image track with responsive card widths. It pauses while hovered or focused and has no arrows or bottom indicators.

```tsx
<Carousel autoplay continuous slidesPerView={{ base: 2, sm: 3, md: 4, lg: 6 }} autoplayInterval={2200}>
  {images.map((src) => (
    <Image key={src} src={src} ratio={1} />
  ))}
</Carousel>
```

## Coverflow effect

effect='coverflow' centers the active slide with neighbours rotated away in 3D and scaled by distance; the fan follows the pointer while dragging and snaps on release. Arrow keys and controls work as in the default preset. slidesPerView sets the centre slide's width as a fraction of the viewport (default 1.6, a ~62% slide); raise it to show more of the fan.

```tsx
<Carousel effect="coverflow" controls>
  {images.map((src) => (
    <Image key={src} src={src} ratio={16 / 9} className="w-full" />
  ))}
</Carousel>
```

## Controlled index

Drive the active slide from your own state with index and onIndexChange.

```tsx
const [index, setIndex] = useState(0);

<Carousel index={index} onIndexChange={setIndex} autoplay={false}>
  <img src="/photos/ridge.jpg" alt="A ridge at sunrise" />
  <img src="/photos/lake.jpg" alt="A still lake shore" />
  <img src="/photos/forest.jpg" alt="A pine forest" />
</Carousel>;
```
