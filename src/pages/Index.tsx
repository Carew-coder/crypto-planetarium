import Universe from "@/components/Universe";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const Index = () => {
  const [searchAddress, setSearchAddress] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [isOldestOpen, setIsOldestOpen] = useState(true);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Universe />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-3">
        <h1 className="text-xl font-semibold text-white">Solar</h1>
      </div>
      
      {/* Visit Planets Table */}
      <div className="absolute right-4 top-4 glass-panel p-4 w-80">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h2 className="text-lg font-semibold text-white">Visit Planets</h2>
            <ChevronDown className={`h-5 w-5 text-white transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Input
              type="text"
              placeholder="Search wallet address..."
              className="mb-4 mt-4 bg-space-lighter/50 border-white/10 text-white placeholder:text-white/50"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
            />
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/80">Planets</TableHead>
                    <TableHead className="text-white/80">Holding %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Example rows - replace with actual data */}
                  <TableRow>
                    <TableCell className="text-white/70">0x1234...5678</TableCell>
                    <TableCell className="text-white/70">4.2%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-white/70">0x8765...4321</TableCell>
                    <TableCell className="text-white/70">2.8%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Oldest Planets Table */}
      <div className="absolute right-4 top-[calc(4rem+340px)] glass-panel p-4 w-80">
        <Collapsible open={isOldestOpen} onOpenChange={setIsOldestOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h2 className="text-lg font-semibold text-white">Oldest Planets</h2>
            <ChevronDown className={`h-5 w-5 text-white transition-transform ${isOldestOpen ? 'transform rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="max-h-[400px] overflow-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/80">Planet</TableHead>
                    <TableHead className="text-white/80">Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-white/70">Mercury</TableCell>
                    <TableCell className="text-white/70">4.5</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-white/70">Venus</TableCell>
                    <TableCell className="text-white/70">4.5</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default Index;