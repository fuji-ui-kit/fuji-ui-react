import { useState } from "react";
import { FujiProvider, Button, Input, Card } from "@fuji-ui/react";
import type { FujiTheme } from "@fuji-ui/react";

export default function App() {
  const [theme, setTheme] = useState<FujiTheme>("light");

  return (
    <FujiProvider theme={theme}>
      <div className="p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Fixture: Tailwind consumer with a custom theme</h1>
        <p className="text-sm">
          This app overrides Tailwind's own <code>--spacing</code> to <code>0.75rem</code> (3x the 0.25rem
          default) and defines its own <code>--color-brand-500</code>. If Fuji's compiled CSS referenced the
          bare <code>--spacing</code> variable anywhere, Fuji's own button/input/card padding and control
          heights below would balloon to match this host's 3x scale. They should stay at Fuji's normal, tuned
          size regardless.
        </p>

        <div className="flex gap-2">
          {(["light", "dark", "glass"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className="p-4 border"
              data-testid={`theme-${t}`}
            >
              {t} {theme === t ? "(active)" : ""}
            </button>
          ))}
        </div>

        <div className="flex gap-4 items-start">
          <div>
            <h2 className="text-lg font-semibold">Fuji components (should be UNAFFECTED)</h2>
            <Card className="p-4 flex flex-col gap-3 max-w-sm" data-testid="fuji-card">
              <Button size="lg" data-testid="lg-button">
                Large button
              </Button>
              <Input placeholder="Fuji input" data-testid="fuji-input" />
            </Card>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Host's own p-4 box (uses the 3x custom --spacing)</h2>
            <div className="p-4 border-2 border-black bg-white" data-testid="host-p4-box">
              This box's padding is 3x normal (host's own customized --spacing), by design - proving the
              host's own utilities and Fuji's are computed from independent scales.
            </div>
          </div>
        </div>

        <div
          className="p-4"
          style={{ background: "var(--color-brand-500)", color: "white" }}
          data-testid="host-brand-color-box"
        >
          Host's own --color-brand-500 (unrelated to any Fuji tone token)
        </div>
      </div>
    </FujiProvider>
  );
}
