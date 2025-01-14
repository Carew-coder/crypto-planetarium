import React from 'react';
import { TableProps } from '@/types/universe';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Database } from '@/integrations/supabase/types';

type TokenHolder = Database['public']['Tables']['token_holders']['Row'];

const HolderTable: React.FC<TableProps> = ({ collapsed, onToggle }) => {
  const { data: holders, isLoading, error } = useQuery({
    queryKey: ['tokenHolders'],
    queryFn: async () => {
      console.log('Fetching token holders data...');
      
      await supabase.functions.invoke('fetchTokenHolders')
      
      const { data, error } = await supabase
        .from('token_holders')
        .select('*')
        .order('percentage', { ascending: false })
        .limit(500)

      if (error) {
        console.error('Error fetching token holders:', error);
        throw error;
      }
      
      console.log('Successfully fetched token holders data:', data);
      return data as TokenHolder[];
    },
    refetchInterval: 60000,
  });

  if (error) {
    console.error('Error fetching holders:', error);
  }

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 glass-panel p-4 w-[32rem]">
      <h2 className="text-lg font-semibold text-white mb-4">Top Holders ({holders?.length || 0})</h2>
      {isLoading ? (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white/80">Wallet</TableHead>
              <TableHead className="text-white/80">Holding %</TableHead>
              <TableHead className="text-white/80">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holders?.map((holder) => (
              <TableRow key={holder.wallet_address}>
                <TableCell className="text-white/70">
                  {holder.wallet_address.slice(0, 6)}...{holder.wallet_address.slice(-4)}
                </TableCell>
                <TableCell className="text-white/70">
                  {Number(holder.percentage).toFixed(2)}%
                </TableCell>
                <TableCell className="text-white/70">
                  {Number(holder.token_amount).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default HolderTable;