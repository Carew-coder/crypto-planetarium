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
      const { solana } = window as any;
      
      if (!solana?.isPhantom) {
        toast.error("Phantom wallet is not installed!");
        window.open("https://phantom.app/download", "_blank");
        return;
      }

      console.log("Connecting to Phantom wallet...");
      toast.info("Connecting to Phantom wallet...");
      
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
      
      {/* Top Navigation Bar */}
      <div className="absolute top-4 left-0 right-0 flex items-center px-4">
        {/* Solar Title (Centered) */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className="glass-panel px-6 py-3">
            <h1 className="text-xl font-semibold text-white">Solar</h1>
          </div>
        </div>

        {/* Connect Wallet Button (Right of Center) */}
        <div className="absolute left-[65%] transform -translate-x-1/2">
          <div className="glass-panel px-4 py-2">
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
        </div>

        {/* Visit Planets Table (Right) */}
        <div className="ml-auto">
          <div className="glass-panel p-4 w-80">
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
      </div>
    </div>
  );
};

export default Index;