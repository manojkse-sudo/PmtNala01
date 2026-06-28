"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { inventoryApi } from "@/lib/api";
import { extractApiError } from "@/lib/utils";
import type { InventoryItem } from "@/types";
import {
  Package, Plus, AlertTriangle, Search, X, Edit2,
  Trash2, TrendingDown, ChevronDown,
} from "lucide-react";

const CATEGORIES = ["all", "medicine", "consumable", "equipment", "general"];

const CATEGORY_COLORS: Record<string, string> = {
  medicine:    "bg-blue-50 text-blue-700 border-blue-200",
  consumable:  "bg-purple-50 text-purple-700 border-purple-200",
  equipment:   "bg-amber-50 text-amber-700 border-amber-200",
  general:     "bg-gray-50 text-gray-700 border-gray-200",
};

// ── Item form modal ───────────────────────────────────────────────────────────
function ItemModal({
  item, onClose, onSave,
}: {
  item?: InventoryItem | null;
  onClose: () => void;
  onSave: (data: Partial<InventoryItem>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    category: item?.category ?? "general",
    unit: item?.unit ?? "units",
    quantity: String(item?.quantity ?? 0),
    reorder_level: String(item?.reorder_level ?? 10),
    cost_per_unit: String(item?.cost_per_unit ?? ""),
    supplier: item?.supplier ?? "",
    expiry_date: item?.expiry_date ?? "",
    description: item?.description ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave({
        name: form.name,
        category: form.category,
        unit: form.unit,
        quantity: Number(form.quantity),
        reorder_level: Number(form.reorder_level),
        cost_per_unit: form.cost_per_unit ? Number(form.cost_per_unit) : undefined,
        supplier: form.supplier || undefined,
        expiry_date: form.expiry_date || undefined,
        description: form.description || undefined,
      });
      onClose();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">{item ? "Edit Item" : "Add Inventory Item"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <Input label="Item Name *" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full h-9 px-3 text-sm border border-input rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="medicine">Medicine</option>
                <option value="consumable">Consumable</option>
                <option value="equipment">Equipment</option>
                <option value="general">General</option>
              </select>
            </div>
            <Input label="Unit" placeholder="tablets / ml / pcs" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Input label="Reorder Level" type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cost/Unit (₹)" type="number" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })} />
            <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
          <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">{item ? "Save Changes" : "Add Item"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Adjust qty popover ────────────────────────────────────────────────────────
function AdjustQty({ item, onDone }: { item: InventoryItem; onDone: () => void }) {
  const [delta, setDelta] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handleAdjust = async (sign: 1 | -1) => {
    const d = Number(delta);
    if (!d || d <= 0) return;
    setLoading(true);
    try {
      await inventoryApi.adjust(item.id, sign * d);
      qc.invalidateQueries({ queryKey: ["inventory"] });
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={1}
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        className="w-16 h-7 px-2 text-xs border border-input rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="qty"
      />
      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleAdjust(1)} disabled={loading}>+</Button>
      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleAdjust(-1)} disabled={loading}>-</Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", search, category, lowStockOnly],
    queryFn: () => inventoryApi.list({
      search: search || undefined,
      category: category === "all" ? undefined : category,
      low_stock_only: lowStockOnly || undefined,
    }),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const handleSave = async (formData: Partial<InventoryItem>) => {
    if (editItem) {
      await inventoryApi.update(editItem.id, formData);
    } else {
      await inventoryApi.create(formData);
    }
    qc.invalidateQueries({ queryKey: ["inventory"] });
  };

  const items = data?.items ?? [];
  const lowStockCount = data?.low_stock_count ?? 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Medical Inventory"
        subtitle="Manage your medicines, consumables, and equipment"
        actions={
          <Button size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
            <Plus className="h-3.5 w-3.5" /> Add Item
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{lowStockCount} item{lowStockCount > 1 ? "s" : ""}</span> below reorder level.{" "}
              <button onClick={() => setLowStockOnly(true)} className="underline font-medium">View low stock</button>
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 px-3 text-sm border border-input rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm border transition-colors ${lowStockOnly ? "bg-amber-100 border-amber-300 text-amber-800" : "border-input text-gray-600 hover:bg-muted"}`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Low Stock
            </button>
          </div>
        </div>

        {/* Table */}
        <Card padding="none">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No items found.</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setEditItem(null); setShowModal(true); }}>
                <Plus className="h-3.5 w-3.5" /> Add your first item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Reorder At</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Adjust</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className={`hover:bg-muted/30 transition-colors ${item.is_low_stock ? "bg-amber-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.is_low_stock && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.supplier && <p className="text-[11px] text-gray-400">{item.supplier}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.general}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-sm ${item.is_low_stock ? "text-amber-600" : "text-gray-900"}`}>
                          {item.quantity}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 hidden sm:table-cell">{item.reorder_level} {item.unit}</td>
                      <td className="px-4 py-3 text-center">
                        {adjustItem === item.id ? (
                          <AdjustQty item={item} onDone={() => setAdjustItem(null)} />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setAdjustItem(item.id)}
                          >
                            <ChevronDown className="h-3 w-3" /> Adjust
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => { setEditItem(item); setShowModal(true); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {data && (
          <p className="text-xs text-gray-400 text-right">
            {data.total} item{data.total !== 1 ? "s" : ""} total · {data.low_stock_count} low stock
          </p>
        )}
      </div>

      {showModal && (
        <ItemModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
