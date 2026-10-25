"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";

const HIDE_ON = [
  "/games/snake",
  "/games/catch",
  "/games/wordle",
  "/games/memory",
  "/games/guess",
  "/games/puzzle",
];

export default function NavGate() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname?.startsWith(p))) return null;
  return <Nav />;
}
