import type { Meta, StoryObj } from "@storybook/react";
import { Star, MapPin, Bookmark, Play, MoreHorizontal } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Icon,
  IconButton,
  Image,
  Link,
  SegmentedControl,
  Statistic,
} from "@fujiui/react";

const meta = {
  title: "Data Display/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-full max-w-80">
      <Card.Header>
        <Card.Title>Storage plan</Card.Title>
        <Card.Description>You're using 68% of your 100 GB plan.</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="h-2 overflow-hidden rounded-full bg-fuji-surface-strong">
          <div className="h-full w-[68%] rounded-full bg-fuji-default" />
        </div>
      </Card.Content>
      <Card.Footer>
        <Button size="sm" tone="default">
          Upgrade plan
        </Button>
        <Button size="sm" appearance="ghost">
          Manage
        </Button>
      </Card.Footer>
    </Card>
  ),
};

export const Lift: Story = {
  name: 'Hover effect: "lift"',
  parameters: {
    docs: {
      description: {
        story:
          "The CSS treatment: the card scales up slightly, tips a degree and deepens its shadow on hover. Pure CSS, so it still works inside a Server Component. This replaces the old `interactive` boolean, which keeps working but is deprecated.",
      },
    },
  },
  render: () => (
    <Card effect="lift" className="w-full max-w-72">
      <Card.Header>
        <Card.Title>Weekly report</Card.Title>
        <Card.Description>Generated every Monday at 9:00 AM.</Card.Description>
      </Card.Header>
    </Card>
  ),
};

export const Tilt: Story = {
  name: 'Hover effect: "tilt"',
  parameters: {
    docs: {
      description: {
        story:
          "Tracks the pointer and tilts in 3D towards it, springing back when the pointer leaves - move the cursor around the card to see it. Skipped for touch pointers, which have no hover to follow, and under `prefers-reduced-motion: reduce`.",
      },
    },
  },
  render: () => (
    <Card effect="tilt" className="w-full max-w-72">
      <Card.Header>
        <Card.Title>Weekly report</Card.Title>
        <Card.Description>Move the pointer across this card.</Card.Description>
      </Card.Header>
    </Card>
  ),
};

export const Minimal: Story = {
  render: () => (
    <Card className="w-full max-w-72">
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        A card with no header/footer slots - just content.
      </p>
    </Card>
  ),
};

export const TravelListing: Story = {
  name: "Media + badges + price row",
  render: () => (
    <div className="flex flex-wrap gap-6">
      <Card className="w-72">
        <Card.Media>
          <Image src="https://picsum.photos/id/1018/640/480" alt="Lakeside cabin in Banff" ratio={4 / 3} />
          <div className="absolute top-3 right-3">
            <Badge tone="sun" appearance="solid">
              Top rated
            </Badge>
          </div>
        </Card.Media>
        <Card.Header>
          <Card.Title>Banff, Canada</Card.Title>
          <Card.Description>Turquoise lakes and snowy peaks in wild Canadian beauty.</Card.Description>
        </Card.Header>
        <Card.Content className="flex items-center gap-1 text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
          <Icon icon={MapPin} size="sm" />
          June 22 - 26 · Local host
        </Card.Content>
        <Card.Footer className="items-center justify-between">
          <span className="text-[length:var(--fuji-text-base)] font-semibold text-fuji-foreground">
            $172{" "}
            <span className="text-[length:var(--fuji-text-sm)] font-normal text-fuji-foreground-muted">
              / night
            </span>
          </span>
          <Button size="sm" tone="default">
            Book now
          </Button>
        </Card.Footer>
      </Card>
    </div>
  ),
};

export const ReadingProgress: Story = {
  name: "Full-bleed image + gradient overlay",
  render: () => (
    <div className="flex flex-wrap gap-6">
      <Card className="w-72">
        <Card.Media position="full">
          <Image src="https://picsum.photos/id/1039/640/800" alt="" ratio={3 / 4} />
          <Card.Overlay>
            <h3 className="m-0 text-[length:var(--fuji-text-md)] font-semibold text-white">Dune Messiah</h3>
            <p className="m-0 text-[length:var(--fuji-text-sm)] text-white/80">by Frank Herbert</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[length:var(--fuji-text-xs)] text-white/70">
              <div>
                <div className="text-[length:var(--fuji-text-sm)] font-semibold text-white">62%</div>
                Progress
              </div>
              <div>
                <div className="text-[length:var(--fuji-text-sm)] font-semibold text-white">25 min</div>
                Avg. session
              </div>
              <div>
                <div className="text-[length:var(--fuji-text-sm)] font-semibold text-white">213</div>
                Pages read
              </div>
            </div>
          </Card.Overlay>
          <div className="absolute top-3 right-3">
            <Button size="sm" tone="default">
              <Icon icon={Play} size="sm" />
              Resume
            </Button>
          </div>
        </Card.Media>
      </Card>
    </div>
  ),
};

export const ProfileCard: Story = {
  name: "Overlapping avatar + bottom overlay",
  render: () => (
    <div className="flex flex-wrap gap-6">
      <Card className="w-72">
        <Card.Media position="full">
          <Image src="https://picsum.photos/id/1015/640/800" alt="" ratio={3 / 4} />
          <div className="absolute top-3 right-3">
            <IconButton aria-label="Save profile" tone="default" appearance="contained" size="sm">
              <Bookmark className="size-4" />
            </IconButton>
          </div>
          <Card.Overlay className="items-start">
            <Avatar
              src="https://i.pravatar.cc/80?img=47"
              alt="Aiwanfo Faith"
              size="lg"
              className="-mt-14 mb-1 border-2 border-white"
            />
            <h3 className="m-0 text-[length:var(--fuji-text-md)] font-semibold text-white">Aiwanfo Faith</h3>
            <p className="m-0 text-[length:var(--fuji-text-sm)] text-white/80">
              Designing for clarity &amp; usability
            </p>
            <div className="mt-2 flex w-full items-center justify-between">
              <span className="flex items-center gap-1 text-[length:var(--fuji-text-xs)] text-white/80">
                <Icon icon={Star} size="sm" className="text-yellow-400" />
                4.6 rating · $44/hr
              </span>
              <Button size="sm" tone="default">
                Get in touch
              </Button>
            </div>
          </Card.Overlay>
        </Card.Media>
      </Card>
    </div>
  ),
};

export const PaymentCardComposition: Story = {
  name: "Freeform composition (payment card)",
  render: () => (
    <Card
      className="w-72 bg-gradient-to-br from-zinc-800 to-zinc-950 p-6 text-white shadow-fuji-overlay"
      style={{ borderColor: "transparent" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[length:var(--fuji-text-lg)] font-semibold tracking-tight">zero</span>
        <div className="h-6 w-8 rounded-[4px] bg-gradient-to-br from-zinc-300 to-zinc-500" />
      </div>
      <div className="mt-10 text-[length:var(--fuji-text-sm)] tracking-[0.2em] text-white/70">
        •••• •••• •••• 4242
      </div>
      <div className="mt-6 flex items-center justify-between text-[length:var(--fuji-text-xs)] text-white/60">
        <span>LINDA K ELIASEN</span>
        <span className="font-semibold text-white/80">VISA</span>
      </div>
    </Card>
  ),
};

export const VehicleDetails: Story = {
  name: "Vehicle details (hero, selector, stat tiles)",
  parameters: {
    docs: {
      description: {
        story:
          "A composed dashboard card: hero image, title and subtitle, a `SegmentedControl` for the gear selector, and two `Statistic` tiles in nested cards. Everything is stock components - no bespoke styling beyond layout utilities.",
      },
    },
  },
  render: () => (
    <Card className="relative w-full max-w-sm">
      <Card.Header>
        <Card.Title>Car details</Card.Title>
        <Card.Description>Jaguar I-Pace · 2023 release</Card.Description>
      </Card.Header>
      <IconButton aria-label="More options" size="sm" className="absolute top-4 right-4">
        <MoreHorizontal className="size-4" />
      </IconButton>
      {/* Media in flow (not the edge-to-edge `top` position): the reference
          keeps the photo inset inside the card with its own radius. */}
      <div className="mb-5 overflow-hidden rounded-fuji-control">
        <Image
          src="https://picsum.photos/id/111/800/450"
          alt="Vintage car, front three-quarter view"
          ratio={16 / 9}
        />
      </div>
      <Card.Content className="flex flex-col items-center gap-4 text-center">
        <div>
          <p className="m-0 text-[length:var(--fuji-text-xl)] font-semibold text-fuji-foreground">
            Jaguar I-Pace
          </p>
          <p className="m-0 text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
            2023 Release Jaguar Edition
          </p>
        </div>
        <SegmentedControl
          aria-label="Gear"
          defaultValue="n"
          options={[
            { label: "R", value: "r" },
            { label: "P", value: "p" },
            { label: "N", value: "n" },
            { label: "D", value: "d" },
            { label: "S", value: "s" },
          ]}
        />
        <div className="grid w-full grid-cols-2 gap-3 text-left">
          <Card className="gap-1 p-4">
            <Card.Title className="text-[length:var(--fuji-text-base)]">Station</Card.Title>
            <Link
              href="#station"
              tone="default"
              underline="hover"
              className="text-[length:var(--fuji-text-sm)]"
            >
              See location →
            </Link>
          </Card>
          <Card className="p-4">
            <Statistic label="Battery" value={503} suffix=" km" trend={12} trendLabel="left" />
          </Card>
        </div>
      </Card.Content>
    </Card>
  ),
};
