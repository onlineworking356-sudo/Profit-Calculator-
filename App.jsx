import { useState, useMemo } from "react";

const PERIODS = ["Daily", "Weekly", "Monthly"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmt = (n) => "Rs. " + Math.abs(n).toLocaleString("en-PK", { maximumFractionDigits: 0 });
const fmtN = (n) => (n < 0 ? "-" : "") + fmt(n);

const defaultEntry = () => ({
  id: Date.now(),
  label: "",
  totalOrders: "",
  delivered: "",
  returns: "",
  inTransit: "",
  sellingPrice: "",
  productCost: "",
  deliveryCharge: "",
  returnCharge: "",
  totalAdSpent: "",
  fbrTaxPercent: "",
});

function StatBox({ label, value, sub, color, big }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
      border: `1px solid ${color}33`,
      borderRadius: "14px",
      padding: big ? "20px 22px" : "16px 18px",
      flex: 1,
      minWidth: "140px",
    }}>
      <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>{label}</div>
      <div style={{ color, fontSize: big ? "26px" : "20px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: "#475569", fontSize: "11px", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

function InputRow({ label, value, onChange, placeholder, prefix }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", background: "#0d1829", border: "1px solid #1e3a5f", borderRadius: "8px", overflow: "hidden" }}>
        {prefix && <span style={{ color: "#475569", padding: "0 10px", fontSize: "12px", borderRight: "1px solid #1e3a5f", whiteSpace: "nowrap" }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "0"}
          style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", padding: "10px 12px", fontSize: "14px", outline: "none" }}
        />
      </div>
    </div>
  );
}

function EntryCard({ entry, onUpdate, onRemove, index }) {
  const update = (field, val) => onUpdate({ ...entry, [field]: val });

  const d = Number(entry.delivered) || 0;
  const r = Number(entry.returns) || 0;
  const t = Number(entry.totalOrders) || 0;
  // In transit = total sent - delivered - returns (automatic)
  const inTransitCalc = Math.max(0, t - d - r);
  const sp = Number(entry.sellingPrice) || 0;
  const pc = Number(entry.productCost) || 0;
  const dc = Number(entry.deliveryCharge) || 0;
  const rc = Number(entry.returnCharge) || 0;
  const adTotal = Number(entry.totalAdSpent) || 0;
  const fbrPct = Number(entry.fbrTaxPercent) || 0;

  // FBR tax per delivered order (on selling price)
  const fbrTaxPerOrder = sp > 0 ? (sp * fbrPct) / 100 : 0;

  // Ad spent divided on TOTAL SENT orders
  const adPerOrder = t > 0 ? adTotal / t : 0;

  // Revenue
  const revenue = d * sp;

  // Costs per delivered order
  const costPerDelivered = pc + dc + adPerOrder + fbrTaxPerOrder;
  const profitPerDelivered = sp - costPerDelivered;
  const totalProfit = d * profitPerDelivered;

  // Return loss — product wapas aata hai so NO product cost loss, sirf courier + ad
  const returnLossPerOrder = rc + adPerOrder;
  const totalReturnLoss = r * returnLossPerOrder;

  const netProfit = totalProfit - totalReturnLoss;
  const roi = adTotal > 0 ? ((netProfit / adTotal) * 100) : 0;

  // In Transit estimated P&L based on delivered/return ratio
  const resolvedOrders = d + r;
  const deliveryRatio = resolvedOrders > 0 ? d / resolvedOrders : 0.7;
  const returnRatio = resolvedOrders > 0 ? r / resolvedOrders : 0.3;
  const estTransitDelivered = Math.round(inTransitCalc * deliveryRatio);
  const estTransitReturns = inTransitCalc - estTransitDelivered;
  const estTransitProfit = estTransitDelivered * profitPerDelivered - estTransitReturns * returnLossPerOrder;

  return (
    <div style={{
      background: "linear-gradient(160deg, #0d1829 0%, #0a1520 100%)",
      border: "1px solid #1e3a5f",
      borderRadius: "18px",
      padding: "24px",
      marginBottom: "20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      animation: "fadeUp 0.4s ease forwards",
    }}>
      {/* Card Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: "700", fontSize: "13px"
          }}>{index + 1}</div>
          <input
            value={entry.label}
            onChange={e => update("label", e.target.value)}
            placeholder="e.g. Week 1 Jan / Today / March 2026"
            style={{
              background: "transparent", border: "none", borderBottom: "1px solid #1e3a5f",
              color: "#e2e8f0", fontSize: "15px", fontWeight: "600", outline: "none",
              padding: "4px 0", minWidth: "220px"
            }}
          />
        </div>
        <button onClick={onRemove} style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#ef4444", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px"
        }}>✕ Remove</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 24px" }}>
        {/* Orders Section */}
        <div>
          <div style={{ color: "#3b82f6", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #1e3a5f" }}>📦 Orders</div>
          <InputRow label="Total Sent Orders" value={entry.totalOrders} onChange={v => update("totalOrders", v)} />
          <InputRow label="Delivered Orders" value={entry.delivered} onChange={v => update("delivered", v)} />
          <InputRow label="Returns" value={entry.returns} onChange={v => update("returns", v)} />
          <div style={{ marginBottom: "10px" }}>
            <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>🚚 In Transit (Auto)</div>
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#f59e0b", fontSize: "20px", fontWeight: "700" }}>{inTransitCalc}</span>
              <span style={{ color: "#78716c", fontSize: "11px" }}>{t} − {d} − {r} = {inTransitCalc}</span>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div>
          <div style={{ color: "#10b981", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #1e3a5f" }}>💰 Pricing (per order)</div>
          <InputRow label="Selling Price" value={entry.sellingPrice} onChange={v => update("sellingPrice", v)} prefix="Rs." />
          <InputRow label="Product Cost" value={entry.productCost} onChange={v => update("productCost", v)} prefix="Rs." />
          <InputRow label="Delivery Charge" value={entry.deliveryCharge} onChange={v => update("deliveryCharge", v)} prefix="Rs." />
          <InputRow label="Return Charge" value={entry.returnCharge} onChange={v => update("returnCharge", v)} prefix="Rs." />
          <InputRow label="FBR Tax %" value={entry.fbrTaxPercent} onChange={v => update("fbrTaxPercent", v)} prefix="%" placeholder="e.g. 2.5" />
          {fbrTaxPerOrder > 0 && (
            <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "8px", padding: "8px 12px", marginTop: "2px" }}>
              <span style={{ color: "#a855f7", fontSize: "12px", fontWeight: "600" }}>FBR Tax per order: {fmt(fbrTaxPerOrder)}</span>
            </div>
          )}
        </div>

        {/* Ads Section */}
        <div>
          <div style={{ color: "#f59e0b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #1e3a5f" }}>📢 Ad Spend</div>
          <InputRow label="Total Ad Spent" value={entry.totalAdSpent} onChange={v => update("totalAdSpent", v)} prefix="Rs." />
          {t > 0 && (
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "10px 12px", marginTop: "8px" }}>
              <div style={{ color: "#f59e0b", fontSize: "12px", fontWeight: "600" }}>Ad per Order</div>
              <div style={{ color: "#fcd34d", fontSize: "15px", fontWeight: "700" }}>{fmt(adPerOrder)}</div>
              <div style={{ color: "#78716c", fontSize: "10px", marginTop: "2px" }}>Total Ad ÷ {t} sent orders</div>
            </div>
          )}
        </div>
      </div>

      {/* Results Panel */}
      {(d > 0 || r > 0) && (
        <div style={{ marginTop: "24px" }}>
          <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px", paddingBottom: "6px", borderBottom: "1px solid #1e293b" }}>📊 Calculations</div>

          {/* Per Order Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "12px", padding: "14px" }}>
              <div style={{ color: "#10b981", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>✅ Per Delivered Order</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Selling Price</span>
                <span style={{ color: "#e2e8f0", fontSize: "12px" }}>{fmt(sp)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>- Product Cost</span>
                <span style={{ color: "#ef4444", fontSize: "12px" }}>-{fmt(pc)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>- Delivery</span>
                <span style={{ color: "#ef4444", fontSize: "12px" }}>-{fmt(dc)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>- Ad Share</span>
                <span style={{ color: "#ef4444", fontSize: "12px" }}>-{fmt(adPerOrder)}</span>
              </div>
              {fbrTaxPerOrder > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#a855f7", fontSize: "12px" }}>- FBR Tax ({fbrPct}%)</span>
                  <span style={{ color: "#a855f7", fontSize: "12px" }}>-{fmt(fbrTaxPerOrder)}</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid rgba(16,185,129,0.2)", paddingTop: "8px", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#10b981", fontSize: "13px", fontWeight: "700" }}>Net Profit</span>
                <span style={{ color: profitPerDelivered >= 0 ? "#4ade80" : "#f87171", fontSize: "13px", fontWeight: "700" }}>{fmtN(profitPerDelivered)}</span>
              </div>
            </div>

            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "12px", padding: "14px" }}>
              <div style={{ color: "#ef4444", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>❌ Per Return Order (Loss)</div>
              <div style={{ color: "#4ade80", fontSize: "10px", marginBottom: "10px", background: "rgba(74,222,128,0.08)", padding: "4px 8px", borderRadius: "6px" }}>✓ Product wapas aa gaya — cost save</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Return Courier</span>
                <span style={{ color: "#ef4444", fontSize: "12px" }}>-{fmt(rc)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Ad Share (wasted)</span>
                <span style={{ color: "#ef4444", fontSize: "12px" }}>-{fmt(adPerOrder)}</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(239,68,68,0.2)", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: "700" }}>Total Loss</span>
                <span style={{ color: "#f87171", fontSize: "13px", fontWeight: "700" }}>-{fmt(returnLossPerOrder)}</span>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <StatBox label="Total Revenue" value={fmt(revenue)} color="#3b82f6" sub={`${d} × ${fmt(sp)}`} />
            <StatBox label="Delivered Profit" value={fmtN(totalProfit)} color="#10b981" sub={`${d} orders`} />
            <StatBox label="Return Loss" value={`-${fmt(totalReturnLoss)}`} color="#ef4444" sub={`${r} returns`} />
            <StatBox label="Net Profit" value={fmtN(netProfit)} color={netProfit >= 0 ? "#4ade80" : "#f87171"} big sub={`ROI: ${roi.toFixed(1)}%`} />
          </div>

          {/* In Transit Estimated P&L */}
          {inTransitCalc > 0 && (
            <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.07), rgba(251,191,36,0.04))", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "14px", padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ color: "#f59e0b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                  🚚 In Transit Estimated P&L ({inTransitCalc} orders)
                </div>
                <span style={{ color: "#78716c", fontSize: "10px", background: "rgba(0,0,0,0.3)", padding: "3px 8px", borderRadius: "6px" }}>
                  Based on {(deliveryRatio*100).toFixed(0)}% delivery / {(returnRatio*100).toFixed(0)}% return ratio
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ color: "#64748b", fontSize: "10px", textTransform: "uppercase", marginBottom: "4px" }}>Est. Delivered</div>
                  <div style={{ color: "#4ade80", fontSize: "18px", fontWeight: "700" }}>{estTransitDelivered}</div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ color: "#64748b", fontSize: "10px", textTransform: "uppercase", marginBottom: "4px" }}>Est. Returns</div>
                  <div style={{ color: "#f87171", fontSize: "18px", fontWeight: "700" }}>{estTransitReturns}</div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ color: "#64748b", fontSize: "10px", textTransform: "uppercase", marginBottom: "4px" }}>Est. Profit/Loss</div>
                  <div style={{ color: estTransitProfit >= 0 ? "#4ade80" : "#f87171", fontSize: "18px", fontWeight: "700" }}>{fmtN(estTransitProfit)}</div>
                </div>
                <div style={{ background: "rgba(245,158,11,0.12)", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div style={{ color: "#f59e0b", fontSize: "10px", textTransform: "uppercase", marginBottom: "4px" }}>Grand Total Est.</div>
                  <div style={{ color: netProfit + estTransitProfit >= 0 ? "#4ade80" : "#f87171", fontSize: "18px", fontWeight: "700" }}>{fmtN(netProfit + estTransitProfit)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryPanel({ entries }) {
  const totals = useMemo(() => {
    let revenue = 0, deliveredProfit = 0, returnLoss = 0, adSpent = 0, delivered = 0, returns = 0, inTransit = 0, total = 0;
    entries.forEach(e => {
      const d = Number(e.delivered) || 0;
      const r = Number(e.returns) || 0;
      const sp = Number(e.sellingPrice) || 0;
      const pc = Number(e.productCost) || 0;
      const dc = Number(e.deliveryCharge) || 0;
      const rc = Number(e.returnCharge) || 0;
      const ad = Number(e.totalAdSpent) || 0;
      const sent = Number(e.totalOrders) || 0;
      const adPer = sent > 0 ? ad / sent : 0;
      const fbrP = Number(e.fbrTaxPercent) || 0;
      const fbrPerOrd = sp > 0 ? (sp * fbrP) / 100 : 0;
      revenue += d * sp;
      deliveredProfit += d * (sp - pc - dc - adPer - fbrPerOrd);
      returnLoss += r * (rc + adPer); // product wapas aata hai — sirf return courier + ad waste
      adSpent += ad;
      delivered += d;
      returns += r;
      inTransit += Math.max(0, sent - d - r);
      total += Number(e.totalOrders) || 0;
    });
    return { revenue, deliveredProfit, returnLoss, netProfit: deliveredProfit - returnLoss, adSpent, delivered, returns, inTransit, total };
  }, [entries]);

  if (entries.length === 0) return null;

  const deliveryRate = totals.total > 0 ? ((totals.delivered / totals.total) * 100).toFixed(1) : 0;
  const returnRate = totals.total > 0 ? ((totals.returns / totals.total) * 100).toFixed(1) : 0;
  const roi = totals.adSpent > 0 ? ((totals.netProfit / totals.adSpent) * 100).toFixed(1) : 0;

  return (
    <div style={{
      background: "linear-gradient(160deg, #0d1829, #071020)",
      border: "1px solid #1e3a5f",
      borderRadius: "20px",
      padding: "28px",
      marginBottom: "28px",
      boxShadow: "0 0 40px rgba(59,130,246,0.08)",
    }}>
      <div style={{ color: "#3b82f6", fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "20px" }}>
        📈 Combined Summary — {entries.length} Period{entries.length > 1 ? "s" : ""}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <StatBox label="Total Orders" value={totals.total} color="#3b82f6" sub={`${totals.delivered} delivered`} />
        <StatBox label="Returns" value={totals.returns} color="#ef4444" sub={`${returnRate}% return rate`} />
        <StatBox label="In Transit" value={totals.inTransit} color="#f59e0b" sub="pending" />
        <StatBox label="Delivery Rate" value={`${deliveryRate}%`} color="#10b981" sub={`${totals.delivered} successful`} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <StatBox label="Total Revenue" value={fmt(totals.revenue)} color="#60a5fa" />
        <StatBox label="Total Ad Spent" value={fmt(totals.adSpent)} color="#f59e0b" sub={`ROI: ${roi}%`} />
        <StatBox label="Return Losses" value={`-${fmt(totals.returnLoss)}`} color="#f87171" />
        <StatBox label="NET PROFIT" value={fmtN(totals.netProfit)} color={totals.netProfit >= 0 ? "#4ade80" : "#f87171"} big />
      </div>
    </div>
  );
}

export default function App() {
  const [activePeriod, setActivePeriod] = useState("Daily");
  const [entries, setEntries] = useState({
    Daily: [{ ...defaultEntry(), label: "Today" }],
    Weekly: [{ ...defaultEntry(), label: "Week 1" }],
    Monthly: [{ ...defaultEntry(), label: "January 2026" }],
  });

  const currentEntries = entries[activePeriod];

  const addEntry = () => {
    const labels = { Daily: "Today", Weekly: `Week ${currentEntries.length + 1}`, Monthly: MONTHS[currentEntries.length % 12] + " 2026" };
    setEntries(prev => ({
      ...prev,
      [activePeriod]: [...prev[activePeriod], { ...defaultEntry(), id: Date.now(), label: labels[activePeriod] }]
    }));
  };

  const updateEntry = (id, updated) => {
    setEntries(prev => ({
      ...prev,
      [activePeriod]: prev[activePeriod].map(e => e.id === id ? updated : e)
    }));
  };

  const removeEntry = (id) => {
    setEntries(prev => ({
      ...prev,
      [activePeriod]: prev[activePeriod].filter(e => e.id !== id)
    }));
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #071428 0%, #020912 60%)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "20px",
      color: "#f1f5f9",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input::placeholder{color:#334155}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", paddingTop: "20px", marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "3px", color: "#3b82f6", textTransform: "uppercase", marginBottom: "10px" }}>
          🛒 Shopify Pakistan Business
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(26px,5vw,44px)", fontWeight: "700", margin: "0 0 10px", lineHeight: 1.1 }}>
          Profit & Loss{" "}
          <span style={{ background: "linear-gradient(90deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Calculator
          </span>
        </h1>
        <p style={{ color: "#475569", fontSize: "14px", maxWidth: "480px", margin: "0 auto" }}>
          Daily • Weekly • Monthly — Orders, Returns, Ad Spend, Profit/Loss — sab kuch ek jagah
        </p>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Period Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "28px", background: "#0d1829", padding: "6px", borderRadius: "14px", border: "1px solid #1e3a5f", width: "fit-content" }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setActivePeriod(p)} style={{
              padding: "10px 28px", borderRadius: "10px", border: "none", cursor: "pointer",
              background: activePeriod === p ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "transparent",
              color: activePeriod === p ? "white" : "#475569",
              fontWeight: "600", fontSize: "14px", transition: "all 0.2s",
              boxShadow: activePeriod === p ? "0 4px 12px rgba(59,130,246,0.3)" : "none",
            }}>{p}</button>
          ))}
        </div>

        {/* Summary */}
        <SummaryPanel entries={currentEntries} />

        {/* Entries */}
        {currentEntries.map((entry, i) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            index={i}
            onUpdate={(updated) => updateEntry(entry.id, updated)}
            onRemove={() => removeEntry(entry.id)}
          />
        ))}

        {/* Add Button */}
        <button onClick={addEntry} style={{
          width: "100%", padding: "16px", borderRadius: "14px", border: "2px dashed #1e3a5f",
          background: "transparent", color: "#3b82f6", fontWeight: "600", fontSize: "15px",
          cursor: "pointer", transition: "all 0.2s", marginBottom: "40px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}
          onMouseEnter={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "rgba(59,130,246,0.06)"; }}
          onMouseLeave={e => { e.target.style.borderColor = "#1e3a5f"; e.target.style.background = "transparent"; }}
        >
          + {activePeriod === "Daily" ? "New Day" : activePeriod === "Weekly" ? "New Week" : "New Month"} Add Karo
        </button>

        {/* Legend */}
        <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid #1e3a5f", borderRadius: "14px", padding: "20px", marginBottom: "30px" }}>
          <div style={{ color: "#3b82f6", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>📘 Formula Guide</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
            {[
              ["✅ Profit per Delivered", "Selling Price − Product Cost − Delivery − Ad Share − FBR Tax"],
              ["❌ Loss per Return", "Return Courier + Ad Share (product wapas aata hai, cost nahi jaata)"],
              ["📢 Ad per Order", "Total Ad ÷ Total Sent Orders"],
              ["💰 Net Profit", "Total Delivered Profit − Total Return Loss"],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", marginBottom: "3px" }}>{k}</div>
                <div style={{ color: "#475569", fontSize: "11px" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", color: "#1e3a5f", fontSize: "12px", paddingBottom: "20px" }}>
          Made for Pakistani Shopify Sellers • Sab calculations automatic hain
        </div>
      </div>
    </div>
  );
}
