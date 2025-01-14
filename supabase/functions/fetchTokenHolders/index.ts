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

    const tokenAddress = 'AVyjco9j8vv7ZPkhCpEoPJ3bLEuw7G1wrrNt8DrApump'
    const pageSize = 40 // Maximum allowed page size
    const numberOfPages = Math.ceil(500 / pageSize) // We want 500 holders total
    let allHolders: any[] = []

    console.log(`Fetching ${numberOfPages} pages of holders with ${pageSize} holders per page...`)

    for (let page = 1; page <= numberOfPages; page++) {
      const url = `https://pro-api.solscan.io/v2.0/token/holders?address=${tokenAddress}&page=${page}&page_size=${pageSize}`
      console.log(`Fetching page ${page} from Solscan API:`, url)
      
      const response = await fetch(url, {
        headers: {
          'token': apiToken,
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Solscan API request failed for page ${page}:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data || !data.data || !Array.isArray(data.data.items)) {
        console.error(`Unexpected data format from Solscan API for page ${page}:`, data)
        throw new Error('Invalid data format received from Solscan API')
      }

      allHolders = [...allHolders, ...data.data.items]
      console.log(`Successfully fetched page ${page}, total holders so far: ${allHolders.length}`)
    }

    console.log('Successfully fetched all pages. Processing data...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found')
      throw new Error('Supabase credentials not found')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client initialized')

    const TOTAL_SUPPLY = 1_000_000_000 // 1 billion tokens
    
    // Remove duplicates by using a Map with wallet_address as key
    const holdersMap = new Map()
    
    allHolders.forEach((holder: any) => {
      const amount = Number(holder.amount) / Math.pow(10, holder.decimals)
      const percentage = (amount / TOTAL_SUPPLY) * 100
      const walletAddress = holder.owner
      
      // If this wallet already exists in our map, add the amounts
      if (holdersMap.has(walletAddress)) {
        const existing = holdersMap.get(walletAddress)
        holdersMap.set(walletAddress, {
          wallet_address: walletAddress,
          token_amount: existing.token_amount + amount,
          percentage: existing.percentage + percentage,
        })
      } else {
        holdersMap.set(walletAddress, {
          wallet_address: walletAddress,
          token_amount: amount,
          percentage: percentage,
        })
      }
    })
    
    // Convert map to array and sort by token amount
    const holders = Array.from(holdersMap.values())
      .filter(holder => holder.token_amount > 0)
      .sort((a: any, b: any) => b.token_amount - a.token_amount)
      .slice(0, 500) // Ensure we only take the top 500 holders

    console.log('Transformed data. Number of holders:', holders.length)
    console.log('First holder example:', holders[0])

    console.log('Removing all existing data from planet_customizations...')
    const { error: truncateCustomizationsError } = await supabase
      .from('planet_customizations')
      .delete()
      .neq('wallet_address', 'dummy_value')

    if (truncateCustomizationsError) {
      console.error('Error truncating planet_customizations:', truncateCustomizationsError)
      throw truncateCustomizationsError
    }

    console.log('Removing all existing data from token_holders...')
    const { error: truncateHoldersError } = await supabase
      .from('token_holders')
      .delete()
      .neq('wallet_address', 'dummy_value')

    if (truncateHoldersError) {
      console.error('Error truncating token_holders:', truncateHoldersError)
      throw truncateHoldersError
    }

    console.log('Inserting new token holders...')
    const { error: insertError } = await supabase
      .from('token_holders')
      .insert(holders)

    if (insertError) {
      console.error('Error inserting new token holders:', insertError)
      throw insertError
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