import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "@fujiui/react";

const meta = {
  title: "Data Display/Timeline",
  component: Timeline,
  tags: ["autodocs"],
  args: {
    items: [
      { title: "Order placed", description: "Order ORD-1042 was created.", timestamp: "Jan 4, 9:12 AM" },
      {
        title: "Payment confirmed",
        description: "Charge of $128.00 succeeded.",
        timestamp: "Jan 4, 9:13 AM",
        variant: "success",
      },
      {
        title: "Shipment delayed",
        description: "Carrier reported a weather delay.",
        timestamp: "Jan 5, 4:47 PM",
        variant: "warning",
      },
      {
        title: "Delivered",
        description: "Package left at front door.",
        timestamp: "Jan 7, 2:05 PM",
        variant: "success",
      },
    ],
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFailure: Story = {
  name: "With a failed step",
  args: {
    items: [
      { title: "Deployment started", timestamp: "10:02 AM" },
      { title: "Build succeeded", timestamp: "10:04 AM", variant: "success" },
      {
        title: "Health check failed",
        description: "3 of 5 instances did not respond.",
        timestamp: "10:06 AM",
        variant: "danger",
      },
    ],
  },
};

export const RightLayout: Story = {
  name: 'Right layout ("right")',
  render: (args) => (
    <div className="w-full max-w-md">
      <Timeline {...args} layout="right" />
    </div>
  ),
};

export const AlternatingLayout: Story = {
  name: 'Alternating layout ("alternating")',
  render: (args) => (
    <div className="w-full max-w-2xl">
      <Timeline {...args} layout="alternating" />
    </div>
  ),
};

function HistoryMedia({ id, date, caption }: { id: number; date: string; caption: string }) {
  return (
    <figure className="m-0 flex w-full max-w-[14rem] flex-col gap-2">
      <img
        src={`https://picsum.photos/id/${id}/448/280`}
        alt=""
        width={224}
        height={140}
        className="block w-full rounded-fuji-panel object-cover"
      />
      <figcaption className="text-[length:var(--fuji-text-xs)] leading-snug text-fuji-foreground-subtle">
        <span className="block">{date}</span>
        {caption}
      </figcaption>
    </figure>
  );
}

/**
 * `groups` turns the timeline into a history page: each group's label sits
 * on a centred axis with a dot beneath it, media (an image with its
 * caption) on the left, and the group's dated entries listed on the right.
 * Below the `sm` breakpoint it collapses to a single column.
 */
export const History: Story = {
  name: "History (grouped by year)",
  render: () => (
    <div className="w-full max-w-3xl">
      <Timeline
        groups={[
          {
            label: "2017",
            media: (
              <HistoryMedia id={1076} date="2017.03" caption="Third line of the coating plant comes online" />
            ),
            items: [
              { timestamp: "06", title: "Second phase of the Jeonju plant completed" },
              {
                timestamp: "02",
                title: "Sealant and paint ranges certified to the new environmental standard",
              },
            ],
          },
          {
            label: "2016",
            media: (
              <HistoryMedia id={1048} date="2016.11" caption="Law firm of the year, ALB Korea Law Awards" />
            ),
            items: [
              { timestamp: "12", title: "Window systems named product of the year" },
              {
                timestamp: "11",
                title: "Insulation and sealant lines ranked first for customer satisfaction",
              },
              { timestamp: "09", title: "Most trusted brand, consumer survey" },
              { timestamp: "06", title: "Corporate website relaunched" },
              { timestamp: "03", title: "Automotive coatings named top brand in the sector" },
              { timestamp: "01", title: "Cleaning and hygiene business launched" },
            ],
          },
          {
            label: "2015",
            media: (
              <HistoryMedia
                id={1031}
                date="2015.04"
                caption="Seventh and eighth furnaces fired at the Yeoju plant"
              />
            ),
            items: [
              { timestamp: "12", title: "Window systems named product of the year" },
              { timestamp: "10", title: "Certified to the new national standard for insulation" },
              {
                timestamp: "09",
                title: "Insulation and sealant lines ranked first for customer satisfaction",
              },
              { timestamp: "07", title: "Dedicated customer centre opened" },
              { timestamp: "04", title: "Seventh and eighth furnaces fired at the Yeoju plant" },
            ],
          },
        ]}
      />
    </div>
  ),
};

export const GroupedWithWideTimestamps: Story = {
  name: "Grouped, with dates and times as timestamps",
  render: () => (
    <div className="w-full max-w-3xl">
      <Timeline
        groups={[
          {
            label: "This week",
            items: [
              { timestamp: "Sep 14", title: "Glass material shipped" },
              { timestamp: "9:41 AM", title: "Release candidate tagged" },
              { title: "Changelog drafted (no timestamp, still aligned)" },
            ],
          },
          {
            label: "Last week",
            items: [
              { timestamp: "Sep 7", title: "Design review" },
              { timestamp: "Sep 2", title: "Kickoff" },
            ],
          },
        ]}
      />
    </div>
  ),
};
