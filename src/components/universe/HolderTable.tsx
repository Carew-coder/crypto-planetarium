import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Database } from '@/integrations/supabase/types';

type TokenHolder = Database['public']['Tables']['token_holders']['Row'];

interface HolderTableProps {
  holders: TokenHolder[] | null;
  onWalletClick: (walletAddress: string) => void;
}

const HolderTable: React.FC<HolderTableProps> = ({ holders, onWalletClick }) => {
  console.log('Rendering HolderTable with all holders:', holders?.length);
  
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-black/50 backdrop-blur-sm">
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
            onClick={() => onWalletClick(holder.wallet_address)}
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
  );
};

export default HolderTable;