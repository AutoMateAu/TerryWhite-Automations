"use client"

import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { SalesRecord } from "@/lib/types"

interface SalesChartProps {
  data: SalesRecord[]
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} className="text-sm">
        <XAxis dataKey="month" stroke="currentColor" />
        <YAxis stroke="currentColor" />
        <Tooltip />
        <Bar dataKey="revenue" fill="hsl(var(--chart-3))" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
