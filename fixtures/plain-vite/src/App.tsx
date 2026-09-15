import { useState } from "react";
import { FujiProvider, Button, Input, Card, Dialog } from "@fujiui/react";
import type { FujiTheme, FujiElevation } from "@fujiui/react";

export default function App() {
  const [theme, setTheme] = useState<FujiTheme>("light");
  const [elevation, setElevation] = useState<FujiElevation>("regular");

  return (
    <FujiProvider theme={theme} elevation={elevation}>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <h1>Fixture: plain Vite, no Tailwind</h1>

        <div style={{ display: "flex", gap: 8 }}>
          {(["light", "dark", "glass"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTheme(t)} data-testid={`theme-${t}`}>
              {t} {theme === t ? "(active)" : ""}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setElevation(elevation === "regular" ? "floating" : "regular")}
            data-testid="elevation-toggle"
          >
            elevation: {elevation}
          </button>
        </div>

        <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button tone="default">Default</Button>
            <Button tone="fire">Fire</Button>
            <Button tone="water">Water</Button>
            <Button tone="forest">Forest</Button>
            <Button tone="sun">Sun</Button>
          </div>
          <Button size="lg" data-testid="lg-button">
            Large button (checking horizontal padding)
          </Button>
          <Input placeholder="Type here to check focus ring" data-testid="fuji-input" />
          <Dialog>
            <Dialog.Trigger render={<Button data-testid="dialog-trigger">Open dialog</Button>} />
            <Dialog.Content data-testid="dialog-content">
              <Dialog.Title>Portal content</Dialog.Title>
              <p>This renders in a portal outside the provider subtree - verifying theme re-stamping.</p>
              <Input placeholder="Focus me inside the dialog" />
            </Dialog.Content>
          </Dialog>
        </Card>

        <div className="host-conflict-demo">
          <h2>Host's own conflicting classes (no Tailwind, plain CSS)</h2>
          <p>
            This app defines its own <code>.flex</code>, <code>.p-4</code>, <code>.text-sm</code>,{" "}
            <code>.rounded-lg</code> classes with deliberately loud, wrong-looking styles (red, forced block
            display, huge red text). If Fuji's compiled CSS leaked unprefixed utilities, the Card/Button above
            would visibly break (turn red, lose flex layout, get huge text) since this stylesheet loads after
            Fuji's.
          </p>
          <div className="flex p-4 text-sm rounded-lg" data-testid="host-conflict-box">
            host's own flex/p-4/text-sm/rounded-lg box (should render loud &amp; red - it's supposed to, this
            is the host's own CSS, unrelated to Fuji)
          </div>
        </div>
      </div>
    </FujiProvider>
  );
}
