import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user profile exists
        const { data: profile } = await supabase
          .from("users")
          .select("is_profile_complete")
          .eq("auth_id", user.id)
          .single();

        if (!profile) {
          // Create initial user record
          await supabase.from("users").insert({
            auth_id: user.id,
            google_id: user.user_metadata.sub,
            profile_image: user.user_metadata.avatar_url,
            nickname: null,
            is_profile_complete: false,
          });
          return NextResponse.redirect(`${origin}/profile-setup`);
        }

        if (!profile.is_profile_complete) {
          return NextResponse.redirect(`${origin}/profile-setup`);
        }

        return NextResponse.redirect(`${origin}/home`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
