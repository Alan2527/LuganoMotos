"use client";

import { useState } from "react";

type Result = { ok?: boolean; permalink?: string; blockers?: Array<{ message: string }>; error?: string };

export function PublishButton({ productId }: { productId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function publish() {
    setState("loading");
    setMessage("");

    const res = await fetch("/api/meli/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data: Result = await res.json();

    if (res.ok && data.ok) {
      setState("done");
      setMessage(data.permalink ?? "Publicado");
    } else {
      setState("error");
      setMessage(data.blockers?.map((b) => b.message).join(" ") ?? data.error ?? "Error");
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={publish}
        disabled={state === "loading"}
        className="rounded-full border border-race-500 px-4 py-1.5 text-xs font-semibold text-race-500 transition hover:bg-race-500 hover:text-carbon-950 disabled:opacity-50"
      >
        {state === "loading" ? "Publicando…" : "Publicar en ML"}
      </button>
      {message && (
        <p className={`mt-1 max-w-xs text-xs ${state === "error" ? "text-red-400" : "text-steel-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
