import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   - SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  console.error("\nAdd these to your .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPhotos() {
  console.log("🚀 Setting up job photos feature...\n");

  try {
    // 1. Create job_photos table
    console.log("📋 Creating job_photos table...");
    const { error: tableError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS job_photos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          job_id UUID NOT NULL REFERENCES "Jobs"(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
          storage_path TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT now(),
          UNIQUE(job_id, photo_type)
        );

        CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);
        CREATE INDEX IF NOT EXISTS idx_job_photos_user_id ON job_photos(user_id);
      `,
    });

    if (tableError && !tableError.message.includes("already exists")) {
      throw tableError;
    }
    console.log("✅ job_photos table created\n");

    // 2. Create storage bucket
    console.log("🗂️  Creating storage bucket...");
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "job-photos");

    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket(
        "job-photos",
        {
          public: false,
        }
      );
      if (bucketError && !bucketError.message.includes("already exists")) {
        throw bucketError;
      }
    }
    console.log("✅ job-photos bucket created\n");

    // 3. Enable RLS
    console.log("🔒 Enabling Row Level Security...");
    await supabase.rpc("exec", {
      sql: `ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;`,
    });
    console.log("✅ RLS enabled\n");

    // 4. Create storage policies
    console.log("📋 Creating storage policies...");

    const policies = [
      {
        name: "Users can upload photos",
        operation: "INSERT",
        policy: `
          CREATE POLICY "Users can upload photos" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (
              bucket_id = 'job-photos' AND
              (storage.foldername(name))[1] = auth.uid()::text
            );
        `,
      },
      {
        name: "Users can read their photos",
        operation: "SELECT",
        policy: `
          CREATE POLICY "Users can read their photos" ON storage.objects
            FOR SELECT TO authenticated
            USING (
              bucket_id = 'job-photos' AND
              (storage.foldername(name))[1] = auth.uid()::text
            );
        `,
      },
      {
        name: "Users can delete their photos",
        operation: "DELETE",
        policy: `
          CREATE POLICY "Users can delete their photos" ON storage.objects
            FOR DELETE TO authenticated
            USING (
              bucket_id = 'job-photos' AND
              (storage.foldername(name))[1] = auth.uid()::text
            );
        `,
      },
    ];

    for (const p of policies) {
      const { error: policyError } = await supabase.rpc("exec", {
        sql: p.policy,
      });
      if (policyError && !policyError.message.includes("already exists")) {
        console.warn(`⚠️  Policy "${p.name}" may need manual setup`);
      }
    }

    console.log("✅ Storage policies configured\n");

    console.log("🎉 Setup complete!\n");
    console.log("You can now:");
    console.log("  1. Go to /jobs page");
    console.log("  2. Click 'Add/View Photos' on any job");
    console.log("  3. Upload before/after photos\n");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setupPhotos();
