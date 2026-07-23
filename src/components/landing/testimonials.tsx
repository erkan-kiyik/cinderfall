"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah Kim",
    role: "Product Manager · Fintech",
    initials: "SK",
    quote:
      "Three weeks after applying Coseade's suggestions, I had recruiters from two FAANG companies in my inbox. The keyword analysis alone was worth it.",
  },
  {
    name: "Marcus Alvarez",
    role: "Senior Software Engineer",
    initials: "MA",
    quote:
      "The experience optimizer turned my vague bullet points into quantified achievements. My profile views went up 4× in a month.",
  },
  {
    name: "Priya Nair",
    role: "Marketing Director",
    initials: "PN",
    quote:
      "I used the post generator for 30 days straight. One post hit 200K impressions — my previous best was 3K. This tool understands LinkedIn.",
  },
  {
    name: "Tom Becker",
    role: "CS Student → SWE Intern",
    initials: "TB",
    quote:
      "As a student with no network, the ATS checker showed me exactly why my resume kept getting rejected. Fixed it, got 5 interviews in two weeks.",
  },
  {
    name: "Elena Petrova",
    role: "Startup Founder",
    initials: "EP",
    quote:
      "The career coach helped me script a salary negotiation that added $28K to an offer. Best $12 I've ever spent, by a comfortable margin.",
  },
  {
    name: "David Osei",
    role: "Data Scientist",
    initials: "DO",
    quote:
      "Skills analyzer flagged three trending skills I was missing. Added them with real projects, and my recruiter InMails doubled.",
  },
];

export function Testimonials() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by <span className="gradient-text">ambitious professionals</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands who turned their profiles into opportunity magnets.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="glass flex flex-col rounded-3xl p-6"
            >
              <div className="flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{t.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
