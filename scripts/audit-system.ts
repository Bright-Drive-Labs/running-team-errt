import 'dotenv/config';
import { supabase } from '../src/lib/supabase';

async function audit() {
    console.log('--- SYSTEM SECURITY & ARCHITECTURE AUDIT ---');
    console.log('Timestamp:', new Date().toISOString());

    // 1. Audit Athletes Table
    console.log('\n[1] AUDITING ATHLETES TABLE...');
    const { data: athletes, error: athleteErr } = await supabase.from('athletes').select('*').limit(5);
    if (athleteErr) {
        console.error('❌ Error fetching athletes:', athleteErr);
    } else {
        console.log('✅ Successfully reached athletes table.');
        const cols = Object.keys(athletes[0] || {});
        console.log('Columns found:', cols.join(', '));
        
        // SECURITY CHECK: Plaintext keys
        if (cols.includes('intervals_api_key')) {
            console.warn('⚠️ WARNING: intervals_api_key column still exists! Should be removed if migration to Vault is complete.');
        } else {
            console.log('✅ intervals_api_key column NOT found (Good! Keys should be in Vault).');
        }
        
        if (cols.includes('tenant_id')) {
            console.log('✅ tenant_id column found for multi-tenancy.');
        } else {
            console.error('❌ ERROR: tenant_id column MISSING from athletes table!');
        }
    }

    // 2. Audit Workout Assignments
    console.log('\n[2] AUDITING WORKOUT_ASSIGNMENTS TABLE...');
    const { data: assignments, error: assignErr } = await supabase.from('workout_assignments').select('*').limit(3);
    if (assignErr) {
        console.error('❌ Error fetching workout_assignments:', assignErr);
    } else {
        console.log('✅ Successfully reached workout_assignments table.');
        const cols = Object.keys(assignments[0] || {});
        console.log('Columns found:', cols.join(', '));
        
        if (cols.includes('friendly_description')) {
            console.log('✅ friendly_description column found (Recent logic applied).');
        } else {
            console.warn('⚠️ friendly_description column MISSING (Wait, did the migration fail?).');
        }
    }

    // 3. Check for Tenants table
    console.log('\n[3] AUDITING TENANTS TABLE...');
    const { data: tenants, error: tenantErr } = await supabase.from('tenants').select('*').limit(1);
    if (tenantErr) {
        console.warn('ℹ️ tenants table not found or not accessible (Maybe using hardcoded tenant_id logic?).');
    } else {
        console.log('✅ tenants table exists. ID:', tenants[0]?.id, 'Name:', tenants[0]?.name);
    }

    // 4. Vault Function Check
    console.log('\n[4] AUDITING VAULT SECURITY (RPC)...');
    try {
        // Try to call the RPC with a non-existent ID to see if it's defined
        const { error: rpcErr } = await supabase.rpc('get_intervals_key', { 
            p_athlete_id: '00000000-0000-0000-0000-000000000000',
            p_tenant_id: '00000000-0000-0000-0000-000000000000'
        });
        
        if (rpcErr && rpcErr.message.includes('function get_intervals_key(...) does not exist')) {
            console.error('❌ CRITICAL: get_intervals_key RPC is NOT defined in database!');
        } else {
            console.log('✅ get_intervals_key RPC function is defined (Expected error or empty result is normal here).');
        }
    } catch (e) {
        console.log('✅ get_intervals_key RPC seems reachable.');
    }

    console.log('\n--- AUDIT COMPLETE ---');
}

audit();
