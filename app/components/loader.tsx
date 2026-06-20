import { Egg, Logo } from "./Logo";

// Page-transition loader: full-screen overlay with egg bubble + yellow halos.
// Opaque immediately (no fade-in) to avoid revealing the screen behind during
// page transitions.
export function Loader() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-6"
      style={{
        background: "#101012",
        backgroundImage: "radial-gradient(rgb(255 255 255 / 0.03) 1px, transparent 1.4px)",
        backgroundSize: "11px 11px",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative grid place-items-center">
        {/* Yellow halos */}
        <span
          aria-hidden="true"
          className="animate-halo absolute h-28 w-28 rounded-full"
          style={{ background: "rgb(245 199 0 / 0.22)" }}
        />
        <span
          aria-hidden="true"
          className="animate-halo absolute h-28 w-28 rounded-full [animation-delay:0.85s]"
          style={{ background: "rgb(245 199 0 / 0.12)" }}
        />
        {/* Dark bubble with egg */}
        <span
          className="animate-breathe relative grid h-28 w-28 place-items-center rounded-full shadow-card-lg"
          style={{ background: "#101012" }}
        >
          <Egg size={72} />
        </span>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <Logo size={26} />
        <span className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.18em] text-ink-faint">
          Ça mijote
          <span className="flex items-end gap-1">
            <span className="animate-dot h-[5px] w-[5px] rounded-full bg-accent" />
            <span className="animate-dot h-[5px] w-[5px] rounded-full bg-accent [animation-delay:0.15s]" />
            <span className="animate-dot h-[5px] w-[5px] rounded-full bg-accent [animation-delay:0.3s]" />
          </span>
        </span>
      </div>
    </div>
  );
}
