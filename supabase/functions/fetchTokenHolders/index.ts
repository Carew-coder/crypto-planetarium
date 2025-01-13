import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, apiKey: string, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} to fetch data from Solana Tracker API`);
      const response = await fetch(url, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
        continue;
      }

      throw new Error(`API request failed: ${response.statusText}. Status: ${response.status}. Body: ${await response.text()}`);
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      if (attempt < maxRetries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        await sleep(waitTime);
      }
    }
  }
  throw lastError;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting fetchTokenHolders function...')
    
    const apiKey = Deno.env.get('SOLANA_TRACKER_API_KEY')
    if (!apiKey) {
      throw new Error('API key not found')
    }

    const tokenAddress = 'GxHJDpqpPGjeM1n9y2WnDxjJzXzL43p593DdauEmXTkE'
    const url = `https://data.solanatracker.io/tokens/${tokenAddress}/holders`

    console.log('Making API request to:', url)
    
    const data = await fetchWithRetry(url, apiKey);
    
    if (!data) {
      throw new Error('Empty API response')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client initialized')

    // Get current wallet addresses
    const { data: currentHolders } = await supabase
      .from('token_holders')
      .select('wallet_address');

    const currentWallets = new Set(currentHolders?.map(h => h.wallet_address) || []);
    
    // Transform new data
    let holders;
    if (Array.isArray(data)) {
      holders = data.map((holder: any) => ({
        wallet_address: holder.owner,
        token_amount: holder.amount,
        percentage: (holder.amount / holder.total_supply) * 100,
      }));
    } else if (data.accounts && Array.isArray(data.accounts)) {
      holders = data.accounts.map((holder: any) => ({
        wallet_address: holder.wallet || holder.owner,
        token_amount: holder.amount,
        percentage: holder.percentage || (holder.amount / holder.total_supply) * 100,
      }));
    } else {
      throw new Error('Invalid data format received from API');
    }

    // Find wallets to remove
    const newWallets = new Set(holders.map(h => h.wallet_address));
    const walletsToRemove = [...currentWallets].filter(w => !newWallets.has(w));

    if (walletsToRemove.length > 0) {
      console.log('Removing old wallet data:', walletsToRemove);
      
      // First remove related planet customizations
      const { error: deleteCustomizationsError } = await supabase
        .from('planet_customizations')
        .delete()
        .in('wallet_address', walletsToRemove);

      if (deleteCustomizationsError) {
        console.error('Error deleting planet customizations:', deleteCustomizationsError);
        throw deleteCustomizationsError;
      }

      // Then remove token holders
      const { error: deleteHoldersError } = await supabase
        .from('token_holders')
        .delete()
        .in('wallet_address', walletsToRemove);

      if (deleteHoldersError) {
        console.error('Error deleting token holders:', deleteHoldersError);
        throw deleteHoldersError;
      }
    }

    // Upsert new data
    const { error: upsertError } = await supabase
      .from('token_holders')
      .upsert(holders, {
        onConflict: 'wallet_address',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Error upserting data:', upsertError);
      throw upsertError;
    }

    console.log('Successfully updated token holders data');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Token holders data updated successfully',
      count: holders.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetchTokenHolders function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});