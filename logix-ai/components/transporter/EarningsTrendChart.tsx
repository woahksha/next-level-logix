"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EarningsWeek } from "@/types/transporter";
import { formatINR } from "@/lib/utils";

export function EarningsTrendChart({ data }: { data: EarningsWeek[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6b7482" }}
            axisLine={{ stroke: "#e3e8ef" }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value: number) => formatINR(value)}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e3e8ef",
              fontSize: 12,
            }}
          />
          <Bar dataKey="earningsINR" fill="#1370df" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
