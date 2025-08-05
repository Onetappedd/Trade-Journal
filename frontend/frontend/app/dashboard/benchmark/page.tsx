import type { Metadata } from "next"
import { BenchmarkPage } from "@/components/benchmark-page"

export const metadata: Metadata = {
  title: "Benchmark | Trading Journal",
  description: "Compare your performance against market benchmarks",
}

export default function Benchmark() {
  return <BenchmarkPage />
}
