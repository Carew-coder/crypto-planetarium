import React from 'react';
import { TableProps } from '@/types/universe';
import { ChevronDown } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const HolderTable: React.FC<TableProps> = ({ collapsed, onToggle }) => {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 glass-panel p-4 w-96">
      <Collapsible open={!collapsed} onOpenChange={() => onToggle()}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <h2 className="text-lg font-semibold text-white">Holder Information</h2>
          <ChevronDown className={`h-5 w-5 text-white transition-transform ${!collapsed ? 'transform rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4">
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
                  <TableCell className="text-white/70">Mercury</TableCell>
                  <TableCell className="text-white/70">10%</TableCell>
                  <TableCell className="text-white/70">1,000,000</TableCell>
                  <TableCell className="text-white/70">$500</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-white/70">Venus</TableCell>
                  <TableCell className="text-white/70">5%</TableCell>
                  <TableCell className="text-white/70">500,000</TableCell>
                  <TableCell className="text-white/70">$250</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-white/70">Earth</TableCell>
                  <TableCell className="text-white/70">15%</TableCell>
                  <TableCell className="text-white/70">1,500,000</TableCell>
                  <TableCell className="text-white/70">$750</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-white/70">Mars</TableCell>
                  <TableCell className="text-white/70">8%</TableCell>
                  <TableCell className="text-white/70">800,000</TableCell>
                  <TableCell className="text-white/70">$400</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-white/70">Jupiter</TableCell>
                  <TableCell className="text-white/70">20%</TableCell>
                  <TableCell className="text-white/70">2,000,000</TableCell>
                  <TableCell className="text-white/70">$1,000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default HolderTable;