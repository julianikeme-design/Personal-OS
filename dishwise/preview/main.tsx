import { createRoot } from "react-dom/client";
import { installPreviewApi } from "./api";
import { Router } from "./router";
import { AppShell } from "@/components/AppShell";
import Home from "@/app/page";
import HowItWorks from "@/app/how-it-works/page";
import Onboarding from "@/app/onboarding/page";
import Scan from "@/app/scan/page";
import Review from "@/app/scan/review/page";
import Picks from "@/app/scan/picks/page";
import Dish from "@/app/scan/dish/[id]/page";
import Enjoy from "@/app/enjoy/page";
import Feedback from "@/app/feedback/page";
import Journal from "@/app/journal/page";
import Passport from "@/app/passport/page";
import Profile from "@/app/profile/page";
import Founder from "@/app/founder/page";

(window as unknown as { __DW_PREVIEW__: boolean }).__DW_PREVIEW__ = true;
installPreviewApi();

const routes = [
  { pattern: "/", Component: Home },
  { pattern: "/how-it-works", Component: HowItWorks },
  { pattern: "/onboarding", Component: Onboarding },
  { pattern: "/scan", Component: Scan },
  { pattern: "/scan/review", Component: Review },
  { pattern: "/scan/picks", Component: Picks },
  { pattern: "/scan/dish/:id", Component: Dish },
  { pattern: "/enjoy", Component: Enjoy },
  { pattern: "/feedback", Component: Feedback },
  { pattern: "/journal", Component: Journal },
  { pattern: "/passport", Component: Passport },
  { pattern: "/profile", Component: Profile },
  { pattern: "/founder", Component: Founder },
];

createRoot(document.getElementById("root")!).render(<Router routes={routes} Shell={AppShell} />);
