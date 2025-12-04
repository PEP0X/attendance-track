import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function getMembers() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true })
    
    if (error) {
      console.error("Data Service: Error fetching members:", error)
      return []
    }
    return data || []
  } catch (err) {
    console.error("Data Service: Unexpected error fetching members:", err)
    return []
  }
}

export async function getUsers() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.from("users").select("id,name")
    
    if (error) {
      console.error("Data Service: Error fetching users:", error)
      return []
    }
    return (data || []).map((u: any) => ({ id: u.id, name: u.name }))
  } catch (err) {
    console.error("Data Service: Unexpected error fetching users:", err)
    return []
  }
}

export async function getAssignments() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.from("member_assignments").select("member_id,servant_id")
    
    if (error) {
      console.error("Data Service: Error fetching assignments:", error)
      return {}
    }
    
    const map: Record<string, string | null> = {}
    ;(data || []).forEach((row: { member_id: string; servant_id: string | null }) => {
      map[row.member_id] = row.servant_id
    })
    return map
  } catch (err) {
    console.error("Data Service: Unexpected error fetching assignments:", err)
    return {}
  }
}
