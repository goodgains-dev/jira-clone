"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Layout,
  Calendar,
  BarChart,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CompanyCarousel from "@/components/company-carousel";
import Image from "next/image";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "What is DESKS?",
    answer:
      "DESKS is a powerful project management tool designed to help teams organize, track, and manage their work efficiently. It combines intuitive design with robust features to streamline your workflow and boost productivity.",
  },
  {
    question: "How does DESKS compare to other project management tools?",
    answer:
      "DESKS offers a unique combination of intuitive design, powerful features, and flexibility. Unlike other tools, we focus on providing a seamless experience for both agile and traditional project management methodologies, making it versatile for various team structures and project types.",
  },
  {
    question: "Is DESKS suitable for small teams?",
    answer:
      "Absolutely! DESKS is designed to be scalable and flexible. It works great for small teams and can easily grow with your organization as it expands. Our user-friendly interface ensures that teams of any size can quickly adapt and start benefiting from DESKS's features.",
  },
  {
    question: "What key features does DESKS offer?",
    answer:
      "DESKS provides a range of powerful features including intuitive Kanban boards for visualizing workflow, robust sprint planning tools for agile teams, comprehensive reporting for data-driven decisions, customizable workflows, time tracking, and team collaboration tools. These features work seamlessly together to enhance your project management experience.",
  },
  {
    question: "Can DESKS handle multiple projects simultaneously?",
    answer:
      "Yes, DESKS is built to manage multiple projects concurrently. You can easily switch between projects, and get a bird's-eye view of all your ongoing work. This makes DESKS ideal for organizations juggling multiple projects or clients.",
  },
  {
    question: "Is there a learning curve for new users?",
    answer:
      "While DESKS is packed with features, we've designed it with user-friendliness in mind. New users can quickly get up to speed thanks to our intuitive interface, helpful onboarding process, and comprehensive documentation.",
  },
];

const features = [
  {
    title: "Intuitive Kanban Boards",
    description:
      "Visualize your workflow and optimize team productivity with our easy-to-use Kanban boards.",
    icon: Layout,
  },
  {
    title: "Powerful Sprint Planning",
    description:
      "Plan and manage sprints effectively, ensuring your team stays focused on delivering value.",
    icon: Calendar,
  },
  {
    title: "Comprehensive Reporting",
    description:
      "Gain insights into your team's performance with detailed, customizable reports and analytics.",
    icon: BarChart,
  },
];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } }
};

const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const logoAnimation = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.8 
    } 
  }
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto py-20 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 
            className="text-6xl sm:text-7xl lg:text-8xl font-extrabold gradient-title pb-6 flex flex-col"
            variants={fadeIn}
          >
            <motion.span variants={slideUp}>Streamline Your Workflow</motion.span> <br />
            <motion.span className="flex mx-auto gap-3 sm:gap-4 items-center" variants={slideUp}>
              with
              <motion.div variants={logoAnimation}>
                <Image
                  src={"/logo2.png"}
                  alt="DESKS Logo"
                  width={1500}
                  height={300}
                  className="h-48 sm:h-64 lg:h-80 w-auto object-contain"
                  style={{ marginBottom: "-0.5rem", verticalAlign: "middle" }}
                />
              </motion.div>
            </motion.span>
          </motion.h1>
          <motion.p 
            className="text-xl text-white mb-10 max-w-3xl mx-auto"
            variants={slideUp}
          >
            Empower your team with our intuitive project management solution.
          </motion.p>
          <motion.div variants={slideUp}>
            <Link href="/onboarding">
              <Button size="lg" className="mr-4">
                Get Started <ChevronRight size={18} className="ml-1" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-900 py-20 px-5">
        <div className="container mx-auto">
          <motion.h3 
            className="text-3xl font-bold mb-12 text-center gradient-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Key Features
          </motion.h3>
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={slideUp}>
                <Card className="bg-gray-800 hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      whileInView={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 100 }}
                      viewport={{ once: true }}
                    >
                      <feature.icon className="h-12 w-12 mb-4 text-blue-300" />
                    </motion.div>
                    <h4 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-white">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Companies Carousel */}
      <section className="py-20">
        <div className="container mx-auto">
          <motion.h3 
            className="text-3xl font-bold mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Trusted by Industry Leaders
          </motion.h3>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <CompanyCarousel />
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-900 py-20 px-5">
        <div className="container mx-auto">
          <motion.h3 
            className="text-3xl font-bold mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Frequently Asked Questions
          </motion.h3>
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <motion.div key={index} variants={slideUp}>
                  <AccordionItem value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center px-5">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            <motion.h3 
              className="text-3xl font-bold mb-6"
              variants={slideUp}
            >
              Ready to Transform Your Workflow?
            </motion.h3>
            <motion.p 
              className="text-xl text-white mb-12"
              variants={slideUp}
            >
              Join thousands of teams already using DESKS to streamline their
              projects and boost productivity.
            </motion.p>
            <motion.div
              variants={slideUp}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/onboarding">
                <Button size="lg" className="animate-bounce">
                  Start For Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
