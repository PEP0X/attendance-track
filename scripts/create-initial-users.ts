import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[v0] Error: Missing required environment variables")
  console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const users = [
  { name: "Abanoub", email: "abanoub@level2.com", password: "password123", role: "admin" as const },
  { name: "Marina", email: "marina@level2.com", password: "password123", role: "servant" as const },
  { name: "Mariam", email: "mariam@level2.com", password: "password123", role: "servant" as const },
  { name: "Kero", email: "kero@level2.com", password: "password123", role: "servant" as const },
]

async function createInitialUsers() {
  console.log("[v0] Starting user creation...")

  for (const user of users) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      })

      if (authError) {
        console.error(`[v0] Error creating auth user for ${user.name}:`, authError.message)
        continue
      }

      console.log(`[v0] Created auth user for ${user.name}`)

      // Insert into users table
      const { error: dbError } = await supabase.from("users").insert({
        id: authData.user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })

      if (dbError) {
        console.error(`[v0] Error inserting user ${user.name} into database:`, dbError.message)
      } else {
        console.log(`[v0] ✓ Successfully created user: ${user.name} (${user.email})`)
      }
    } catch (error) {
      console.error(`[v0] Unexpected error for ${user.name}:`, error)
    }
  }

  console.log("[v0] User creation complete!")
  console.log("\n=== Login Credentials ===")
  users.forEach((user) => {
    console.log(`${user.name}: ${user.email} / ${user.password}`)
  })
}

createInitialUsers()
