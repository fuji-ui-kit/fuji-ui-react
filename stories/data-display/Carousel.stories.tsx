import type { Meta, StoryObj } from "@storybook/react";
import { Carousel } from "@fujiui/react";

interface Photo {
  id: number;
  caption: string;
}

// Lorem Picsum's numeric-ID endpoint is deterministic (the same ID always
// returns the same photo), unlike its random endpoint - stable enough for a
// story that should look the same on every reload.
const PHOTOS: Photo[] = [
  { id: 1015, caption: "River valley, Norway" },
  { id: 1018, caption: "Mountain lake at dawn" },
  { id: 1025, caption: "Trailhead, morning fog" },
  { id: 1039, caption: "Coastal cliffs" },
];

function Slide({ photo }: { photo: Photo }) {
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-fuji-panel border border-fuji-border bg-fuji-surface-subtle">
      <img
        src={`https://picsum.photos/id/${photo.id}/800/450`}
        alt={photo.caption}
        loading="lazy"
        className="block size-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="m-0 text-[length:var(--fuji-text-sm)] font-medium text-white">{photo.caption}</p>
      </div>
    </div>
  );
}

const meta = {
  title: "Data Display/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  args: {
    // Every story below supplies its own real slides via `render` - this
    // stub only exists to satisfy `children`'s required-prop type; it is
    // never actually rendered.
    children: null,
    "aria-label": "Featured destinations",
    autoplay: false,
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <Carousel {...args}>
        {PHOTOS.slice(0, 3).map((photo) => (
          <Slide key={photo.id} photo={photo} />
        ))}
      </Carousel>
    </div>
  ),
};

export const WithControls: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <Carousel {...args} controls>
        {PHOTOS.slice(0, 3).map((photo) => (
          <Slide key={photo.id} photo={photo} />
        ))}
      </Carousel>
    </div>
  ),
};

export const MultiplePerView: Story = {
  name: "Multiple cards per view",
  render: (args) => (
    <div className="w-full max-w-2xl">
      <Carousel {...args} controls slidesPerView={2}>
        {PHOTOS.map((photo) => (
          <Slide key={photo.id} photo={photo} />
        ))}
      </Carousel>
    </div>
  ),
};

export const Autoplay: Story = {
  render: (args) => (
    <div className="w-full max-w-md">
      <Carousel {...args} autoplay autoplayInterval={2000}>
        {PHOTOS.slice(0, 3).map((photo) => (
          <Slide key={photo.id} photo={photo} />
        ))}
      </Carousel>
    </div>
  ),
};

export const Continuous: Story = {
  name: "Continuous marquee",
  render: (args) => (
    <div className="w-full max-w-2xl">
      <Carousel {...args} continuous slidesPerView={2}>
        {PHOTOS.map((photo) => (
          <Slide key={photo.id} photo={photo} />
        ))}
      </Carousel>
    </div>
  ),
};

const COVERFLOW_PHOTOS: Photo[] = [
  ...PHOTOS,
  { id: 1043, caption: "Harbour at dusk" },
  { id: 1050, caption: "Alpine meadow" },
  { id: 1062, caption: "Desert road" },
];

function CoverflowSlide({ photo }: { photo: Photo }) {
  return (
    <div className="mx-auto aspect-square w-full overflow-hidden rounded-[12px] shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
      <img
        src={`https://picsum.photos/id/${photo.id}/600/600`}
        alt={photo.caption}
        draggable={false}
        className="block size-full object-cover"
      />
    </div>
  );
}

export const Coverflow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`effect=\"coverflow\"` ports motion.dev's coverflow carousel: drag the fan and it follows the pointer continuously - neighbours rotate to 20°, shrink to 70% and tuck under each other by distance, and the edges fade out - then snaps to the nearest slide on release. Arrow keys, loop and controls work as in the default preset; `slidesPerView` sets the centre slide's width (default 1.6).",
      },
    },
  },
  render: (args) => (
    <Carousel {...args} effect="coverflow" controls className="mx-auto w-full max-w-xl">
      {COVERFLOW_PHOTOS.map((photo) => (
        <CoverflowSlide key={photo.id} photo={photo} />
      ))}
    </Carousel>
  ),
};

export const CoverflowSlidesPerView: Story = {
  name: "Coverflow with slidesPerView",
  render: (args) => (
    <Carousel
      {...args}
      effect="coverflow"
      controls
      slidesPerView={{ base: 1.4, md: 2.5 }}
      className="mx-auto w-full max-w-3xl"
    >
      {COVERFLOW_PHOTOS.map((photo) => (
        <CoverflowSlide key={photo.id} photo={photo} />
      ))}
    </Carousel>
  ),
};
