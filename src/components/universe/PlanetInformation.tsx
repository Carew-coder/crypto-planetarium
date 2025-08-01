import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
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
  const isSun = holder.wallet_address === 'sun';

  // Only query rank if it's not the sun
  const { data: rank } = useQuery({
    queryKey: ['holderRank', holder.wallet_address],
    queryFn: async () => {
      if (isSun) return null;
      
      console.log('Fetching holder rank for wallet:', holder.wallet_address);
      
      const { data: holders } = await supabase
        .from('token_holders')
        .select('percentage')
        .order('percentage', { ascending: false });

      if (!holders) return 1;
      
      const position = holders.findIndex(h => h.percentage === holder.percentage) + 1;
      console.log('Holder rank:', position);
      
      return position;
    },
    enabled: !isSun // Only run the query if it's not the sun
  });

  // Only query customization if it's not the sun
  const { data: planetCustomization } = useQuery({
    queryKey: ['planetCustomization', holder.wallet_address],
    queryFn: async () => {
      if (isSun) return null;
      
      console.log('Fetching planet customization for wallet:', holder.wallet_address);
      
      const { data } = await supabase
        .from('planet_customizations')
        .select('nickname')
        .eq('wallet_address', holder.wallet_address)
        .maybeSingle();
      
      return data;
    },
    enabled: !isSun // Only run the query if it's not the sun
  });

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
      <div className="glass-panel p-4 w-[32rem]">
        <h2 className="text-lg font-semibold text-white mb-4">
          {isSun ? 'Solar System Center' : 'Planet Information'}
        </h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-white/70">Name</TableCell>
              <TableCell className="text-white/70">
                {isSun ? 'Sun' : (planetCustomization?.nickname || `${holder.wallet_address.slice(0, 6)}...${holder.wallet_address.slice(-4)}`)}
              </TableCell>
            </TableRow>
            {!isSun && (
              <>
                <TableRow>
                  <TableCell className="text-white/70">Rank</TableCell>
                  <TableCell className="text-white/70">#{rank || '...'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-white/70">Wallet</TableCell>
                  <TableCell className="text-white/70">{`${holder.wallet_address.slice(0, 6)}...${holder.wallet_address.slice(-4)}`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-white/70">Percentage</TableCell>
                  <TableCell className="text-white/70">{`${holder.percentage.toFixed(2)}%`}</TableCell>
                </TableRow>
              </>
            )}
            {isSun && (
              <TableRow>
                <TableCell className="text-white/70">Description</TableCell>
                <TableCell className="text-white/70">The central star of our solar system</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {isOwnPlanet && !isSun && <CustomisePlanet walletAddress={holder.wallet_address} />}
    </div>
  );
};

export default PlanetInformation;