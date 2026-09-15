import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Bell, Heart, MessageCircle, Search, SlidersHorizontal, Send, Star, UserPlus } from "lucide-react";
import { Avatar, IconButton, Notification, Typography } from "@fujiui/react";

const meta = {
  title: "Data Display/Notification",
  component: Notification,
  tags: ["autodocs"],
  args: {
    icon: <Bell className="size-4" />,
    title: "New comment on your order",
    description: "Priya Natarajan left a comment on ORD-1042.",
    timestamp: "2 min",
  },
} satisfies Meta<typeof Notification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unread: Story = {
  args: { unread: true },
};

export const List: Story = {
  name: "Notification list",
  render: () => (
    <div className="flex w-full max-w-md flex-col divide-y divide-fuji-border">
      <Notification
        icon={<Bell className="size-4" />}
        title="New comment on your order"
        description="Priya Natarajan left a comment on ORD-1042."
        timestamp="2 min"
        unread
      />
      <Notification
        icon={<Bell className="size-4" />}
        title="Payment confirmed"
        description="Your payment of $128.00 was successful."
        timestamp="1 h"
      />
      <Notification
        icon={<Bell className="size-4" />}
        title="Shipment delivered"
        description="ORD-1039 was delivered at 2:05 PM."
        timestamp="Yesterday"
      />
    </div>
  ),
};

const person = (id: number, name: string) => (
  <Avatar size="md" src={`https://picsum.photos/id/${id}/80/80`} alt={name} fallback={name[0]} />
);
const thumb = (id: number) => <img src={`https://picsum.photos/id/${id}/96/96`} alt="" />;

/**
 * An activity inbox: `layout="inline"` runs the sender's name into the
 * event text, `avatar` + `badge` show who and what kind of event, `media`
 * is a thumbnail of the thing it happened to, and `unread` rows get the
 * leading dot. Group rows under headings and separate them with `divide-y`.
 */
export const Inbox: Story = {
  name: "Inbox (activity feed)",
  render: () => (
    <div className="w-full max-w-md rounded-fuji-panel bg-fuji-surface p-6 shadow-fuji-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Typography scale="heading" as="h2" className="m-0">
            Notifications
          </Typography>
          <p className="m-0 mt-1 text-[length:var(--fuji-text-sm)] text-fuji-foreground-subtle">
            You have <span className="font-medium text-fuji-water">3 notifications</span> today.
          </p>
        </div>
        <IconButton appearance="ghost" aria-label="Filter notifications">
          <SlidersHorizontal className="size-4" />
        </IconButton>
      </div>

      <Typography scale="title" as="h3" className="mt-6! mb-1!">
        Today
      </Typography>
      <div className="flex flex-col divide-y divide-fuji-border">
        <Notification
          layout="inline"
          unread
          avatar={person(64, "Ava Lindqvist")}
          badge={<Heart />}
          title="Ava Lindqvist"
          description="liked your DailyUI 045 - Favourites"
          timestamp="2 h"
          media={thumb(1011)}
        />
        <Notification
          layout="inline"
          unread
          avatar={person(91, "Noah Okafor")}
          badge={<Heart />}
          title="Noah Okafor"
          description="liked your DailyUI 044 - Food menu"
          timestamp="6 h"
          media={thumb(292)}
        />
        <Notification
          layout="inline"
          unread
          avatar={person(1005, "Mateo Ruiz")}
          badge={<MessageCircle />}
          title="Mateo Ruiz"
          description="mentioned you in a comment"
          timestamp="8 h"
          media={thumb(1060)}
        />
      </div>

      <Typography scale="title" as="h3" className="mt-6! mb-1!">
        This week
      </Typography>
      <div className="flex flex-col divide-y divide-fuji-border">
        <Notification
          layout="inline"
          avatar={person(1027, "Priya Nair")}
          badge={<Heart />}
          title="Priya Nair"
          description="liked your DailyUI 044 - Food menu"
          timestamp="6 June"
          media={thumb(292)}
        />
        <Notification
          layout="inline"
          avatar={person(1012, "Best UI Design")}
          badge={<UserPlus />}
          title="Best UI Design"
          description="started following your work"
          timestamp="5 June"
        />
      </div>
    </div>
  ),
};

function AppIcon({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`flex size-10 items-center justify-center rounded-[10px] text-white [&>svg]:size-5 ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Alerts as cards: an app icon in the leading slot, title and sub-title,
 * the body beneath, and the sender's avatar as the trailing `media`.
 */
export const Alerts: Story = {
  name: "Alerts (cards)",
  render: () => (
    <div className="w-full max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <Typography scale="heading" as="h2" className="m-0">
          Notifications
        </Typography>
        <IconButton appearance="ghost" aria-label="Search">
          <Search className="size-4" />
        </IconButton>
      </div>
      <div className="flex flex-col gap-3">
        <Notification
          className="bg-fuji-surface shadow-fuji-card"
          avatar={
            <AppIcon className="bg-[#2aa7e5]">
              <Send />
            </AppIcon>
          }
          title="Messages"
          description="Ava sent you a photo from the trip - tap to see the whole album before it expires."
          timestamp="now"
          media={person(64, "Ava Lindqvist")}
          unread
        />
        <Notification
          className="bg-fuji-surface shadow-fuji-card"
          avatar={
            <AppIcon className="bg-[#f25c3b]">
              <Bell />
            </AppIcon>
          }
          title="Reminders"
          description="Your order from the bakery is ready for pickup until 6 PM today."
          timestamp="12 min"
          media={person(91, "Noah Okafor")}
        />
        <Notification
          className="bg-fuji-surface shadow-fuji-card"
          avatar={
            <AppIcon className="bg-[#f5a623]">
              <Star />
            </AppIcon>
          }
          title="Reviews"
          description="Mateo left a 5-star review on the listing you manage."
          timestamp="1 h"
          media={person(1005, "Mateo Ruiz")}
        />
      </div>
    </div>
  ),
};
