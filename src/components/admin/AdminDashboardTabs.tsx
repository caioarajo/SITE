"use client";

import { useState } from "react";
import AdminTabs from "@/components/admin/AdminTabs";
import GeneralDashboard from "@/components/admin/dashboards/GeneralDashboard";
import CrmDashboard from "@/components/admin/dashboards/CrmDashboard";
import CadastrosDashboard from "@/components/admin/dashboards/CadastrosDashboard";
import FinanceiroDashboard from "@/components/admin/dashboards/FinanceiroDashboard";
import type {
  LeadRow,
  ClientRow,
  EventRow,
  StaffRow,
  SupplierRow,
  ProductRow,
  OpportunityRow,
  PayableRow,
  ReceivableRow,
} from "@/lib/types";

const TABS = [
  { id: "geral", label: "Geral" },
  { id: "crm", label: "CRM" },
  { id: "cadastros", label: "Cadastros" },
  { id: "financeiro", label: "Financeiro" },
];

export default function AdminDashboardTabs({
  leads,
  clients,
  events,
  staff,
  suppliers,
  products,
  opportunities,
  payable,
  receivable,
}: {
  leads: LeadRow[];
  clients: ClientRow[];
  events: EventRow[];
  staff: StaffRow[];
  suppliers: SupplierRow[];
  products: ProductRow[];
  opportunities: OpportunityRow[];
  payable: PayableRow[];
  receivable: ReceivableRow[];
}) {
  const [active, setActive] = useState("geral");

  return (
    <AdminTabs tabs={TABS} active={active} onChange={setActive}>
      {active === "geral" && (
        <GeneralDashboard
          leads={leads}
          clients={clients}
          events={events}
          opportunities={opportunities}
          payable={payable}
          receivable={receivable}
        />
      )}
      {active === "crm" && <CrmDashboard opportunities={opportunities} />}
      {active === "cadastros" && (
        <CadastrosDashboard events={events} staff={staff} suppliers={suppliers} products={products} />
      )}
      {active === "financeiro" && <FinanceiroDashboard payable={payable} receivable={receivable} />}
    </AdminTabs>
  );
}
