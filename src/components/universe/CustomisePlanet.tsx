import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const CustomisePlanet = () => {
  return (
    <Card className="glass-panel p-4 w-[32rem] mt-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Customise Planet</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-white/70">Customization options coming soon...</p>
      </CardContent>
    </Card>
  );
};

export default CustomisePlanet;