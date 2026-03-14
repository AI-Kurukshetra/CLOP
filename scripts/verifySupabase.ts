import fs from 'node:fs'
import path from 'node:path'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type DemoCreds = {
  email: string
  password: string
}

function loadLocalEnvFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName)
  if (!fs.existsSync(filePath)) {
    return
  }

  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    if (!key || key in process.env) {
      continue
    }

    let value = line.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function signIn(url: string, anonKey: string, creds: DemoCreds) {
  const client = createClient(url, anonKey)
  const { data, error } = await client.auth.signInWithPassword({
    email: creds.email,
    password: creds.password,
  })

  if (error || !data.user) {
    throw new Error(`Auth failed for ${creds.email}: ${error?.message ?? 'Unknown auth error'}`)
  }

  return { client, userId: data.user.id }
}

async function assertNoTableError(client: SupabaseClient, table: string, label: string) {
  const { error } = await client.from(table).select('*').limit(1)
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }
}

async function run() {
  loadLocalEnvFile('.env')
  loadLocalEnvFile('.env.local')

  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  let failures = 0
  const checks: Array<{ name: string; execute: () => Promise<void> }> = []

  checks.push({
    name: 'Borrower auth + profile',
    execute: async () => {
      const { client, userId } = await signIn(supabaseUrl, anonKey, {
        email: 'borrower@demo.com',
        password: 'Demo@1234',
      })
      const { data, error } = await client
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle()
      if (error) {
        throw new Error(error.message)
      }
      if (!data) {
        throw new Error('Profile row not found for borrower user')
      }

      await assertNoTableError(client, 'loan_products', 'Borrower loan_products read failed')
      await assertNoTableError(client, 'loan_applications', 'Borrower loan_applications read failed')
      await assertNoTableError(client, 'documents', 'Borrower documents read failed')
      await assertNoTableError(client, 'notifications', 'Borrower notifications read failed')
      await client.auth.signOut()
    },
  })

  checks.push({
    name: 'Officer auth + cross-profile/app access',
    execute: async () => {
      const { client, userId } = await signIn(supabaseUrl, anonKey, {
        email: 'officer@demo.com',
        password: 'Demo@1234',
      })

      const { data: ownProfile, error: ownProfileError } = await client
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle()
      if (ownProfileError) {
        throw new Error(`Own profile read failed: ${ownProfileError.message}`)
      }
      if (!ownProfile) {
        throw new Error('Officer own profile row not found')
      }

      const { error: allProfilesError } = await client.from('profiles').select('id').limit(5)
      if (allProfilesError) {
        throw new Error(`Officer all-profiles read failed: ${allProfilesError.message}`)
      }

      await assertNoTableError(client, 'loan_applications', 'Officer loan_applications read failed')
      await assertNoTableError(client, 'documents', 'Officer documents read failed')
      await assertNoTableError(client, 'audit_logs', 'Officer audit_logs read failed')
      await client.auth.signOut()
    },
  })

  for (const check of checks) {
    try {
      await check.execute()
      console.info(`PASS: ${check.name}`)
    } catch (error) {
      failures += 1
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`FAIL: ${check.name}`)
      console.error(`  ${message}`)
    }
  }

  if (failures > 0) {
    process.exit(1)
  }

  console.info('All Supabase checks passed.')
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown verification error'
  console.error(`Verification failed: ${message}`)
  process.exit(1)
})
