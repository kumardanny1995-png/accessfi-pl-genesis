export default function Loading() {
  return (
    <div className="min-h-screen bg-[#08111f] px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-5">
        <div className="h-24 animate-pulse rounded-[1.8rem] border border-white/8 bg-white/5" />
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-80 animate-pulse rounded-[2rem] border border-white/8 bg-white/5" />
          <div className="h-80 animate-pulse rounded-[2rem] border border-white/8 bg-white/5" />
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-48 animate-pulse rounded-[1.8rem] border border-white/8 bg-white/5" />
          <div className="h-48 animate-pulse rounded-[1.8rem] border border-white/8 bg-white/5" />
          <div className="h-48 animate-pulse rounded-[1.8rem] border border-white/8 bg-white/5" />
        </div>
      </div>
    </div>
  );
}
