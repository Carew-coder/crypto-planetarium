import React from 'react';
import { TableProps } from '@/types/universe';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const HolderTable: React.FC<TableProps> = ({ collapsed, onToggle }) => {
  return (
    <Card className="absolute left-4 top-1/2 -translate-y-1/2 bg-space-lighter/80 text-white border-white/10 w-64">
      <CardHeader className="relative">
        <CardTitle>Holder Information</CardTitle>
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
                <TableHead className="text-white/80">Address</TableHead>
                <TableHead className="text-white/80">Balance</TableHead>
                <TableHead className="text-white/80">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-white/70">0x1234...5678</TableCell>
                <TableCell className="text-white/70">1,000,000</TableCell>
                <TableCell className="text-white/70">10%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-white/70">0x8765...4321</TableCell>
                <TableCell className="text-white/70">500,000</TableCell>
                <TableCell className="text-white/70">5%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};

export default HolderTable;