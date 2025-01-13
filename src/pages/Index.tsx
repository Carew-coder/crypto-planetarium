import Universe from "@/components/Universe";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Connection, PublicKey } from "@solana/web3.js";

const Index = () => {
  const [searchAddress, setSearchAddress] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [isPlanetSelected, setIsPlanetSelected] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const handlePlanetClick = () => {
    setIsPlanetSelected(true);
    setIsOpen(false);
  };

  const handleConnectWallet = async () => {
    try {
      // Check if Phantom is installed
      const { solana } = window as any;
      
      if (!solana?.isPhantom) {
        toast.error("Phantom wallet is not installed!");
        // Open Phantom wallet download page
        window.open("https://phantom.app/download", "_blank");
        return;
      }

      console.log("Connecting to Phantom wallet...");
      toast.info("Connecting to Phantom wallet...");
      
      // Connect to Phantom wallet
      const response = await solana.connect();
      console.log("Connected to wallet:", response.publicKey.toString());
      
      setIsWalletConnected(true);
      toast.success("Wallet connected successfully!");
      
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Universe 
        onPlanetClick={handlePlanetClick} 
        onBackToOverview={() => {
          setIsPlanetSelected(false);
          setIsOpen(true);
        }}
        backButtonText="Back to the Solar System"
      />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-3">
        <h1 className="text-xl font-semibold text-white">Solar</h1>
      </div>

      <div className="absolute top-4 left-[calc(50%+120px)] glass-panel px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          className="glass-panel border-none hover:bg-white/10"
          onClick={handleConnectWallet}
          disabled={isWalletConnected}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isWalletConnected ? "Connected" : "Connect Wallet"}
        </Button>
      </div>
      
      {/* Visit Planets Table */}
      <div className={`absolute right-4 top-4 glass-panel p-4 w-80 transition-all duration-300`}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h2 className="text-lg font-semibold text-white">Visit Planet</h2>
            <ChevronDown className={`h-5 w-5 text-white transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Input
              type="text"
              placeholder="Search wallet address..."
              className="mb-4 mt-4 bg-space-lighter/50 border-white/10 text-white placeholder:text-white/50"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
            />
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/80">Planet</TableHead>
                    <TableHead className="text-white/80">Holding %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-white/70">0x1234...5678</TableCell>
                    <TableCell className="text-white/70">4.2%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-white/70">0x8765...4321</TableCell>
                    <TableCell className="text-white/70">2.8%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default Index;