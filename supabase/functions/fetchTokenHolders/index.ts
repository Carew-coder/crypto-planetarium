import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting fetchTokenHolders function using Solscan API...')
    
    const apiToken = Deno.env.get('SOLSCAN_API_TOKEN')
    if (!apiToken) {
      console.error('SOLSCAN_API_TOKEN not found in environment variables')
      throw new Error('API token not found')
    }

    console.log('Retrieved Solscan API token successfully')

    const tokenAddress = '8PVVGVZSkrrLtxZDdH7zRonCwCff9FhY7Wk6Yh71pump'
    const batchSize = 40
    let page = 1
    let allHolders: any[] = []
    let hasMore = true

    while (hasMore) {
      console.log(`Fetching page ${page} of holders...`)
      const url = `https://pro-api.solscan.io/v2.0/token/holders?address=${tokenAddress}&page=${page}&page_size=${batchSize}`
      
      const response = await fetch(url, {
        headers: {
          'token': apiToken,
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Solscan API request failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data || !data.data || !Array.isArray(data.data.items)) {
        console.error('Unexpected data format from Solscan API:', data)
        throw new Error('Invalid data format received from Solscan API')
      }

      const currentBatchHolders = data.data.items
      if (currentBatchHolders.length === 0) {
        hasMore = false
      } else {
        allHolders = [...allHolders, ...currentBatchHolders]
        page++
      }

      // If we've fetched more than 1000 holders or there are no more results, stop
      if (page > 25 || currentBatchHolders.length < batchSize) {
        hasMore = false
      }
    }

    console.log(`Total holders fetched: ${allHolders.length}`)

    const TOTAL_SUPPLY = 1_000_000_000 // 1 billion tokens
    
    const holders = allHolders.map((holder: any) => {
      const amount = Number(holder.amount) / Math.pow(10, holder.decimals)
      const percentage = (amount / TOTAL_SUPPLY) * 100
      
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
      console.error('Supabase credentials not found')
      throw new Error('Supabase credentials not found')
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

    console.log('Successfully updated token holders database')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Token holders data updated successfully',
      count: holders.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in fetchTokenHolders function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})