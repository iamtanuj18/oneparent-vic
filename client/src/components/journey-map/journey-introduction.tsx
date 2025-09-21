'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { ANIMATION_CONFIG } from '@/lib/animation';

interface JourneyIntroductionProps {
  onStartAssessment: () => void;
}

export default function JourneyIntroduction({ onStartAssessment }: JourneyIntroductionProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Your"
        titleGradientText="Journey"
        subtitle="Understanding your experience as a single parent through real data and insights from other families in Victoria"
      />

      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* text content column */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
                viewport={{ once: true, margin: "-100px" }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-gray-900">
                    Adjusting to Single Parenthood
                  </h2>
                  
                  <p className="text-xl text-gray-600 leading-relaxed">
                    You are not alone in this journey. The transition to single parenthood brings unique challenges, but also opportunities for growth and resilience.
                  </p>
                </div>

                {/* hilda research insights card */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Based on{' '}
                    <a 
                      href="https://melbourneinstitute.unimelb.edu.au/__data/assets/pdf_file/0003/5229912/2024-HILDA-Statistical-Report.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      HILDA Survey Research
                    </a>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></div>
                      <p className="text-gray-700">
                        <strong>Many single parents</strong> experience significant stress during the first years after separation, but this typically improves over time.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></div>
                      <p className="text-gray-700">
                        <strong>Mental health challenges</strong> are common initially, but show marked improvement as new routines and support systems develop.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></div>
                      <p className="text-gray-700">
                        <strong>Childcare and housing costs</strong> create unique financial pressures that most single parent families navigate successfully.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    The adjustment period can feel overwhelming. Feelings of exhaustion, stress, and uncertainty about the future are completely normal. Many parents also experience mixed emotions as their sense of identity evolves.
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    But here's what the research also shows: <strong className="text-blue-700">recovery and growth are the norm</strong>. Most single parents develop effective coping strategies, build meaningful support networks, and establish fulfilling new life patterns.
                  </p>
                </div>

                <div className="pt-6">
                  <button
                    onClick={onStartAssessment}
                    className="btn-primary group"
                  >
                    See Your Journey Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>

              {/* images column with floating layout */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: ANIMATION_CONFIG.duration, delay: 0.2, ease: ANIMATION_CONFIG.ease }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative"
              >
                {/* main large image */}
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/journey-main.png"
                    alt="single parent with child showing resilience and hope"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>

                {/* floating secondary images */}
                <div className="absolute -top-8 -right-8 w-32 h-32 lg:w-40 lg:h-40 rounded-xl overflow-hidden shadow-xl border-4 border-white">
                  <Image
                    src="/images/journey-support.png"
                    alt="single parents supporting each other"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 128px, 160px"
                  />
                </div>

                <div className="absolute -bottom-6 -left-6 w-28 h-28 lg:w-36 lg:h-36 rounded-xl overflow-hidden shadow-xl border-4 border-white">
                  <Image
                    src="/images/journey-growth.png"
                    alt="personal growth and development"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 112px, 144px"
                  />
                </div>

                {/* decorative elements */}
                <div className="absolute top-1/4 -left-4 w-8 h-8 bg-blue-200 rounded-full opacity-60"></div>
                <div className="absolute bottom-1/3 -right-2 w-6 h-6 bg-purple-200 rounded-full opacity-60"></div>
                <div className="absolute top-3/4 left-1/4 w-4 h-4 bg-green-200 rounded-full opacity-60"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}