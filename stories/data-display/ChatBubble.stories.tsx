import type { Meta, StoryObj } from "@storybook/react";
import { Play } from "lucide-react";
import { Avatar, ChatBubble } from "@fuji-ui/react";

const meta = {
  title: "Data Display/ChatBubble",
  component: ChatBubble,
  tags: ["autodocs"],
  args: {
    children: "Hey, are we still on for 3pm?",
  },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Incoming: Story = {};

export const Outgoing: Story = {
  args: {
    align: "outgoing",
    children: "Yes, see you then!",
    timestamp: "2:12 PM",
    status: "read",
  },
};

export const Conversation: Story = {
  name: "Basic conversation",
  render: () => (
    <div className="flex w-full max-w-md flex-col">
      <ChatBubble timestamp="2:10 PM">Hey, are we still on for 3pm?</ChatBubble>
      <ChatBubble align="outgoing" timestamp="2:12 PM" status="read">
        Yes, see you then!
      </ChatBubble>
      <ChatBubble timestamp="2:13 PM">Great, I'll bring the slides.</ChatBubble>
      <ChatBubble align="outgoing" timestamp="2:13 PM" status="delivered">
        Perfect, see you in the lobby.
      </ChatBubble>
    </div>
  ),
};

export const GroupedMessages: Story = {
  name: "Grouped consecutive messages",
  render: () => (
    <div className="flex w-full max-w-md flex-col">
      <ChatBubble sender="Priya Natarajan" grouped timestamp="2:14 PM">
        Quick update on the order
      </ChatBubble>
      <ChatBubble grouped>It shipped this morning</ChatBubble>
      <ChatBubble sender="Priya Natarajan" timestamp="2:14 PM">
        Should land by Friday
      </ChatBubble>
      <ChatBubble align="outgoing" grouped>
        Awesome, thank you!
      </ChatBubble>
      <ChatBubble align="outgoing" timestamp="2:16 PM" status="read">
        Let me know if anything changes.
      </ChatBubble>
    </div>
  ),
};

export const WithAvatars: Story = {
  name: "With avatars",
  render: () => (
    <div className="flex w-full max-w-md flex-col">
      <ChatBubble
        avatar={<Avatar alt="Priya Natarajan" fallback="PN" />}
        sender="Priya Natarajan"
        timestamp="9:41 AM"
      >
        Morning! Did the design review notes go out?
      </ChatBubble>
      <ChatBubble
        align="outgoing"
        avatar={<Avatar alt="You" fallback="You" />}
        timestamp="9:43 AM"
        status="read"
      >
        Just sent them over, check your inbox.
      </ChatBubble>
      <ChatBubble
        avatar={<Avatar alt="Priya Natarajan" fallback="PN" />}
        sender="Priya Natarajan"
        timestamp="9:44 AM"
      >
        Got it, thanks!
      </ChatBubble>
    </div>
  ),
};

export const RichContent: Story = {
  name: "Attachments and audio",
  render: () => (
    <div className="flex w-full max-w-md flex-col">
      <ChatBubble sender="Priya Natarajan" timestamp="4:02 PM">
        Here's the signed contract
        <div className="mt-2">
          <ChatBubble.Attachment name="contract-signed.pdf" meta="1.2 MB" onClick={() => {}} />
        </div>
      </ChatBubble>
      <ChatBubble align="outgoing" timestamp="4:05 PM" status="delivered">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Play voice message"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fuji-default-foreground/15 text-current"
          >
            <Play className="size-3.5 fill-current" aria-hidden="true" />
          </button>
          <div className="flex h-6 flex-1 items-center gap-0.5" aria-hidden="true">
            {[6, 12, 8, 16, 10, 14, 7, 11, 5, 13].map((height, index) => (
              <span
                key={index}
                className="w-0.5 shrink-0 rounded-full bg-current opacity-70"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <span className="shrink-0 text-[length:var(--fuji-text-xs)] opacity-80">0:18</span>
        </div>
      </ChatBubble>
    </div>
  ),
};

export const TypingIndicator: Story = {
  name: "Typing indicator",
  render: () => (
    <div className="flex w-full max-w-md flex-col">
      <ChatBubble avatar={<Avatar alt="Priya Natarajan" fallback="PN" />} sender="Priya Natarajan">
        <div role="status" className="flex items-center gap-1 py-0.5">
          <span className="sr-only">Priya Natarajan is typing</span>
          <span
            aria-hidden="true"
            className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:0ms] motion-reduce:animate-none"
          />
          <span
            aria-hidden="true"
            className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:150ms] motion-reduce:animate-none"
          />
          <span
            aria-hidden="true"
            className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:300ms] motion-reduce:animate-none"
          />
        </div>
      </ChatBubble>
    </div>
  ),
};
