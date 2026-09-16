## Basic

A 100% board. Every cap is a button: it travels down and lights up in `tone`
when struck, and reports itself through `onKeyPress`.

```tsx
<Keyboard onKeyPress={(key) => console.log(key.code)} />
```

## Smaller layouts

`tkl` is a 75% board, `compact` a 65%, `numpad` the number pad on its own.

```tsx
<Keyboard layout="compact" size="sm" />
```

`phone` is ten columns wide - narrow enough that an interactive cap still
clears the WCAG 2.5.8 24x24 target floor when the board is docked at a phone
width. `full` (the default) and `tkl` fail that floor even worse than
`compact` does - see `docs/accessibility.md` for the numbers across all five
layouts. `phone` mirrors iOS's own ten-column keyboard instead.

```tsx
<Keyboard floating open layout="phone" triggerRef={field} onKeyPress={type} />
```

## Filling its container

In flow, a board draws at its `size`'s cap scale and shrinks to fit a narrower
container. Give it a `width` to grow it instead: an explicit width lifts the
size's cap ceiling, and a percentage is a share of the box the board sits in -
so `width="100%"` spans its parent. It still never overflows that box.

```tsx
<Card>
  <Keyboard layout="numpad" width="100%" />
</Card>
```

## A PIN or OTP keypad

`numpad` carries a `⌫` Backspace in its top-left corner (where a physical pad
has Num Lock). Presses never move focus off the field being typed into, in flow
as well as docked, so the keypad needs no mousedown wrapper.

```tsx
const [pin, setPin] = React.useState("");

<>
  <Input readOnly value={pin} aria-label="PIN" />
  <Keyboard
    layout="numpad"
    width="100%"
    onKeyPress={(key) => {
      if (key.code === "Backspace") setPin((value) => value.slice(0, -1));
      else if (key.value && /\d/.test(key.value)) setPin((value) => value + key.value);
    }}
  />
</>;
```

## Driving an input

```tsx
const [text, setText] = React.useState("");

<Keyboard
  layout="compact"
  onKeyPress={(key) => {
    if (key.code === "Backspace") setText((value) => value.slice(0, -1));
    else if (key.value) setText((value) => value + key.value);
  }}
/>;
```

## Accented caps

No cap is coloured until `accentKeys` names one - the coloured Esc and arrow
cluster of a real board.

```tsx
<Keyboard tone="water" accentKeys={["Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]} />
```

## A static diagram

`interactive={false}` renders plain `<kbd>` caps and takes no tab stop.

```tsx
<Keyboard layout="tkl" interactive={false} />
```

## Mirroring the real keyboard

`captureKeys` holds a cap down while its physical key is held.

```tsx
<Keyboard layout="tkl" captureKeys />
```

## Modifiers

Shift and Caps Lock both light a lamp on the cap and change what the board
reports. Shift takes the cap's second legend where it has one (`1` types `!`)
and otherwise flips case; Caps Lock only flips case, because it is not Shift.
The two cancel, so Shift on a locked board types lowercase.

Shift armed by clicking is sticky - it applies to the next cap and lets go,
which is how every on-screen keyboard behaves, since there is nothing to hold
down. Under `captureKeys` the physical Shift shares the same state and stays
engaged while it is actually held.

```tsx
<Keyboard
  captureKeys
  onKeyPress={(key) => {
    // "!" after Shift, "A" under Caps Lock, "a" with neither.
    if (key.value) setText((value) => value + key.value);
  }}
/>
```

## Action caps

Caps that type nothing - the arrows, Backspace, Home/End, Enter, the function
row - report a `code` and no `value`. That is the hook for wiring them to a
real field:

```tsx
<Keyboard
  onKeyPress={(key) => {
    if (key.value !== undefined) return insertAtCaret(key.value);
    if (key.code === "ArrowLeft") return moveCaret(-1);
    if (key.code === "ArrowRight") return moveCaret(1);
    if (key.code === "Backspace") return deleteBack();
  }}
/>
```

## Sound

`sound` plays a short click on every press, synthesised through the Web Audio
API - no asset, no dependency, nothing to fail to load. Off by default.

```tsx
<Keyboard sound />
```

## Floating over the page

`floating` docks the board instead of laying it out in flow. It fills its
`anchor` edge to edge, centres itself, unmounts while closed, and closes on
Escape or an outside press. Clicking a cap never blurs the field being typed
into, and the margins either side of the board stay click-through.

```tsx
const field = React.useRef<HTMLInputElement>(null);
const [open, setOpen] = React.useState(false);

<>
  <Input ref={field} onFocus={() => setOpen(true)} aria-label="Message" />
  <Keyboard
    floating
    open={open}
    onOpenChange={setOpen}
    triggerRef={field}
    layout="compact"
    size="sm"
    onKeyPress={type}
  />
</>;
```

## Sizing a docked board

A board docked to the viewport is measured against the screen, not against the
px cap scale that suits a diagram in a card: `size` picks roughly 45vw / 60vw
/ 75vw, and `width` overrides that with any CSS length or a number of pixels.
Only the cap unit is set - row height, legends and gaps all follow it - so the
board stays in proportion.

Every one of those is an upper bound. The board also never exceeds its own
container, so it resizes with whatever it is placed in and cannot overflow it;
`anchor="parent"` drops the screen-relative target entirely and is measured by
the parent alone.

```tsx
<Keyboard floating open size="lg" />
<Keyboard floating open width="900px" />
<Keyboard floating open width="80vw" />
```

## Docking inside a parent instead of the viewport

`anchor="parent"` positions against the nearest positioned ancestor - a keypad
that fills its own card rather than the screen. Give that ancestor
`position: relative`.

```tsx
<div style={{ position: "relative" }}>
  <Input readOnly value={pin} aria-label="PIN" />
  <Keyboard floating anchor="parent" defaultOpen layout="numpad" onKeyPress={enter} />
</div>
```
