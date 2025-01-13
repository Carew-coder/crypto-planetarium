import React from 'react';
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

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
      <div className="glass-panel p-4 w-[32rem]">
        <h2 className="text-lg font-semibold text-white mb-4">Planet Information</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white/80">Property</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-white/70">Rank</TableCell>
              <TableCell className="text-white/70">#{holder.percentage.toFixed(2)}</TableCell>
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
      {isOwnPlanet && <CustomisePlanet walletAddress={holder.wallet_address} />}
    </div>
  );
};

export default PlanetInformation;