import React from 'react';
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

interface CustomisePlanetProps {
  walletAddress: string;
}

interface FormValues {
  nickname: string;
  skin: FileList;
}

const CustomisePlanet = ({ walletAddress }: CustomisePlanetProps) => {
  const form = useForm<FormValues>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const queryClient = useQueryClient();

  // Query to get current planet customization
  const { data: currentCustomization } = useQuery({
    queryKey: ['planetCustomization', walletAddress],
    queryFn: async () => {
      console.log('Fetching current planet customization for wallet:', walletAddress);
      const { data } = await supabase
        .from('planet_customizations')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();
      return data;
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      console.log('Customizing planet for wallet:', walletAddress);

      // Only update skin_url if a new file is uploaded
      let skinUrl = currentCustomization?.skin_url || null;
      if (data.skin?.[0]) {
        const file = data.skin[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${walletAddress}-${Date.now()}.${fileExt}`;

        console.log('Uploading new skin file:', fileName);
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('planet_skins')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading skin:', uploadError);
          throw new Error('Failed to upload planet skin');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('planet_skins')
          .getPublicUrl(fileName);

        skinUrl = publicUrl;
      }

      console.log('Updating planet customization in database with skin:', skinUrl);
      const { error: dbError } = await supabase
        .from('planet_customizations')
        .upsert(
          {
            wallet_address: walletAddress,
            nickname: data.nickname,
            skin_url: skinUrl
          },
          {
            onConflict: 'wallet_address',
            ignoreDuplicates: false
          }
        );

      if (dbError) {
        console.error('Error saving customization:', dbError);
        throw new Error('Failed to save planet customization');
      }

      // Invalidate queries and show success message
      await queryClient.invalidateQueries({ queryKey: ['planetCustomizations'] });
      await queryClient.invalidateQueries({ queryKey: ['tokenHolders'] });

      toast.success('Planet customized successfully! Refreshing page...');
      form.reset();
      
      // Add a small delay before refreshing to ensure the toast is visible
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error in planet customization:', error);
      toast.error('Failed to customize planet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-panel p-4 w-[32rem] mt-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Customise Planet</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Planet Nickname</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a nickname for your planet" 
                      className="bg-space-lighter/50 border-white/10 text-white placeholder:text-white/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="skin"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel className="text-white">Planet Skin</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      className="bg-space-lighter/50 border-white/10 text-white file:text-white file:bg-space-lighter hover:file:bg-space-accent/20"
                      onChange={(e) => onChange(e.target.files)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-space-lighter text-white hover:bg-space-accent/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Customizing...
                </>
              ) : (
                'Save Customization'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CustomisePlanet;