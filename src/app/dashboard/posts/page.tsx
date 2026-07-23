import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { PostsClient } from "@/components/features/posts-client";

export const metadata: Metadata = { title: "Post Generator" };

export default function PostsPage() {
  return (
    <div>
      <PageHeader
        title="LinkedIn Post Generator"
        description="Turn any topic into a scroll-stopping post — hook, story, CTA, hashtags, plus carousel ideas and the best time to publish."
      />
      <PostsClient />
    </div>
  );
}
