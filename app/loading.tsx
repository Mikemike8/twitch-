export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-[#0e0e10] pt-14">
      <div className="space-y-8 p-4 sm:p-6">
        <div className="h-48 rounded-xl bg-[#1f1f23]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="aspect-video rounded bg-[#1f1f23]" />)}
        </div>
      </div>
    </div>
  );
}
