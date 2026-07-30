import { createClient } from "@/lib/supabase/server";
import AdminDashboardTabs from "@/components/admin/AdminDashboardTabs";
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
  GuestRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    leadsRes,
    clientsRes,
    eventsRes,
    staffRes,
    suppliersRes,
    productsRes,
    opportunitiesRes,
    payableRes,
    receivableRes,
    guestsRes,
  ] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("*"),
    supabase.from("events").select("*"),
    supabase.from("staff").select("*"),
    supabase.from("suppliers").select("*"),
    supabase.from("products").select("*"),
    supabase.from("opportunities").select("*"),
    supabase.from("accounts_payable").select("*"),
    supabase.from("accounts_receivable").select("*"),
    supabase.from("guests").select("*"),
  ]);

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do negócio — comercial, cadastros e financeiro</p>
        </div>
      </div>

      <AdminDashboardTabs
        leads={(leadsRes.data as LeadRow[] | null) ?? []}
        clients={(clientsRes.data as ClientRow[] | null) ?? []}
        events={(eventsRes.data as EventRow[] | null) ?? []}
        staff={(staffRes.data as StaffRow[] | null) ?? []}
        suppliers={(suppliersRes.data as SupplierRow[] | null) ?? []}
        products={(productsRes.data as ProductRow[] | null) ?? []}
        opportunities={(opportunitiesRes.data as OpportunityRow[] | null) ?? []}
        payable={(payableRes.data as PayableRow[] | null) ?? []}
        receivable={(receivableRes.data as ReceivableRow[] | null) ?? []}
        guests={(guestsRes.data as GuestRow[] | null) ?? []}
      />
    </>
  );
}
