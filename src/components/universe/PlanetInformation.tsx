import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomisePlanet from './CustomisePlanet';

interface PlanetInformationProps {
  holder: {
    wallet_address: string;
    token_amount: number;
    percentage: number;
  } | null;
  connectedWalletAddress?: string | null;
}

const PlanetInformation = ({ holder, connectedWalletAddress }: PlanetInformationProps) => {
  if (!holder) return null;

  const isOwnPlanet = connectedWalletAddress?.toLowerCase() === holder.wallet_address.toLowerCase();

  // Find the rank of the holder by fetching all holders and sorting them
  const getRank = async () => {
    const { data: holders } = await supabase
      .from('token_holders')
      .select('percentage')
      .gte('percentage', holder.percentage)
      .order('percentage', { ascending: false });
    
    return holders?.length || 1;
  };

  const { data: rank } = useQuery({
    queryKey: ['holderRank', holder.wallet_address],
    queryFn: getRank
  });

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
      <div className="glass-panel p-4 w-[32rem]">
        <h2 className="text-lg font-semibold text-white mb-4">Planet Information</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white/80">Property</TableHead>
              <TableHead className="text-white/80">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-white/70">Rank</TableCell>
              <TableCell className="text-white/70">#{rank}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-white/70">Wallet</TableCell>
              <TableCell className="text-white/70">{`${holder.wallet_address.slice(0, 6)}...${holder.wallet_address.slice(-4)}`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-white/70">Percentage</TableCell>
              <TableCell className="text-white/70">{`${holder.percentage.toFixed(2)}%`}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      {isOwnPlanet && <CustomisePlanet />}
    </div>
  );
};

export default PlanetInformation;