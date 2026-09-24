"use client";

import { useEffect, useState } from "react";
import { greeting } from "@/lib/format";

/** Client-rendered so the greeting follows the viewer's clock, not the cached page's. */
export function Greeting() {
  const [text, setText] = useState("Mabuhay!");
  useEffect(() => setText(greeting()), []);
  return <p className="text-sm font-semibold text-indigo-200">{text}</p>;
}
