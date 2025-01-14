import Universe from "@/components/Universe";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2, Search, Globe } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import HolderTable from "@/components/universe/HolderTable";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [searchAddress, setSearchAddress] = useState("");
  const [isPlanetSelected, setIsPlanetSelected] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const { toast } = useToast();
  const activeHoldersRef = useRef<any[]>([]);

  const { data: holders, isLoading, error } = useQuery({
    queryKey: ['tokenHolders'],
    queryFn: async () => {
      console.log('Fetching all token holders data...');
      
      try {
        await supabase.functions.invoke('fetchTokenHolders');
        
        const { data, error } = await supabase
          .from('token_holders')
          .select('*')
          .order('percentage', { ascending: false });

        if (error) {
          console.error('Error fetching token holders:', error);
          throw error;
        }
        
        console.log('Successfully fetched token holders data:', data?.length);
        return data;
      } catch (error) {
        console.error('Failed to fetch token holders:', error);
        toast({
          title: "Error refreshing data",
          description: "Current data will be maintained",
          variant: "destructive"
        });
        throw error;
      }
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    staleTime: 55000,
    placeholderData: (previousData) => previousData,
    retry: 3,
    retryDelay: 1000,
    gcTime: Infinity,
  });

  // Initialize activeHoldersRef when holders data is first loaded
  useEffect(() => {
    if (holders && !isLoading) {
      console.log('Updating active holders reference');
      activeHoldersRef.current = holders;
    }
  }, [holders, isLoading]);

  // Use activeHoldersRef.current instead of holders directly
  const userHasPlanet = activeHoldersRef.current?.some(
    holder => holder.wallet_address.toLowerCase() === connectedWalletAddress?.toLowerCase()
  );

  const handlePlanetClick = () => {
    setIsPlanetSelected(true);
  };

  const handleConnectWallet = async () => {
    try {
      const { solana } = window as any;
      
      if (!solana?.isPhantom) {
        window.open("https://phantom.app/download", "_blank");
        return;
      }

      console.log("Connecting to Phantom wallet...");
      
      const response = await solana.connect();
      const walletAddress = response.publicKey.toString();
      console.log("Connected to wallet:", walletAddress);
      
      setIsWalletConnected(true);
      setConnectedWalletAddress(walletAddress);
      
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleMyPlanetClick = () => {
    if (!connectedWalletAddress) return;
    console.log('Navigating to user planet:', connectedWalletAddress);
    setSelectedWallet(connectedWalletAddress);
    setIsPlanetSelected(true);
  };

  const handleWalletClick = (walletAddress: string) => {
    console.log('Wallet clicked:', walletAddress);
    setSelectedWallet(walletAddress);
    setIsPlanetSelected(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for wallet:', searchAddress);
    
    const foundHolder = activeHoldersRef.current?.find(
      holder => holder.wallet_address.toLowerCase() === searchAddress.toLowerCase()
    );

    if (foundHolder) {
      console.log('Found holder:', foundHolder);
      setSelectedWallet(foundHolder.wallet_address);
      setIsPlanetSelected(true);
    }
  };

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
      
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center w-full px-4 pt-4">
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

      <div className="fixed right-8 top-[120px] glass-panel p-4 w-[24rem] z-30 h-[calc(100vh-140px)] flex flex-col">
        <h2 className="text-lg font-semibold text-white mb-4">Planet Owners (Top 500)</h2>
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="h-full w-full">
              <HolderTable holders={activeHoldersRef.current} onWalletClick={handleWalletClick} />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default Index;
