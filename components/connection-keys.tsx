"use client";

import { useState, useTransition } from "react";
import { onCreateIngress } from "@/actions/ingress";
import type { IngressType } from "@/lib/ingress-service";

type Connection = {
  serverUrl: string;
  streamKey: string;
};

export function ConnectionKeys({ configured, initialConnection }: { configured: boolean; initialConnection: Connection | null }) {
  const [inputType, setInputType] = useState<IngressType>("RTMP_INPUT");
  const [connection, setConnection] = useState<Connection | null>(initialConnection);
  const [message, setMessage] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isPending, startTransition] = useTransition();

  const generate = () => {
    if (!configured) {
      setMessage("Add Clerk and LiveKit credentials in .env to generate a connection.");
      return;
    }

    startTransition(() => {
      onCreateIngress(inputType)
        .then((result) => {
          setConnection({ serverUrl: result.serverUrl, streamKey: result.streamKey });
          setMessage("Connection generated. Add these values to OBS.");
        })
        .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to generate connection"));
    });
  };

  return (
    <div className="space-y-6 p-6 lg:p-10">
      <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#bf94ff]">Creator tools</p><h1 className="mt-2 text-3xl font-black">Connection keys</h1><p className="mt-3 text-sm text-[#adadb8]">Generate a secure RTMP or WHIP connection for your streaming software.</p></div>
      <section className="max-w-3xl rounded-lg border border-[#303038] bg-[#18181b] p-5">
        <label className="text-xs font-bold text-[#adadb8]">Connection type</label>
        <div className="mt-3 flex gap-2">{(["RTMP_INPUT", "WHIP_INPUT"] as const).map((type) => <button key={type} onClick={() => setInputType(type)} className={`rounded px-3 py-2 text-xs font-bold ${inputType === type ? "bg-[#9147ff]" : "bg-[#303038]"}`}>{type === "RTMP_INPUT" ? "RTMP" : "WHIP"}</button>)}</div>
        <button onClick={generate} disabled={isPending} className="mt-5 rounded bg-[#9147ff] px-4 py-2 text-xs font-bold hover:bg-[#a970ff] disabled:opacity-50">{isPending ? "Generating..." : "Generate connection"}</button>
        {message && <p className="mt-4 text-xs text-[#adadb8]">{message}</p>}
      </section>
      {connection && <section className="max-w-3xl space-y-4 rounded-lg border border-[#303038] bg-[#18181b] p-5"><Credential label="Server URL" value={connection.serverUrl} /><Credential label="Stream key" value={showKey ? connection.streamKey : "••••••••••••••••"} /><button onClick={() => setShowKey(!showKey)} className="text-xs font-bold text-[#bf94ff] hover:underline">{showKey ? "Hide key" : "Show key"}</button></section>}
    </div>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold text-[#adadb8]">{label}</p><div className="mt-2 overflow-x-auto rounded bg-[#242429] px-3 py-2 text-sm">{value}</div></div>;
}
