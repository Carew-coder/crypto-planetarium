import React from 'react';
import { TableProps } from '@/types/universe';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const HolderTable: React.FC<TableProps> = () => {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 glass-panel p-4 w-96">
      <h2 className="text-lg font-semibold text-white mb-4">Holder Information</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white/80">Planet</TableHead>
            <TableHead className="text-white/80">Holding %</TableHead>
            <TableHead className="text-white/80">Amount</TableHead>
            <TableHead className="text-white/80">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="text-white/70">0x1234...5678</TableCell>
            <TableCell className="text-white/70">10%</TableCell>
            <TableCell className="text-white/70">1,000,000</TableCell>
            <TableCell className="text-white/70">$500</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default HolderTable;