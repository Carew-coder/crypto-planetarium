import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Fetching token holders data...')
    const response = await fetch('https://public-api.solscan.io/token/holders?tokenAddress=So11111111111111111111111111111111111111112&offset=0&limit=50', {
      headers: {
        'accept': 'application/json',
        'token': Deno.env.get('SOLSCAN_API_TOKEN') || '',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Raw data fetched. Number of holders:', data.data?.length || 0)

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data format received from API')
    }

    const totalAmount = data.data.reduce((sum: number, holder: any) => {
      return sum + (parseFloat(holder.amount) || 0)
    }, 0)

    console.log('Total amount calculated:', totalAmount)

    const holders = data.data
      .map((holder: any) => {
        const amount = parseFloat(holder.amount) || 0
        const percentage = (amount / totalAmount) * 100

        return {
          wallet_address: holder.owner,
          token_amount: amount,
          percentage: percentage,
        }
      })
      .filter(holder => holder.percentage >= 0.01) // Filter out holders with less than 0.01%
      .sort((a: any, b: any) => b.token_amount - a.token_amount)

    console.log('Transformed data. Number of significant holders:', holders.length)
    console.log('First holder example:', holders[0])

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // First, get all existing wallet addresses
    const { data: existingHolders, error: fetchError } = await supabase
      .from('token_holders')
      .select('wallet_address')

    if (fetchError) {
      console.error('Error fetching existing holders:', fetchError)
      throw fetchError
    }

    const existingWallets = new Set(existingHolders?.map(h => h.wallet_address))
    
    // Separate holders into updates and inserts
    const updates = holders.filter(h => existingWallets.has(h.wallet_address))
    const inserts = holders.filter(h => !existingWallets.has(h.wallet_address))

    console.log(`Processing ${updates.length} updates and ${inserts.length} inserts`)

    // Handle updates first
    if (updates.length > 0) {
      for (const holder of updates) {
        const { error: updateError } = await supabase
          .from('token_holders')
          .update({
            token_amount: holder.token_amount,
            percentage: holder.percentage
          })
          .eq('wallet_address', holder.wallet_address)

        if (updateError) {
          console.error(`Error updating holder ${holder.wallet_address}:`, updateError)
          throw updateError
        }
      }
    }

    // Handle inserts
    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('token_holders')
        .insert(inserts)

      if (insertError) {
        console.error('Error inserting new holders:', insertError)
        throw insertError
      }
    }

    // Delete holders that no longer exist
    const currentWallets = new Set(holders.map(h => h.wallet_address))
    const walletsToDelete = Array.from(existingWallets).filter(w => !currentWallets.has(w))

    if (walletsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('token_holders')
        .delete()
        .in('wallet_address', walletsToDelete)

      if (deleteError) {
        console.error('Error deleting old holders:', deleteError)
        throw deleteError
      }
    }

    return new Response(
      JSON.stringify({ message: 'Token holders data updated successfully' }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error in fetchTokenHolders function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})