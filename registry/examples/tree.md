## Basic

Nodes with children render an expand/collapse toggle; leaf nodes don't.

```tsx
<Tree
  data={[
    {
      id: "src",
      label: "src",
      icon: <Folder />,
      children: [{ id: "index.ts", label: "index.ts", icon: <File /> }],
    },
  ]}
  defaultExpandedIds={["src"]}
/>
```

## Default expanded

defaultExpandedIds pre-opens specific branches on first render, without making the tree controlled.

```tsx
<Tree data={fileTree} defaultExpandedIds={["src", "components"]} />
```

## Controlled selection

selectedId plus onSelect drives the selected node from your own state - onSelect fires on click or Enter/Space while a node is focused.

```tsx
const [selectedId, setSelectedId] = useState("button.tsx");
<Tree data={fileTree} selectedId={selectedId} onSelect={(node) => setSelectedId(node.id)} />;
```
