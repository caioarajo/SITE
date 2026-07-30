"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

/** Wrapper genérico: recebe uma option do ECharts e cuida do ciclo de
 * vida (init, resize, dispose). Reutilizável em qualquer gráfico. */
export default function EChart({ option, height = 280 }: { option: echarts.EChartsOption; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    chart.setOption(option);

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option);
  }, [option]);

  return <div ref={ref} style={{ width: "100%", height }} />;
}
