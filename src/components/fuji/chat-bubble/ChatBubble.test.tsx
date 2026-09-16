import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ChatBubble, ChatBubbleTyping } from "./ChatBubble";
import { Avatar } from "../avatar/Avatar";

describe("ChatBubble", () => {
  it("renders its message content", () => {
    render(<ChatBubble>Hey, are we still on for 3pm?</ChatBubble>);
    expect(screen.getByText("Hey, are we still on for 3pm?")).toBeInTheDocument();
  });

  it("defaults to incoming alignment", () => {
    const { container } = render(<ChatBubble>Hi</ChatBubble>);
    expect(container.firstElementChild).toHaveAttribute("data-align", "incoming");
  });

  it("marks outgoing alignment", () => {
    const { container } = render(<ChatBubble align="outgoing">On my way</ChatBubble>);
    expect(container.firstElementChild).toHaveAttribute("data-align", "outgoing");
  });

  it("renders the avatar slot when passed", () => {
    render(<ChatBubble avatar={<Avatar alt="Priya Natarajan" fallback="PN" />}>Hello</ChatBubble>);
    expect(screen.getByText("PN")).toBeInTheDocument();
  });

  it("renders no avatar slot (and no placeholder) when the avatar prop is omitted", () => {
    const { container } = render(<ChatBubble>Hello</ChatBubble>);
    // Just the message column - no leading avatar span/placeholder at all.
    expect(container.firstElementChild?.children.length).toBe(1);
  });

  it("shows sender, timestamp, and status by default (not grouped)", () => {
    render(
      <ChatBubble sender="Priya Natarajan" timestamp="2:14 PM" status="read">
        On my way
      </ChatBubble>,
    );
    expect(screen.getByText("Priya Natarajan")).toBeInTheDocument();
    expect(screen.getByText("2:14 PM")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
  });

  it("suppresses sender/timestamp/status metadata when grouped", () => {
    render(
      <ChatBubble grouped sender="Priya Natarajan" timestamp="2:14 PM" status="read">
        Be there in 5
      </ChatBubble>,
    );
    expect(screen.queryByText("2:14 PM")).not.toBeInTheDocument();
    expect(screen.queryByText("Read")).not.toBeInTheDocument();
    expect(screen.getByText("Be there in 5")).toBeInTheDocument();
  });

  // The sender is the one piece of grouped metadata that can't just be
  // dropped: a sighted reader infers it from the run's shape, a linear
  // screen-reader pass has nothing to infer from.
  it("keeps the sender announced (visually hidden) when grouped", () => {
    render(
      <ChatBubble grouped sender="Priya Natarajan">
        Be there in 5
      </ChatBubble>,
    );
    const sender = screen.getByText("Priya Natarajan");
    expect(sender).toBeInTheDocument();
    expect(sender.className).toEqual(expect.stringContaining("sr-only"));
  });

  it("reserves the avatar's footprint (rather than collapsing it) when grouped", () => {
    const { container: withAvatar } = render(
      <ChatBubble grouped avatar={<Avatar alt="Priya Natarajan" fallback="PN" />}>
        Be there in 5
      </ChatBubble>,
    );
    // The visible avatar content is suppressed while grouped...
    expect(withAvatar.textContent).not.toContain("PN");
    // ...but a same-size placeholder still occupies the row so later bubbles
    // in the run don't drift out of alignment. Queried by role/attribute
    // rather than a Tailwind class name, which is an internal styling detail.
    const placeholder = withAvatar.querySelector('span[aria-hidden="true"]');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).not.toHaveTextContent("PN");
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ChatBubble ref={ref}>Hi</ChatBubble>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveTextContent("Hi");
  });

  it("spreads native props and merges className", () => {
    render(
      <ChatBubble data-testid="bubble-row" className="custom-class">
        Hi
      </ChatBubble>,
    );
    const row = screen.getByTestId("bubble-row");
    expect(row).toHaveClass("custom-class");
  });

  it("has no obvious accessibility violations in a full conversation", async () => {
    const { container } = render(
      <div>
        <ChatBubble
          avatar={<Avatar alt="Priya Natarajan" fallback="PN" />}
          sender="Priya Natarajan"
          timestamp="2:10 PM"
        >
          Hey, are we still on for 3pm?
        </ChatBubble>
        <ChatBubble align="outgoing" timestamp="2:12 PM" status="read">
          Yes, see you then!
        </ChatBubble>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  describe("ChatBubble.Attachment", () => {
    it("renders the attachment name and meta detail", () => {
      render(<ChatBubble.Attachment name="invoice.pdf" meta="248 KB" />);
      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
      expect(screen.getByText("248 KB")).toBeInTheDocument();
    });

    it("renders as a static chip (no button role) without onClick", () => {
      render(<ChatBubble.Attachment name="invoice.pdf" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders as a real, clickable button when onClick is provided", async () => {
      const onClick = vi.fn();
      render(<ChatBubble.Attachment name="invoice.pdf" onClick={onClick} />);
      const button = screen.getByRole("button", { name: /invoice\.pdf/i });
      expect(button).toHaveAttribute("type", "button");
      await userEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("renders a preview slot in place of the icon", () => {
      const { container } = render(
        <ChatBubble.Attachment preview={<img src="thumb.png" alt="" />} name="photo.jpg" meta="2 MB" />,
      );
      expect(container.querySelector("img")).toHaveAttribute("src", "thumb.png");
      // The default paperclip glyph is replaced, not rendered alongside.
      expect(container.querySelectorAll("svg")).toHaveLength(0);
    });

    it("keeps the default icon when no preview is given", () => {
      const { container } = render(<ChatBubble.Attachment name="notes.txt" />);
      expect(container.querySelectorAll("svg")).toHaveLength(1);
    });

    it("applies classNames.preview to the preview box", () => {
      const { container } = render(
        <ChatBubble.Attachment
          preview={<img src="thumb.png" alt="" />}
          name="photo.jpg"
          classNames={{ preview: "custom-preview" }}
        />,
      );
      expect(container.querySelector("img")?.parentElement).toHaveClass("custom-preview");
    });

    it("stays a non-interactive element without onClick, so it can sit inside a link", async () => {
      const { container } = render(
        <a href="/download">
          <ChatBubble.Attachment preview={<img src="thumb.png" alt="" />} name="photo.jpg" />
        </a>,
      );
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("ChatBubble.Typing", () => {
    it("announces a default 'Typing' label through a status region", () => {
      render(<ChatBubble.Typing />);
      expect(screen.getByRole("status")).toHaveTextContent("Typing");
    });

    it("accepts a custom label", () => {
      render(<ChatBubble.Typing label="Priya is typing" />);
      expect(screen.getByRole("status")).toHaveTextContent("Priya is typing");
    });

    it("hides the decorative dots from assistive tech and stops them under reduced motion", () => {
      const { container } = render(<ChatBubble.Typing />);
      const dots = container.querySelector('[aria-hidden="true"]');
      expect(dots?.children).toHaveLength(3);
      for (const dot of Array.from(dots!.children)) {
        expect(dot.className).toEqual(expect.stringContaining("motion-reduce:animate-none"));
      }
    });

    it("forwards its ref and spreads native props", () => {
      const ref = React.createRef<HTMLSpanElement>();
      render(<ChatBubble.Typing ref={ref} data-testid="typing" className="custom" />);
      expect(ref.current).toBe(screen.getByTestId("typing"));
      expect(ref.current).toHaveClass("custom");
    });

    it("is exported by name for Server Component consumers", () => {
      expect(ChatBubbleTyping).toBe(ChatBubble.Typing);
    });

    it("has no obvious accessibility violations inside a bubble", async () => {
      const { container } = render(
        <ChatBubble sender="Priya Natarajan">
          <ChatBubble.Typing label="Priya Natarajan is typing" />
        </ChatBubble>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
