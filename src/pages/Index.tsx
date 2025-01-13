import Universe from "@/components/Universe";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2, Search, Globe } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [searchAddress, setSearchAddress] = useState("");
  const [isPlanetSelected, setIsPlanetSelected] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const { data: holders, isLoading, error } = useQuery({
    queryKey: ['tokenHolders'],
    queryFn: async () => {
      console.log('Fetching token holders data...');
      
      await supabase.functions.invoke('fetchTokenHolders')
      
      const { data, error } = await supabase
        .from('token_holders')
        .select('*')
        .order('percentage', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching token holders:', error);
        throw error;
      }
      
      console.log('Successfully fetched token holders data:', data);
      return data;
    },
    refetchInterval: 60000, // Updated to 1 minute
  });

  const userHasPlanet = holders?.some(
    holder => holder.wallet_address.toLowerCase() === connectedWalletAddress?.toLowerCase()
  );

  const handlePlanetClick = () => {
    setIsPlanetSelected(true);
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
      const walletAddress = response.publicKey.toString();
      console.log("Connected to wallet:", walletAddress);
      
      setIsWalletConnected(true);
      setConnectedWalletAddress(walletAddress);
      toast.success("Wallet connected successfully!");
      
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const handleMyPlanetClick = () => {
    if (!connectedWalletAddress) return;
    console.log('Navigating to user planet:', connectedWalletAddress);
    setSelectedWallet(connectedWalletAddress);
    setIsPlanetSelected(true);
    toast.success("Navigating to your planet!");
  };

  const handleWalletClick = (walletAddress: string) => {
    console.log('Wallet clicked:', walletAddress);
    setSelectedWallet(walletAddress);
    setIsPlanetSelected(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for wallet:', searchAddress);
    
    const foundHolder = holders?.find(
      holder => holder.wallet_address.toLowerCase() === searchAddress.toLowerCase()
    );

    if (foundHolder) {
      console.log('Found holder:', foundHolder);
      setSelectedWallet(foundHolder.wallet_address);
      setIsPlanetSelected(true);
      toast.success("Planet found!");
    } else {
      toast.error("Wallet address not found");
    }
  };

  if (error) {
    console.error('Error fetching holders:', error);
  }

  const handleBackToOverview = () => {
    setIsPlanetSelected(false);
    setSelectedWallet(null);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Universe 
        onPlanetClick={handlePlanetClick} 
        onBackToOverview={handleBackToOverview}
        backButtonText="Back to the Solar System"
        selectedWalletAddress={selectedWallet}
        connectedWalletAddress={connectedWalletAddress}
      />
      
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center w-full px-4 pt-4">
          {/* Search Wallet Address - Left */}
          <form onSubmit={handleSearch} className="glass-panel flex gap-2">
            <Input
              type="text"
              placeholder="Search wallet address..."
              className="w-80 bg-space-lighter/50 border-white/10 text-white placeholder:text-white/50"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
            />
            <Button 
              type="submit" 
              variant="outline" 
              size="icon"
              className="bg-space-lighter/50 border-white/10 hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Solar Logo (Center) - Clickable with conditional behavior */}
          <div 
            onClick={isPlanetSelected ? handleBackToOverview : undefined}
            className={`absolute left-1/2 -translate-x-1/2 glass-panel px-4 py-2 ${
              isPlanetSelected ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''
            }`}
          >
            <img 
              src="/lovable-uploads/32b1c67e-6454-4649-b37d-dc0bae8bb0b0.png" 
              alt="Solar Logo" 
              className="h-8 w-auto"
            />
          </div>

          {/* Connect Wallet and My Planet Buttons (Right) */}
          <div className="ml-auto glass-panel px-4 py-2 flex gap-2">
            {isWalletConnected && userHasPlanet && (
              <Button
                variant="outline"
                size="sm"
                className="glass-panel border-none hover:bg-white/10"
                onClick={handleMyPlanetClick}
              >
                <Globe className="mr-2 h-4 w-4" />
                My Planet
              </Button>
            )}
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
      </div>

      {/* Top Holders Panel (Right Side) */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 glass-panel p-4 w-[24rem] z-30 h-[70vh]">
        <h2 className="text-lg font-semibold text-white mb-4">Top Holders</h2>
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(70vh-6rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white/80">Rank</TableHead>
                  <TableHead className="text-white/80">Wallet</TableHead>
                  <TableHead className="text-white/80">Holding %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holders?.map((holder, index) => (
                  <TableRow 
                    key={holder.wallet_address}
                    className="cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleWalletClick(holder.wallet_address)}
                  >
                    <TableCell className="text-white/70">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-white/70">
                      {holder.wallet_address.slice(0, 6)}...{holder.wallet_address.slice(-4)}
                    </TableCell>
                    <TableCell className="text-white/70">
                      {Number(holder.percentage).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default Index;