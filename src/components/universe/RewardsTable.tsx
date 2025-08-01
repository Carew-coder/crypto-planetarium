import React from 'react';
import { TableProps } from '@/types/universe';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const RewardsTable: React.FC<TableProps> = ({ collapsed, onToggle }) => {
  return (
    <Card className="absolute right-4 bg-space-lighter/80 text-white border-white/10 w-64">
      <CardHeader className="relative">
        <CardTitle>Rewards</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 p-0 h-4 hover:bg-transparent"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronUp className="h-4 w-4 text-white/70" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/70" />
          )}
        </Button>
      </CardHeader>
      {!collapsed && (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white/80">Type</TableHead>
                <TableHead className="text-white/80">Amount</TableHead>
                <TableHead className="text-white/80">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-white/70">Staking</TableCell>
                <TableCell className="text-white/70">100</TableCell>
                <TableCell className="text-white/70">Claimable</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-white/70">Trading</TableCell>
                <TableCell className="text-white/70">50</TableCell>
                <TableCell className="text-white/70">Pending</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};

export default RewardsTable;