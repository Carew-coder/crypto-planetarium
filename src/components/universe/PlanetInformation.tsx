import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlanetInformationProps {
  holder: {
    wallet_address: string;
    token_amount: number;
    percentage: number;
  } | null;
}

const PlanetInformation = ({ holder }: PlanetInformationProps) => {
  if (!holder) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-space-lighter p-4 rounded-lg border border-space-accent/20 w-80 z-50">
      <h3 className="text-xl font-bold mb-4 text-white">Planet Information</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white">Property</TableHead>
            <TableHead className="text-white">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="text-white">Wallet</TableCell>
            <TableCell className="text-white">{`${holder.wallet_address.slice(0, 6)}...${holder.wallet_address.slice(-4)}`}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-white">Amount</TableCell>
            <TableCell className="text-white">{holder.token_amount.toLocaleString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-white">Percentage</TableCell>
            <TableCell className="text-white">{`${holder.percentage.toFixed(2)}%`}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default PlanetInformation;