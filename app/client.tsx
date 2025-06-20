'use client'

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode } from "react";

const address = process.env.NEXT_PUBLIC_CONVEX_URL || "";

const convex = new ConvexReactClient(address);

export default function ConvexClientProvider({
  children,
}: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
} 