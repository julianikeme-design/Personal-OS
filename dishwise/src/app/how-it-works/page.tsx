import type { Metadata } from "next";
import { IconArrowRight, IconCheck, IconShield } from "@/components/icons";
import { ButtonLink, Card, PageTitle, SourceLegend, TopBar } from "@/components/ui";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  { n: "1", t: "Tell us what you like", d: "Dietary needs, favourite flavours, spice and budget. Under a minute, and every question is skippable." },
  { n: "2", t: "Share the menu", d: "Take a photo, upload a PDF or paste the text. You check what we read before anything else happens." },
  { n: "3", t: "Get three picks", d: "A Safe Pick, an Adventure Pick and a Value Pick, each with a plain-English explanation of why." },
  { n: "4", t: "Choose, then put your phone away", d: "Once you've chosen, Dishwise steps back so you can enjoy the food and the company." },
  { n: "5", t: "Remember it", d: "Afterwards, rate the dish in seconds. Your journal and Food Passport grow with every meal." },
];

const PROMISES = [
  "We only recommend dishes that are actually on the menu you gave us.",
  "We never invent prices, portion sizes, calories, ratings or popularity.",
  "We never say a dish is allergen-free or halal unless the menu says so, and even then we ask you to check.",
  "We never show AI-generated photos as if they were the restaurant's food.",
  "Every fact is labelled: from the menu, general food knowledge, AI interpretation or unknown.",
  "Your preferences and journal stay on your device. No account required.",
];

export default function HowItWorks() {
  return (
    <div className="fade-in">
      <TopBar back="/" />
      <PageTitle eyebrow="How it works" title="From “what is that?” to “that was great” in five steps." />

      <ol className="grid gap-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display font-semibold text-accent">{s.n}</span>
            <div>
              <div className="font-medium">{s.t}</div>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <Card className="mt-8 p-5">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <IconShield className="text-safe" /> Our honesty promises
        </div>
        <ul className="mt-4 grid gap-3">
          {PROMISES.map((p) => (
            <li key={p} className="flex gap-3 text-sm leading-relaxed">
              <IconCheck size={18} className="mt-0.5 shrink-0 text-safe" /> {p}
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">What the labels mean</div>
          <SourceLegend />
        </div>
      </Card>

      <p className="mt-6 text-sm leading-relaxed text-muted">
        Always tell restaurant staff about allergies or dietary requirements. Dishwise helps you understand a menu.
        It isn&apos;t a substitute for asking the kitchen.
      </p>

      <div className="mt-8">
        <ButtonLink href="/onboarding" size="lg" block>
          Get started <IconArrowRight size={18} />
        </ButtonLink>
      </div>
    </div>
  );
}
