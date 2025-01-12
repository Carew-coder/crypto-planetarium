import Universe from "@/components/Universe";

const Index = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Universe />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-3">
        <h1 className="text-xl font-semibold text-white">Crypto Universe</h1>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel px-4 py-2">
        <p className="text-sm text-white/80">Click on planets to explore token values</p>
        <p className="text-sm text-white/80">Use Scroll wheel to zoom in and out</p>
        <p className="text-sm text-white/80">Click and hold to spin around</p>
      </div>
    </div>
  );
};

export default Index;