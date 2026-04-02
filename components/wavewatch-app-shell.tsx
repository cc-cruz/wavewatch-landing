"use client";

import * as React from "react";
import {
  findNearestMarineRegion,
  getDefaultMarineRegion,
  getMarineRegionById,
  resolveMarinePromptSet,
  type MarineRegion,
} from "@/lib/marine-regions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  Bookmark,
  ChevronDown,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  Globe,
  Hash,
  Inbox,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MessageSquareText,
  MessagesSquare,
  MoreHorizontal,
  PhoneCall,
  Pin,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ModuleId =
  | "console"
  | "briefings"
  | "automation"
  | "delivery"
  | "stack";

type NavItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  badge?: string;
  active?: boolean;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

type NavModule = {
  id: ModuleId;
  label: string;
  icon: NavItem["icon"];
  sections: NavSection[];
};

type MarineResponse = {
  summary: string;
  window: string;
  risk: string;
  why: string;
  confidence: string;
};

type LocationSource =
  | "browser"
  | "cache"
  | "server-header"
  | "server-ip"
  | "default";

type LocationApiResponse = {
  source: Exclude<LocationSource, "browser">;
  regionId: string;
  regionLabel: string;
  prompts: string[];
  city: string | null;
  region: string | null;
  country: string | null;
  distanceKm: number | null;
};

type CachedRegion = {
  id: string;
  source: LocationSource;
  resolvedAt: number;
};

type ConversationEntry = {
  id: string;
  role: "assistant" | "user" | "system";
  body: string;
  meta: string;
  response?: MarineResponse;
};

type MetricItem = {
  label: string;
  value: string;
  detail: string;
};

type QueueItem = {
  id: string;
  title: string;
  time: string;
  detail: string;
  status: string;
};

type ActivityItem = {
  id: string;
  icon: NavItem["icon"];
  title: string;
  detail: string;
  time: string;
};

type DeliveryRow = {
  id: string;
  name: string;
  window: string;
  status: string;
  progress: number;
  segments: number[];
};

type SettingsCard = {
  eyebrow: string;
  title: string;
  detail: string;
  items: string[];
};

const regionStorageKey = "wavewatch-agent-region";
const regionCacheTtlMs = 1000 * 60 * 60 * 12;
const numberFormatter = new Intl.NumberFormat("en-US");

function getItemKey(moduleId: ModuleId, item: NavItem) {
  return `${moduleId}:${item.label}`;
}

function getDefaultItemKey(module: NavModule) {
  const items = module.sections.flatMap((section) => section.items);
  const activeItem = items.find((item) => item.active) ?? items[0];
  return activeItem ? getItemKey(module.id, activeItem) : `${module.id}:`;
}

function getActiveItemLabel(module: NavModule, activeItemKey: string) {
  const items = module.sections.flatMap((section) => section.items);
  const match = items.find(
    (item) => getItemKey(module.id, item) === activeItemKey,
  );
  return match?.label ?? module.sections[0]?.items[0]?.label ?? module.label;
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "WW"
  );
}

function getLocationSourcePriority(source: LocationSource) {
  switch (source) {
    case "browser":
      return 4;
    case "server-header":
      return 3;
    case "cache":
      return 2;
    case "server-ip":
      return 1;
    case "default":
    default:
      return 0;
  }
}

function getLocationSourceLabel(source: LocationSource) {
  switch (source) {
    case "browser":
      return "Exact device location";
    case "cache":
      return "Cached coastline profile";
    case "server-header":
      return "Header-based region match";
    case "server-ip":
      return "IP-based fallback";
    case "default":
    default:
      return "Default regional profile";
  }
}

function buildFallbackResponse(
  summary: string,
  why = "Pickaxe API request failed.",
): MarineResponse {
  return {
    summary,
    window: "Unavailable",
    risk: "Unavailable",
    why,
    confidence: "Unknown",
  };
}

function buildSeedConversation(region: MarineRegion): ConversationEntry[] {
  return [
    {
      id: "seed-system",
      role: "system",
      body:
        "This console configures a forward-facing forecast agent that lives outside the web app. The web layer manages user context, cron timing, delivery rails, and operator overrides.",
      meta: "OpenClaw runtime · Sendblue relay · audit trail enabled",
    },
    {
      id: "seed-assistant",
      role: "assistant",
      body: `I am currently scoped to ${region.label}. Ask for a surf, fishing, diving, or boating window, or tune the cron cadence from the automation tabs.`,
      meta: `${region.label} profile loaded`,
    },
  ];
}

const loadingMessages = [
  "reading the swell picture",
  "comparing tide windows",
  "checking when the wind turns",
  "looking for the fishable gap",
  "building the go or no-go call",
];

const mixBase = "var(--background)";

const palette = {
  primary: "var(--primary)",
  secondary: {
    light: `color-mix(in oklch, var(--primary) 68%, ${mixBase})`,
    dark: `color-mix(in oklch, var(--primary) 82%, ${mixBase})`,
  },
  tertiary: {
    light: `color-mix(in oklch, var(--chart-2) 70%, ${mixBase})`,
    dark: `color-mix(in oklch, var(--chart-2) 82%, ${mixBase})`,
  },
  quaternary: {
    light: `color-mix(in oklch, var(--chart-3) 66%, ${mixBase})`,
    dark: `color-mix(in oklch, var(--chart-3) 78%, ${mixBase})`,
  },
};

const sendVolumeConfig = {
  automated: { label: "Automated", color: palette.primary },
  replies: { label: "Replies", theme: palette.secondary },
  escalated: { label: "Escalated", theme: palette.tertiary },
} satisfies ChartConfig;

const confidenceConfig = {
  surf: { label: "Surf", color: palette.primary },
  fishing: { label: "Fishing", theme: palette.secondary },
  boating: { label: "Boating", theme: palette.quaternary },
} satisfies ChartConfig;

const deliveryMixConfig = {
  delivered: { label: "Delivered", color: palette.primary },
  read: { label: "Read", theme: palette.secondary },
  failed: { label: "Failed", theme: palette.tertiary },
} satisfies ChartConfig;

const navModules: NavModule[] = [
  {
    id: "console",
    label: "Console",
    icon: MessagesSquare,
    sections: [
      {
        title: "Live",
        items: [
          { label: "Operator thread", icon: Inbox, href: "#", active: true },
          { label: "Unread replies", icon: Bell, href: "#", badge: "7" },
          { label: "Saved prompts", icon: Bookmark, href: "#" },
          { label: "Escalations", icon: Pin, href: "#", badge: "2" },
        ],
      },
      {
        title: "Context",
        items: [
          { label: "Forecast history", icon: FileText, href: "#" },
          { label: "User profile", icon: User, href: "#" },
        ],
      },
    ],
  },
  {
    id: "briefings",
    label: "Briefings",
    icon: LayoutDashboard,
    sections: [
      {
        title: "Daily",
        items: [
          { label: "Dawn patrol", icon: Clock, href: "#", active: true },
          { label: "Weekend outlook", icon: Sparkles, href: "#" },
          { label: "Regional digest", icon: Globe, href: "#" },
        ],
      },
      {
        title: "Hand-off",
        items: [
          { label: "Client wrap", icon: MessageSquareText, href: "#" },
          { label: "Crew note", icon: Users, href: "#" },
        ],
      },
    ],
  },
  {
    id: "automation",
    label: "Automation",
    icon: ClipboardList,
    sections: [
      {
        title: "Schedules",
        items: [
          { label: "Scheduled sends", icon: Clock, href: "#", active: true },
          { label: "Trigger rules", icon: Sparkles, href: "#" },
          { label: "Quiet hours", icon: Bell, href: "#" },
        ],
      },
      {
        title: "Fallbacks",
        items: [
          { label: "Fallback routing", icon: RotateCcw, href: "#" },
          { label: "Escalation ladder", icon: Users, href: "#" },
        ],
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: PhoneCall,
    sections: [
      {
        title: "Number",
        items: [
          { label: "Number health", icon: PhoneCall, href: "#", active: true },
          { label: "Failures", icon: Bell, href: "#", badge: "3" },
          { label: "Opt-outs", icon: Users, href: "#" },
        ],
      },
      {
        title: "Audit",
        items: [
          { label: "Send log", icon: FileText, href: "#" },
          { label: "Replay queue", icon: RotateCcw, href: "#" },
        ],
      },
    ],
  },
  {
    id: "stack",
    label: "Stack",
    icon: Layers,
    sections: [
      {
        title: "Identity",
        items: [
          { label: "Brand voice", icon: Hash, href: "#", active: true },
          { label: "Data sources", icon: Globe, href: "#" },
          { label: "Policies", icon: Settings, href: "#" },
        ],
      },
      {
        title: "Runtime",
        items: [
          { label: "Sandbox", icon: Layers, href: "#" },
          { label: "Webhook map", icon: Sparkles, href: "#" },
        ],
      },
    ],
  },
];

const utilities: NavItem[] = [
  { label: "Notifications", icon: Bell, href: "#" },
  { label: "Stack settings", icon: Settings, href: "#" },
];

const shellUser = {
  name: "Maya Torres",
  email: "maya@wavewatch.app",
  avatar: "/placeholder-user.jpg",
};

const moduleDescriptions: Record<ModuleId, string> = {
  console:
    "Talk to the user-facing agent, review live replies, and tune the tone before the next cron lands.",
  briefings:
    "Measure how the forecast stack is performing across daily windows, read rates, and regional coverage.",
  automation:
    "Control schedules, trigger logic, quiet hours, and escalation moments without touching the underlying runtime.",
  delivery:
    "Watch the Sendblue number, delivery failures, opt-outs, and the audit trail for each outbound forecast.",
  stack:
    "Define brand voice, source blending, policy boundaries, and how the web layer talks to the deployed OpenClaw instance.",
};

const sendQueue: QueueItem[] = [
  {
    id: "run-1",
    title: "Dawn patrol heads-up",
    time: "Tomorrow · 5:15 AM",
    detail: "Pacifica + Ocean Beach surfers",
    status: "Queued",
  },
  {
    id: "run-2",
    title: "Harbor bar crossing watch",
    time: "Tomorrow · 6:40 AM",
    detail: "Bodega boating list",
    status: "Draft",
  },
  {
    id: "run-3",
    title: "Weekend fishing brief",
    time: "Fri · 4:30 PM",
    detail: "Farallon charter crew",
    status: "Queued",
  },
];

const playbooks = [
  {
    title: "Dawn patrol mode",
    detail: "Lead with tide turn, wind switch, and confidence cutoff before sunrise.",
  },
  {
    title: "Fuel-worth-it filter",
    detail: "Block sends when bar conditions or cleanup probability drop below threshold.",
  },
  {
    title: "Storm alert escalator",
    detail: "Escalate to manual review when surf hazard or lightning enters the send window.",
  },
];

const sendVolumeData = [
  { day: "Mon", automated: 22, replies: 11, escalated: 2 },
  { day: "Tue", automated: 28, replies: 14, escalated: 1 },
  { day: "Wed", automated: 26, replies: 16, escalated: 3 },
  { day: "Thu", automated: 32, replies: 19, escalated: 2 },
  { day: "Fri", automated: 36, replies: 18, escalated: 4 },
  { day: "Sat", automated: 18, replies: 9, escalated: 1 },
  { day: "Sun", automated: 14, replies: 6, escalated: 1 },
];

const confidenceData = [
  { slot: "5a", surf: 72, fishing: 64, boating: 58 },
  { slot: "7a", surf: 81, fishing: 69, boating: 62 },
  { slot: "9a", surf: 76, fishing: 73, boating: 67 },
  { slot: "11a", surf: 68, fishing: 79, boating: 74 },
  { slot: "1p", surf: 60, fishing: 71, boating: 78 },
  { slot: "3p", surf: 52, fishing: 66, boating: 72 },
];

const deliveryMixData = [
  { label: "Mon", delivered: 91, read: 72, failed: 4 },
  { label: "Tue", delivered: 94, read: 75, failed: 3 },
  { label: "Wed", delivered: 88, read: 68, failed: 5 },
  { label: "Thu", delivered: 96, read: 77, failed: 2 },
  { label: "Fri", delivered: 93, read: 74, failed: 3 },
  { label: "Sat", delivered: 90, read: 66, failed: 4 },
];

const deliveryRows: DeliveryRow[] = [
  {
    id: "delivery-1",
    name: "Pacifica dawn crew",
    window: "Apr 1 · 5:15 AM",
    status: "Delivered",
    progress: 98,
    segments: [1, 0.9, 0.8, 1, 0.7, 0.9, 0.8, 1, 0.9, 0.8, 0.7, 1],
  },
  {
    id: "delivery-2",
    name: "Bodega harbor list",
    window: "Apr 1 · 6:40 AM",
    status: "Retrying",
    progress: 72,
    segments: [1, 0.8, 0.9, 0.8, 0.7, 1, 0.8, 0.6, 0.2, 0.1, 0.1, 0.1],
  },
  {
    id: "delivery-3",
    name: "Weekend anglers",
    window: "Mar 31 · 4:30 PM",
    status: "Delivered",
    progress: 100,
    segments: [1, 0.8, 0.9, 1, 0.8, 0.9, 1, 0.8, 0.9, 1, 0.8, 0.9],
  },
  {
    id: "delivery-4",
    name: "Monterey dive club",
    window: "Mar 31 · 7:10 PM",
    status: "Escalated",
    progress: 54,
    segments: [0.9, 0.8, 0.7, 0.9, 0.8, 0.7, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1],
  },
  {
    id: "delivery-5",
    name: "Storm alert beta",
    window: "Mar 31 · 8:02 PM",
    status: "Delivered",
    progress: 96,
    segments: [1, 0.9, 0.8, 1, 0.9, 0.8, 1, 0.7, 0.9, 1, 0.6, 0.4],
  },
];

const automationCards = [
  {
    name: "Morning first light",
    detail:
      "Sends a concise go-or-no-go briefing at 5:15 AM local time when confidence is above 70.",
    schedule: "Daily · 5:15 AM",
    audience: "Surfers / 42 contacts",
    status: "Live",
  },
  {
    name: "Bar crossing warning",
    detail:
      "Waits for wind-against-tide or breaking bar language before sending to boating subscribers.",
    schedule: "Conditional",
    audience: "Boaters / 18 contacts",
    status: "Guarded",
  },
  {
    name: "Weekend fuel check",
    detail:
      "Packages fishing viability, fuel-worth-it logic, and return window into a Friday planning message.",
    schedule: "Fri · 4:30 PM",
    audience: "Charter crew / 9 contacts",
    status: "Live",
  },
  {
    name: "Storm mode escalation",
    detail:
      "Hands off to a human operator when hazard language triggers or model spread exceeds policy.",
    schedule: "Event-based",
    audience: "All subscribed lists",
    status: "Manual review",
  },
];

const workflowSteps = [
  {
    title: "Ingest forecast stack",
    detail: "NOAA, tide tables, wind models, and regional spot context are pulled before each run.",
  },
  {
    title: "Score the decision window",
    detail: "The runtime maps each time block against activity-specific thresholds and uncertainty rules.",
  },
  {
    title: "Compose the outbound brief",
    detail: "Messages are shaped for SMS or iMessage length, preserving the strongest recommendation first.",
  },
  {
    title: "Deliver or escalate",
    detail: "Sendblue handles transport, while flagged runs route back to the operator thread for approval.",
  },
];

const interventionMoments = [
  "Escalate when surf hazard, lightning, or bar-crossing language appears inside the send window.",
  "Suppress a send when conditions are too marginal to be useful and would create forecast fatigue.",
  "Replay the previous approved briefing if the upstream model feed is delayed but the risk posture is unchanged.",
];

const activityFeed: ActivityItem[] = [
  {
    id: "activity-1",
    icon: MessageSquare,
    title: "Forecast reply received",
    detail: "Maya asked whether the cleanup holds through lunch.",
    time: "2m",
  },
  {
    id: "activity-2",
    icon: Sparkles,
    title: "Automation updated",
    detail: "Quiet hours now end at 5:00 AM for the dawn list.",
    time: "18m",
  },
  {
    id: "activity-3",
    icon: PhoneCall,
    title: "Number stayed healthy",
    detail: "Last 24h delivery success held above 98%.",
    time: "39m",
  },
  {
    id: "activity-4",
    icon: RotateCcw,
    title: "Retry completed",
    detail: "Bodega harbor list replayed after carrier lag cleared.",
    time: "1h",
  },
];

const settingsCards: SettingsCard[] = [
  {
    eyebrow: "Brand voice",
    title: "Forward-facing identity",
    detail:
      "The user sees a clean forecast assistant, not the underlying runtime. Keep the web layer responsible for tone, escalation, and disclosure.",
    items: [
      "Present one stable phone identity with a consistent signature and opt-out language.",
      "Expose why, window, and confidence every time so the user can judge the call.",
      "Separate operator notes from user-facing copy to avoid leaking raw chain-of-thought.",
    ],
  },
  {
    eyebrow: "Intelligence layer",
    title: "Source blending",
    detail:
      "This product only works if the forecast feels grounded. The app layer should disclose source families even when the runtime reasons across them.",
    items: [
      "Blend buoy, tide, wind, and weather inputs before prompt assembly.",
      "Store user spot preferences at the app layer so cron runs stay personalized.",
      "Log which source families shaped each message for audit and debugging.",
    ],
  },
  {
    eyebrow: "Policy",
    title: "Safety boundaries",
    detail:
      "The agent should support judgment, not replace seamanship. The console is where those boundaries are configured.",
    items: [
      "Require explicit hazard language whenever conditions cross high-risk thresholds.",
      "Escalate to human review when forecast spread exceeds the confidence policy.",
      "Keep quiet hours and opt-out compliance outside the runtime prompt where possible.",
    ],
  },
  {
    eyebrow: "Runtime",
    title: "OpenClaw orchestration",
    detail:
      "The app layer should treat the deployed sandbox as a worker: trigger it, audit it, and recover from it without making the user think about infrastructure.",
    items: [
      "Store cron definitions, webhook destinations, and user tokens in the app layer.",
      "Track each run with a deterministic execution id so replies can be tied back to a send.",
      "Expose replay controls for operators without redeploying the runtime.",
    ],
  },
];

interface ShellBreadcrumbProps {
  className?: string;
  moduleLabel: string;
  itemLabel: string;
}

function ShellBreadcrumb({
  className,
  moduleLabel,
  itemLabel,
}: ShellBreadcrumbProps) {
  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="#">{moduleLabel}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{itemLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function SectionFrame({
  eyebrow,
  title,
  description,
  className,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border/70 bg-card/75 p-5 shadow-lg shadow-black/10 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricGrid({ items }: { items: MetricItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border/60 bg-background/40 p-4"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {item.value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

function ConversationMessage({ entry }: { entry: ConversationEntry }) {
  if (entry.role === "system") {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 px-4 py-3 text-sm text-muted-foreground">
        <p>{entry.body}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em]">
          {entry.meta}
        </p>
      </div>
    );
  }

  const isUser = entry.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-3xl border p-4",
          isUser
            ? "border-primary/70 bg-primary text-primary-foreground"
            : "border-border/70 bg-background/60 text-foreground",
        )}
      >
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
          <span className={isUser ? "text-primary-foreground/75" : "text-muted-foreground"}>
            {isUser ? "User prompt" : "WaveWatch agent"}
          </span>
          <span className={isUser ? "text-primary-foreground/55" : "text-muted-foreground/60"}>
            {entry.meta}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6">{entry.body}</p>
        {entry.response ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Best window
              </p>
              <p className="mt-2 font-medium">{entry.response.window}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Confidence
              </p>
              <p className="mt-2 font-medium">{entry.response.confidence}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Primary risk
              </p>
              <p className="mt-2 text-sm">{entry.response.risk}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Why
              </p>
              <p className="mt-2 text-sm">{entry.response.why}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface ModulePanelProps {
  className?: string;
  module: NavModule;
  activeItemKey: string;
  onSelectItem: (key: string) => void;
}

function ModulePanel({
  className,
  module,
  activeItemKey,
  onSelectItem,
}: ModulePanelProps) {
  return (
    <div className={cn("space-y-5 px-4 py-4 text-sm", className)}>
      {module.sections.map((section, index) => (
        <div className="space-y-2" key={section.title ?? index}>
          {section.title ? (
            <SidebarGroupLabel className="px-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {section.title}
            </SidebarGroupLabel>
          ) : null}
          <SidebarMenu>
            {section.items.map((item) => {
              const Icon = item.icon;
              const itemKey = getItemKey(module.id, item);
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={itemKey === activeItemKey}
                    className="rounded-xl px-3 py-5"
                  >
                    <a
                      href={item.href}
                      onClick={(event) => {
                        event.preventDefault();
                        onSelectItem(itemKey);
                      }}
                    >
                      <Icon className="size-4" />
                      {item.badge ? (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      ) : null}
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      ))}

      <div className="border-t border-border/70 pt-4">
        <SidebarGroupLabel className="px-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Utilities
        </SidebarGroupLabel>
        <SidebarMenu className="mt-2">
          {utilities.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton className="rounded-xl px-3 text-muted-foreground hover:text-foreground">
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </div>
    </div>
  );
}

interface AppSidebarProps
  extends Omit<React.ComponentProps<typeof Sidebar>, "className"> {
  className?: string;
  activeKey: ModuleId;
  activeItemKey: string;
  onNavChange: (key: ModuleId) => void;
  onItemChange: (key: string) => void;
}

function AppSidebar({
  className,
  activeKey,
  activeItemKey,
  onNavChange,
  onItemChange,
  ...props
}: AppSidebarProps) {
  const { state, isMobile, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";
  const showFooter = isCollapsed || isMobile;
  const activeModule =
    navModules.find((module) => module.id === activeKey) ?? navModules[0];

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "overflow-hidden *:data-[sidebar=sidebar]:flex-row",
        className,
      )}
      {...props}
    >
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r border-border/70 bg-sidebar/80 backdrop-blur"
      >
        <SidebarHeader className="flex h-16 items-center justify-center border-b border-border/70 px-2">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background/40">
            <img
              src="/wavewatch-logo-light.png"
              alt="WaveWatch"
              className="size-7 object-contain"
            />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <SidebarMenuItem key={module.id}>
                      <SidebarMenuButton
                        tooltip={module.label}
                        onClick={() => {
                          onNavChange(module.id);
                          setOpen(true);
                        }}
                        isActive={activeKey === module.id}
                        aria-label={module.label}
                        className="mx-1 mt-1 rounded-xl px-2.5 md:px-2"
                      >
                        <Icon className="size-4" />
                        <span>{module.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className={cn(showFooter ? "flex" : "hidden")}>
          <SidebarGroup className="p-0">
            <SidebarGroupContent className="px-1.5 pb-2 md:px-0">
              <SidebarMenu>
                {utilities.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        className="mx-1 rounded-xl px-2.5 md:px-2"
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>

      <Sidebar
        collapsible="none"
        className="hidden flex-1 border-r border-border/70 bg-sidebar/65 md:flex"
      >
        <SidebarHeader className="flex h-16 items-center justify-between border-b border-border/70 px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto items-center gap-2 p-0 hover:bg-transparent"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold tracking-tight">
                    WaveWatch Console
                  </p>
                  <p className="text-xs text-muted-foreground">
                    openclaw-prod / sendblue-relay-01
                  </p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-2xl">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>Swap runtime</DropdownMenuItem>
                <DropdownMenuItem>Webhook config</DropdownMenuItem>
                <DropdownMenuItem>Prompt policy</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SidebarTrigger className="rounded-xl" />
        </SidebarHeader>

        <SidebarContent className="overflow-hidden">
          <ScrollArea className="min-h-0 flex-1">
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                <ModulePanel
                  module={activeModule}
                  activeItemKey={activeItemKey}
                  onSelectItem={onItemChange}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}

function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string };
}) {
  const { isMobile } = useSidebar();
  const initials = getInitials(user.name);

  return (
    <SidebarMenu className="w-full">
      <SidebarMenuItem className="w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-12 w-full rounded-2xl data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="size-9 rounded-2xl">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="start"
            className="min-w-56 rounded-2xl"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="size-9 rounded-2xl">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid leading-tight">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 size-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 size-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 size-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function RightPanelContent({
  activeRegion,
  locationSource,
}: {
  activeRegion: MarineRegion;
  locationSource: LocationSource;
}) {
  return (
    <div className="space-y-6 p-4">
      <section className="rounded-3xl border border-border/70 bg-card/75 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 rounded-2xl">
            <AvatarImage src={shellUser.avatar} alt={shellUser.name} />
            <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground">
              {getInitials(shellUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{shellUser.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              Premium user · iMessage relay attached
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Active region</span>
            <span className="font-medium">{activeRegion.label}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Location mode</span>
            <span className="font-medium">{getLocationSourceLabel(locationSource)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Primary surf spot</span>
            <span className="font-medium">{activeRegion.spots.surf.label}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Primary fishing spot</span>
            <span className="font-medium">{activeRegion.spots.fishing.label}</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SidebarGroupLabel className="px-0 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Runtime
          </SidebarGroupLabel>
          <Badge variant="secondary" className="rounded-full">
            Healthy
          </Badge>
        </div>
        <div className="space-y-3">
          {[
            {
              title: "Transport",
              value: "+1 (415) 555-0199",
              detail: "Sendblue relay · iMessage enabled",
            },
            {
              title: "OpenClaw sandbox",
              value: "openclaw-prod-usw",
              detail: "Webhook healthy · cron worker live",
            },
            {
              title: "Policy surface",
              value: "Quiet hours + manual escalation",
              detail: "Configured in web layer",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border/60 bg-background/35 p-4"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {item.title}
              </p>
              <p className="mt-2 font-medium">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SidebarGroupLabel className="px-0 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Next sends
          </SidebarGroupLabel>
          <Button variant="ghost" size="sm" className="h-7 rounded-full px-2">
            View all
          </Button>
        </div>
        <div className="space-y-2">
          {sendQueue.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border/60 bg-background/35 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.time}
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {item.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SidebarGroupLabel className="px-0 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Activity
        </SidebarGroupLabel>
        <div className="space-y-2">
          {activityFeed.map((event) => {
            const Icon = event.icon;
            return (
              <div
                key={event.id}
                className="flex gap-3 rounded-2xl border border-border/60 bg-background/35 p-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent/35">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {event.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SidebarRight({
  activeRegion,
  locationSource,
}: {
  activeRegion: MarineRegion;
  locationSource: LocationSource;
}) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l border-border/70 bg-sidebar/55 lg:flex"
    >
      <SidebarHeader className="flex h-16 items-center border-b border-border/70 px-3">
        <NavUser user={shellUser} />
      </SidebarHeader>
      <SidebarContent className="p-0">
        <ScrollArea className="h-[calc(100svh-4rem)]">
          <RightPanelContent
            activeRegion={activeRegion}
            locationSource={locationSource}
          />
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}

function ConsoleView({
  activeRegion,
  activeItemLabel,
  locationSource,
  isResolvingExactLocation,
  onUseExactLocation,
  activePrompts,
  selectedPrompt,
  onPromptClick,
  promptInput,
  onPromptInputChange,
  onSubmitPrompt,
  conversation,
  isTyping,
  loadingText,
  latestResponse,
}: {
  activeRegion: MarineRegion;
  activeItemLabel: string;
  locationSource: LocationSource;
  isResolvingExactLocation: boolean;
  onUseExactLocation: () => void;
  activePrompts: string[];
  selectedPrompt: string | null;
  onPromptClick: (prompt: string) => void;
  promptInput: string;
  onPromptInputChange: (value: string) => void;
  onSubmitPrompt: (prompt: string) => void;
  conversation: ConversationEntry[];
  isTyping: boolean;
  loadingText: string;
  latestResponse: MarineResponse | null;
}) {
  const conversationEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [conversation, isTyping]);

  const metrics: MetricItem[] = [
    {
      label: "Subscribed users",
      value: "128",
      detail: "Across surf, boating, and fishing lists",
    },
    {
      label: "Live crons",
      value: "5",
      detail: "Daily schedules currently armed",
    },
    {
      label: "Reply median",
      value: "3m",
      detail: "Time from send to first user response",
    },
    {
      label: "Delivery success",
      value: "98.4%",
      detail: "Last 24 hours on the live number",
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.95fr]">
        <SectionFrame
          eyebrow="Forward-facing app layer"
          title={activeItemLabel}
          description="This is the control surface for the deployed forecast agent: live user thread, prompt context, cron posture, and handoff decisions."
        >
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full">Sendblue connected</Badge>
            <Badge variant="secondary" className="rounded-full">
              OpenClaw runtime healthy
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {activeRegion.label}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {getLocationSourceLabel(locationSource)}
            </Badge>
          </div>
          <div className="mt-5">
            <MetricGrid items={metrics} />
          </div>
        </SectionFrame>

        <SectionFrame
          eyebrow="Latest call"
          title={latestResponse ? latestResponse.window : "Waiting for first forecast"}
          description={
            latestResponse
              ? latestResponse.summary
              : "Run a prompt from the thread to preview how the live assistant will answer inside the app layer."
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Primary risk
              </p>
              <p className="mt-2 text-sm font-medium">
                {latestResponse?.risk ?? "No forecast yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Confidence
              </p>
              <p className="mt-2 text-sm font-medium">
                {latestResponse?.confidence ?? "No forecast yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/35 p-4 sm:col-span-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Agent stance
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep the live number personal and decisive. The assistant should surface a recommendation first, then the risk and uncertainty that shaped it.
              </p>
            </div>
          </div>
        </SectionFrame>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1.55fr_0.9fr]">
        <section className="flex min-h-[34rem] flex-col rounded-3xl border border-border/70 bg-card/75 shadow-lg shadow-black/10 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Live thread
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                Forecast agent ↔ user
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={onUseExactLocation}
              disabled={isResolvingExactLocation}
            >
              {isResolvingExactLocation ? "Locating..." : "Use exact location"}
            </Button>
          </div>

          <ScrollArea className="min-h-0 flex-1 px-5">
            <div className="space-y-4 py-5">
              {conversation.map((entry) => (
                <ConversationMessage key={entry.id} entry={entry} />
              ))}
              {isTyping ? (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-3xl border border-border/70 bg-background/60 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      WaveWatch agent
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {loadingText}
                      <span className="animate-pulse"> _</span>
                    </p>
                  </div>
                </div>
              ) : null}
              <div ref={conversationEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border/70 p-5">
            <div className="flex flex-wrap gap-2">
              {activePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onPromptClick(prompt)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-left text-xs transition-colors",
                    selectedPrompt === prompt
                      ? "border-primary/80 bg-primary text-primary-foreground"
                      : "border-border/70 bg-background/35 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmitPrompt(promptInput);
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={promptInput}
                  onChange={(event) => onPromptInputChange(event.target.value)}
                  placeholder={`Ask about ${activeRegion.spots.surf.label}, ${activeRegion.spots.fishing.label}, or the next safe window...`}
                  className="h-11 rounded-full border-border/70 bg-background/35 pl-11"
                />
              </div>
              <Button type="submit" className="h-11 rounded-full px-5">
                Send prompt
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </section>

        <div className="grid gap-4">
          <SectionFrame
            eyebrow="Queue"
            title="Next scheduled sends"
            description="The runtime lives outside the web layer. This view shows what the app will trigger next."
          >
            <div className="space-y-3">
              {sendQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/60 bg-background/35 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </SectionFrame>

          <SectionFrame
            eyebrow="Prompt layer"
            title="Saved playbooks"
            description="The app layer owns these user-facing modes, even if the final reasoning happens in OpenClaw."
          >
            <div className="space-y-3">
              {playbooks.map((playbook) => (
                <div
                  key={playbook.title}
                  className="rounded-2xl border border-border/60 bg-background/35 p-4"
                >
                  <p className="font-medium">{playbook.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {playbook.detail}
                  </p>
                </div>
              ))}
            </div>
          </SectionFrame>
        </div>
      </div>
    </div>
  );
}

function BriefingsView({ activeItemLabel }: { activeItemLabel: string }) {
  const stats: MetricItem[] = [
    {
      label: "Daily sends",
      value: "176",
      detail: "Across all active forecast cohorts",
    },
    {
      label: "Median read rate",
      value: "78%",
      detail: "Users who opened or replied within one hour",
    },
    {
      label: "Forecast hit rate",
      value: "84%",
      detail: "Messages that matched the eventual best window",
    },
    {
      label: "Manual reviews",
      value: "6",
      detail: "Runs flagged before the user ever saw them",
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <SectionFrame
          eyebrow="Performance"
          title={`${activeItemLabel} volume`}
          description="Daily sends, replies, and escalations flowing through the app layer."
          action={
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreHorizontal className="size-4" />
            </Button>
          }
        >
          <ChartContainer
            config={sendVolumeConfig}
            className="h-[260px] w-full"
          >
            <BarChart data={sendVolumeData} barGap={8}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} width={28} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;

                  return (
                    <div className="rounded-2xl border border-border/70 bg-popover p-3 shadow-lg">
                      <p className="text-sm font-medium">{label}</p>
                      <div className="mt-3 space-y-2 text-xs">
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted-foreground">
                                {
                                  sendVolumeConfig[
                                    entry.dataKey as keyof typeof sendVolumeConfig
                                  ].label
                                }
                              </span>
                            </div>
                            <span className="font-medium">
                              {numberFormatter.format(Number(entry.value))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="automated"
                fill="var(--color-automated)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="replies"
                fill="var(--color-replies)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="escalated"
                fill="var(--color-escalated)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </SectionFrame>

        <SectionFrame
          eyebrow="Snapshot"
          title="What the user actually feels"
          description="These metrics are about trust and timing, not just send count."
        >
          <MetricGrid items={stats} />
        </SectionFrame>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <SectionFrame
          eyebrow="Window quality"
          title="Confidence across the day"
          description="How convincing the briefing engine is by activity and time block."
        >
          <ChartContainer
            config={confidenceConfig}
            className="h-[280px] w-full"
          >
            <LineChart data={confidenceData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="slot" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={30}
                domain={[40, 90]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;

                  return (
                    <div className="rounded-2xl border border-border/70 bg-popover p-3 shadow-lg">
                      <p className="text-sm font-medium">{label}</p>
                      <div className="mt-3 space-y-2 text-xs">
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted-foreground">
                                {
                                  confidenceConfig[
                                    entry.dataKey as keyof typeof confidenceConfig
                                  ].label
                                }
                              </span>
                            </div>
                            <span className="font-medium">
                              {entry.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="surf"
                stroke="var(--color-surf)"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fishing"
                stroke="var(--color-fishing)"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="boating"
                stroke="var(--color-boating)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </SectionFrame>

        <SectionFrame
          eyebrow="Regional hand-off"
          title="Coverage notes"
          description="The app layer should expose how different cohorts are being briefed, even if the runtime logic is shared."
        >
          <div className="space-y-3">
            {[
              {
                title: "Northern California",
                detail: "Surf and fishing cohorts share a dawn send but diver briefings stay manual.",
              },
              {
                title: "Monterey Bay",
                detail: "Weekend planning runs at higher confidence after 9 AM once wind settles.",
              },
              {
                title: "Oregon Coast",
                detail: "Storm-mode copy is stricter because the confidence spread is wider.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/60 bg-background/35 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant="outline" className="rounded-full">
                    Live
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </SectionFrame>
      </div>
    </div>
  );
}

function AutomationView({ activeItemLabel }: { activeItemLabel: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <SectionFrame
          eyebrow="Cron design"
          title={activeItemLabel}
          description="Each automation exists outside the app layer, but the app owns the policy, cadence, and user-visible result."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {automationCards.map((card) => (
              <div
                key={card.name}
                className="rounded-2xl border border-border/60 bg-background/35 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{card.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {card.schedule}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {card.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {card.detail}
                </p>
                <div className="mt-3 rounded-2xl border border-border/50 bg-card/80 p-3 text-sm">
                  <span className="text-muted-foreground">Audience</span>
                  <p className="mt-1 font-medium">{card.audience}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame
          eyebrow="Execution model"
          title="Message lifecycle"
          description="Treat the runtime like a worker. The web app should orchestrate it, not disappear into it."
        >
          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/35 text-xs font-medium">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionFrame>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionFrame
          eyebrow="Guardrails"
          title="Quiet hours and fail-safes"
          description="The best place to make these rules legible is the app layer."
        >
          <div className="space-y-3">
            {[
              "Do not send between 9:30 PM and 5:00 AM unless the alert class is safety-critical.",
              "Hold the send when model disagreement exceeds 25% and ask for operator review.",
              "Suppress repeat messages when the recommendation has not materially changed.",
            ].map((rule) => (
              <div
                key={rule}
                className="rounded-2xl border border-border/60 bg-background/35 p-4 text-sm text-muted-foreground"
              >
                {rule}
              </div>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame
          eyebrow="Human intervention"
          title="Manual override moments"
          description="These are the cases where the web app should surface a decision instead of silently auto-sending."
        >
          <div className="space-y-3">
            {interventionMoments.map((moment) => (
              <div
                key={moment}
                className="rounded-2xl border border-border/60 bg-background/35 p-4 text-sm text-muted-foreground"
              >
                {moment}
              </div>
            ))}
          </div>
        </SectionFrame>
      </div>
    </div>
  );
}

function DeliveryView({ activeItemLabel }: { activeItemLabel: string }) {
  const stats: MetricItem[] = [
    {
      label: "Delivery rate",
      value: "94%",
      detail: "Outbound messages accepted by transport",
    },
    {
      label: "Read rate",
      value: "73%",
      detail: "User opened or visibly replied within one hour",
    },
    {
      label: "Failure rate",
      value: "3.4%",
      detail: "Mostly carrier lag and retry-worthy issues",
    },
    {
      label: "Opt-outs",
      value: "2",
      detail: "Last 30 days across all active lists",
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <SectionFrame
          eyebrow="Transport health"
          title={activeItemLabel}
          description="The app layer should make carrier behavior and retries visible without exposing infrastructure details to the user."
        >
          <ChartContainer
            config={deliveryMixConfig}
            className="h-[260px] w-full"
          >
            <BarChart data={deliveryMixData} barGap={10}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} width={30} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;

                  return (
                    <div className="rounded-2xl border border-border/70 bg-popover p-3 shadow-lg">
                      <p className="text-sm font-medium">{label}</p>
                      <div className="mt-3 space-y-2 text-xs">
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted-foreground">
                                {
                                  deliveryMixConfig[
                                    entry.dataKey as keyof typeof deliveryMixConfig
                                  ].label
                                }
                              </span>
                            </div>
                            <span className="font-medium">{entry.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="delivered"
                fill="var(--color-delivered)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="read"
                fill="var(--color-read)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="failed"
                fill="var(--color-failed)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </SectionFrame>

        <SectionFrame
          eyebrow="Operational metrics"
          title="Number posture"
          description="Healthy delivery is product behavior, not just infrastructure behavior."
        >
          <MetricGrid items={stats} />
        </SectionFrame>
      </div>

      <SectionFrame
        eyebrow="Audit"
        title="Recent sends"
        description="Replay, retries, and escalations should all be legible to an operator."
      >
        <div className="space-y-3">
          <div className="hidden items-center gap-3 border-b border-border/70 pb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:flex">
            <span className="w-48 shrink-0">Audience</span>
            <span className="w-32 shrink-0">Window</span>
            <span className="flex-1">Progress</span>
            <span className="w-24 shrink-0 text-right">Status</span>
          </div>
          {deliveryRows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/35 p-4 md:flex-row md:items-center"
            >
              <div className="w-full md:w-48 md:shrink-0">
                <p className="font-medium">{row.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{row.window}</p>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1">
                {row.segments.map((opacity, index) => {
                  const filled = index < Math.round((row.progress / 100) * row.segments.length);

                  return (
                    <div
                      key={`${row.id}-${index}`}
                      className="h-2 flex-1 rounded-full"
                      style={{
                        backgroundColor: filled ? "var(--primary)" : "var(--muted)",
                        opacity: filled ? opacity : 0.25,
                      }}
                    />
                  );
                })}
              </div>
              <div className="md:w-24 md:shrink-0 md:text-right">
                <Badge variant="outline" className="rounded-full">
                  {row.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionFrame>
    </div>
  );
}

function StackView({ activeItemLabel }: { activeItemLabel: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
      <SectionFrame
        eyebrow="Architecture"
        title={activeItemLabel}
        description="The web app is the operator surface around a deployed forecasting worker. Configure the edges here, not inside one opaque prompt."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {settingsCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-border/60 bg-background/35 p-5"
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {card.eyebrow}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {card.detail}
              </p>
              <div className="mt-4 space-y-3">
                {card.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border/50 bg-card/80 p-3 text-sm text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionFrame>
    </div>
  );
}

export function WaveWatchAppShell() {
  const [activeKey, setActiveKey] = React.useState<ModuleId>(navModules[0].id);
  const [activeItemKey, setActiveItemKey] = React.useState(() =>
    getDefaultItemKey(navModules[0]),
  );
  const [isMobilePanelOpen, setIsMobilePanelOpen] = React.useState(false);
  const [activeRegion, setActiveRegion] = React.useState(getDefaultMarineRegion());
  const [locationSource, setLocationSource] =
    React.useState<LocationSource>("default");
  const [isResolvingExactLocation, setIsResolvingExactLocation] =
    React.useState(false);
  const [selectedPrompt, setSelectedPrompt] = React.useState<string | null>(
    null,
  );
  const [promptInput, setPromptInput] = React.useState("");
  const [conversation, setConversation] = React.useState<ConversationEntry[]>(
    () => buildSeedConversation(getDefaultMarineRegion()),
  );
  const [isTyping, setIsTyping] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState("");

  const userIdRef = React.useRef(
    `wavewatch-app-${Math.random().toString(36).slice(2)}`,
  );
  const requestIdRef = React.useRef(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const locationPriorityRef = React.useRef(getLocationSourcePriority("default"));
  const previousRegionRef = React.useRef(activeRegion.id);

  const activeModule =
    navModules.find((module) => module.id === activeKey) ?? navModules[0];
  const activeItemLabel = getActiveItemLabel(activeModule, activeItemKey);
  const activePrompts = resolveMarinePromptSet(activeRegion).prompts;

  const latestResponse = React.useMemo(() => {
    return (
      [...conversation]
        .reverse()
        .find((entry) => entry.response)?.response ?? null
    );
  }, [conversation]);

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  React.useEffect(() => {
    let ignore = false;
    let hasFreshCache = false;

    const applyRegion = (
      regionId: string,
      source: LocationSource,
      resolvedAt = Date.now(),
    ) => {
      const region = getMarineRegionById(regionId);
      if (!region || ignore) {
        return;
      }

      const nextPriority = getLocationSourcePriority(source);
      if (nextPriority < locationPriorityRef.current) {
        return;
      }

      locationPriorityRef.current = nextPriority;
      setActiveRegion(region);
      setLocationSource(source);
      setIsResolvingExactLocation(false);

      if (source === "server-header" || source === "server-ip") {
        try {
          window.localStorage.setItem(
            regionStorageKey,
            JSON.stringify({
              id: region.id,
              source,
              resolvedAt,
            } satisfies CachedRegion),
          );
        } catch {
          // Ignore localStorage failures and keep the resolved region in memory.
        }
      }
    };

    const readCachedRegion = () => {
      try {
        const cachedRegion = window.localStorage.getItem(regionStorageKey);
        if (!cachedRegion) {
          return;
        }

        const parsedCache = JSON.parse(cachedRegion) as CachedRegion;
        if (!parsedCache.id || !parsedCache.resolvedAt) {
          return;
        }

        const isFresh = Date.now() - parsedCache.resolvedAt < regionCacheTtlMs;
        if (!isFresh) {
          return;
        }

        const region = getMarineRegionById(parsedCache.id);
        if (!region) {
          return;
        }

        hasFreshCache = true;
        locationPriorityRef.current = getLocationSourcePriority("cache");
        setActiveRegion(region);
        setLocationSource("cache");
      } catch {
        // Ignore malformed cache and continue with live lookup.
      }
    };

    const loadServerLocation = async () => {
      if (hasFreshCache || ignore) {
        return;
      }

      try {
        const response = await fetch("/api/location", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Location lookup failed.");
        }

        const data = (await response.json()) as LocationApiResponse;
        if (!ignore) {
          applyRegion(data.regionId, data.source);
        }
      } catch {
        if (!ignore) {
          setLocationSource("default");
          setIsResolvingExactLocation(false);
        }
      }
    };

    readCachedRegion();
    void loadServerLocation();

    return () => {
      ignore = true;
    };
  }, []);

  React.useEffect(() => {
    if (!isTyping) {
      setLoadingText("");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const tick = () => {
      const currentMessage = loadingMessages[messageIndex];

      if (isDeleting) {
        charIndex -= 1;
        setLoadingText(currentMessage.slice(0, Math.max(0, charIndex)));

        if (charIndex <= 0) {
          isDeleting = false;
          messageIndex = (messageIndex + 1) % loadingMessages.length;
          timeoutId = setTimeout(tick, 120);
          return;
        }

        timeoutId = setTimeout(tick, 18);
        return;
      }

      charIndex += 1;
      setLoadingText(currentMessage.slice(0, charIndex));

      if (charIndex >= currentMessage.length) {
        isDeleting = true;
        timeoutId = setTimeout(tick, 800);
        return;
      }

      timeoutId = setTimeout(tick, 36);
    };

    tick();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isTyping]);

  React.useEffect(() => {
    if (activeRegion.id === previousRegionRef.current) {
      return;
    }

    previousRegionRef.current = activeRegion.id;
    setConversation((current) => [
      ...current,
      {
        id: `region-${activeRegion.id}-${Date.now()}`,
        role: "system",
        body: `Context shifted to ${activeRegion.label}. Prompt suggestions and scheduled windows updated for this coastline.`,
        meta: getLocationSourceLabel(locationSource),
      },
    ]);
  }, [activeRegion, locationSource]);

  React.useEffect(() => {
    setActiveItemKey(getDefaultItemKey(activeModule));
  }, [activeModule]);

  const handleUseExactLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setIsResolvingExactLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const match = findNearestMarineRegion(
          position.coords.latitude,
          position.coords.longitude,
        );
        locationPriorityRef.current = getLocationSourcePriority("browser");
        setActiveRegion(match.region);
        setLocationSource("browser");
        setIsResolvingExactLocation(false);
      },
      () => {
        setIsResolvingExactLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 900000,
      },
    );
  }, []);

  const submitPrompt = React.useCallback(
    async (prompt: string) => {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        return;
      }

      const requestId = ++requestIdRef.current;
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setSelectedPrompt(trimmedPrompt);
      setPromptInput("");
      setIsTyping(true);
      setConversation((current) => [
        ...current,
        {
          id: `user-${requestId}`,
          role: "user",
          body: trimmedPrompt,
          meta: `${activeRegion.label} · ${getLocationSourceLabel(locationSource)}`,
        },
      ]);

      try {
        const apiResponse = await fetch("/api/pickaxe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedPrompt,
            userId: userIdRef.current,
          }),
          signal: controller.signal,
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
          throw new Error(data?.error || "Pickaxe request failed.");
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        setConversation((current) => [
          ...current,
          {
            id: `assistant-${requestId}`,
            role: "assistant",
            body: data.structured.summary,
            meta: `${activeRegion.label} response`,
            response: data.structured as MarineResponse,
          },
        ]);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        const fallback = buildFallbackResponse(
          "The live forecast worker is temporarily unavailable.",
          error instanceof Error ? error.message : "Pickaxe request failed.",
        );

        setConversation((current) => [
          ...current,
          {
            id: `assistant-${requestId}`,
            role: "assistant",
            body: fallback.summary,
            meta: "Fallback response",
            response: fallback,
          },
        ]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsTyping(false);
        }
      }
    },
    [activeRegion.label, locationSource],
  );

  const renderActiveView = () => {
    switch (activeKey) {
      case "console":
        return (
          <ConsoleView
            activeRegion={activeRegion}
            activeItemLabel={activeItemLabel}
            locationSource={locationSource}
            isResolvingExactLocation={isResolvingExactLocation}
            onUseExactLocation={handleUseExactLocation}
            activePrompts={activePrompts}
            selectedPrompt={selectedPrompt}
            onPromptClick={submitPrompt}
            promptInput={promptInput}
            onPromptInputChange={setPromptInput}
            onSubmitPrompt={submitPrompt}
            conversation={conversation}
            isTyping={isTyping}
            loadingText={loadingText}
            latestResponse={latestResponse}
          />
        );
      case "briefings":
        return <BriefingsView activeItemLabel={activeItemLabel} />;
      case "automation":
        return <AutomationView activeItemLabel={activeItemLabel} />;
      case "delivery":
        return <DeliveryView activeItemLabel={activeItemLabel} />;
      case "stack":
        return <StackView activeItemLabel={activeItemLabel} />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "23rem",
        } as React.CSSProperties
      }
      className="bg-transparent"
    >
      <div className="hidden md:block">
        <AppSidebar
          activeKey={activeKey}
          activeItemKey={activeItemKey}
          onNavChange={setActiveKey}
          onItemChange={setActiveItemKey}
        />
      </div>

      <SidebarInset className="min-h-svh bg-transparent">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/70 px-3 backdrop-blur md:px-4">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-card/75 md:hidden">
            <img
              src="/wavewatch-logo-light.png"
              alt="WaveWatch"
              className="size-7 object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <ShellBreadcrumb
              moduleLabel={activeModule.label}
              itemLabel={activeItemLabel}
            />
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {moduleDescriptions[activeKey]}
            </p>
          </div>

          <div className="relative hidden w-72 lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search threads, crons, sources..."
              className="h-10 rounded-full border-border/70 bg-card/75 pl-9"
            />
          </div>

          <Badge variant="secondary" className="hidden rounded-full sm:inline-flex">
            Deployed instance
          </Badge>

          <Button variant="outline" size="sm" className="hidden rounded-full sm:inline-flex">
            New cron
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full lg:hidden">
                <Users className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-border/70 bg-background/95 p-0">
              <SheetHeader className="border-b border-border/70 px-4 py-4">
                <SheetTitle>Runtime</SheetTitle>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1">
                <RightPanelContent
                  activeRegion={activeRegion}
                  locationSource={locationSource}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">{renderActiveView()}</div>
      </SidebarInset>

      <SidebarRight activeRegion={activeRegion} locationSource={locationSource} />

      <Drawer
        open={isMobilePanelOpen}
        onOpenChange={setIsMobilePanelOpen}
        dismissible
      >
        <DrawerContent className="border-border/70 bg-background/95">
          <DrawerHeader>
            <DrawerTitle>{activeModule.label}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-6">
            <ModulePanel
              module={activeModule}
              activeItemKey={activeItemKey}
              onSelectItem={(key) => {
                setActiveItemKey(key);
                setIsMobilePanelOpen(false);
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {navModules.map((module) => {
            const Icon = module.icon;
            const isActive = module.id === activeKey;

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => {
                  setActiveKey(module.id);
                  setIsMobilePanelOpen(true);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-[11px]",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={module.label}
              >
                <Icon className="size-5" />
                <span>{module.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </SidebarProvider>
  );
}
