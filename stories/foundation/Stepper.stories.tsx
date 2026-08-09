import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { User, FileText, CheckCircle2, PartyPopper } from "lucide-react";
import { Stepper, type StepperStep } from "@fujiui/react";

const STEPS: StepperStep[] = [
  { label: "Account", description: "Create your login" },
  { label: "Profile", description: "Tell us about you" },
  { label: "Review", description: "Confirm details" },
  { label: "Done" },
];

const ICON_STEPS: StepperStep[] = [
  { label: "Account", description: "Create your login", icon: <User className="size-4" /> },
  { label: "Profile", description: "Tell us about you", icon: <FileText className="size-4" /> },
  { label: "Review", description: "Confirm details", icon: <CheckCircle2 className="size-4" /> },
  { label: "Done", icon: <PartyPopper className="size-4" /> },
];

const meta = {
  title: "Foundation/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  args: {
    steps: STEPS,
    activeStep: 1,
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "earth", "forest", "sun", "fire", "water"],
    },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FirstStep: Story = {
  args: { activeStep: 0 },
};

export const LastStep: Story = {
  args: { activeStep: STEPS.length - 1 },
};

function ClickableStepper() {
  const [active, setActive] = React.useState(1);
  return <Stepper steps={STEPS} activeStep={active} onStepClick={setActive} />;
}

export const Clickable: Story = {
  render: () => <ClickableStepper />,
};

export const CustomIcons: Story = {
  name: "Custom step icons",
  args: { steps: ICON_STEPS },
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["default", "earth", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Stepper key={tone} steps={STEPS} activeStep={1} tone={tone} />
      ))}
    </div>
  ),
};
