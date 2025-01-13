import React from 'react';
import { TableProps } from '@/types/universe';
import { ChevronDown } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const HolderTable: React.FC<TableProps> = ({ collapsed, onToggle }) => {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 glass-panel p-4 w-80">
      <Collapsible open={!collapsed} onOpenChange={() => onToggle()}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <h2 className="text-lg font-semibold text-white">Holder Information</h2>
          <ChevronDown className={`h-5 w-5 text-white transition-transform ${!collapsed ? 'transform rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="max-h-[400px] overflow-auto mt-4">
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
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default HolderTable;