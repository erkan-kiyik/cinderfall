"use client";

import { motion } from "framer-motion";
import { AccordionItem } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the profile analysis work?",
    answer:
      "Upload your LinkedIn PDF export (Profile → More → Save to PDF) or paste your profile text. Our AI evaluates every section — headline, about, experience, education, skills, certifications, and projects — the way a senior recruiter and an ATS parser would, then returns scores and prioritized, actionable fixes.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. Your profile data is encrypted in transit and at rest, is never sold or shared, and is only used to generate your results. You can delete your account and all associated data at any time from Settings.",
  },
  {
    question: "What do I get on the free plan?",
    answer:
      "The free plan includes 3 profile analyses and 3 AI post generations per day, plus the headline generator, about generator, experience optimizer, and skills analyzer with daily limits. No credit card required.",
  },
  {
    question: "What's included in Pro?",
    answer:
      "Pro ($12/month) unlocks unlimited analyses and generations, priority access to the latest AI models, the ATS Checker with job-description matching, the AI Career Coach, the resume and cover letter toolkit, and exportable reports.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. Manage or cancel your subscription in one click from the Billing page — you keep Pro access until the end of your paid period, then automatically move to the free plan.",
  },
  {
    question: "Will recruiters know I used AI?",
    answer:
      "No. Coseade generates suggestions grounded in your real experience — you review, personalize, and approve everything before it goes on your profile. The output is a stronger version of your story, not a generic template.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-12 flex max-w-2xl flex-col gap-3"
        >
          {faqs.map((faq, i) => (
            <AccordionItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              defaultOpen={i === 0}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
