"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  FileSearch,
  Lightbulb,
  MessageSquareText,
  PenLine,
  ScanSearch,
  Type,
} from "lucide-react";

const features = [
  {
    icon: ScanSearch,
    title: "Profile Analyzer",
    description:
      "Upload your LinkedIn PDF or paste your profile. Get scored across 6 recruiter-critical dimensions in seconds.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: FileSearch,
    title: "ATS Checker",
    description:
      "Compare your resume against any job description. See your match %, missing keywords, and exactly what to fix.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Type,
    title: "Headline Generator",
    description:
      "10 optimized headlines per generation, in 8 styles from Executive to AI Engineer. Front-loaded with searchable keywords.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: PenLine,
    title: "About & Experience Writer",
    description:
      "Story-driven About sections in 6 tones, plus STAR-format experience rewrites that turn duties into measurable achievements.",
    gradient: "from-rose-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Skills Analyzer",
    description:
      "Discover missing skills, trending skills in your field, and the exact ATS keywords recruiters search for.",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    icon: MessageSquareText,
    title: "Post Generator",
    description:
      "Turn any topic into a scroll-stopping post with hook, story, CTA, hashtags, carousel ideas, and best posting time.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Bot,
    title: "AI Career Coach",
    description:
      "Chat with a coach that knows interviews, salary negotiation, career roadmaps, and networking inside out.",
    gradient: "from-cyan-500 to-sky-500",
  },
  {
    icon: Lightbulb,
    title: "Career Toolkit",
    description:
      "Cover letters, networking messages, referral requests, interview prep, and a weekly content calendar — on demand.",
    gradient: "from-blue-500 to-indigo-500",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to <span className="gradient-text">stand out</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Eight AI-powered tools that work together to make recruiters stop scrolling.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              whileHover={{ y: -4 }}
              className="glass group rounded-3xl p-6 transition-shadow hover:shadow-xl hover:shadow-violet-500/10"
            >
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
