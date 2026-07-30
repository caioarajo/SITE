"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export interface AdminTab {
  id: string;
  label: string;
}

/**
 * Abas controladas para o admin. Painéis desmontam quando inativos (em vez
 * de display:none) — importante para gráficos ECharts, que só medem o
 * container corretamente se ele já estiver visível no momento do mount.
 */
export default function AdminTabs({
  tabs,
  active,
  onChange,
  children,
}: {
  tabs: AdminTab[];
  active: string;
  onChange: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="admin-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className="admin-tab"
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {active === tab.id && (
              <motion.div className="admin-tab-indicator" layoutId="admin-tab-indicator" />
            )}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          className="admin-tab-panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 0.84, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
